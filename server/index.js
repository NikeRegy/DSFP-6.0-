const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  hashPassword,
  verifyPassword,
  signToken,
  extractUser,
  requireAuth,
  requireAdmin
} = require('./auth');
const { generateId, readDb, writeDb } = require('./store');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const UPLOAD_DIR = process.env.VERCEL
  ? path.join('/tmp', 'skyhire-uploads')
  : path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json({ limit: '2mb' }));

// Configure safe resume upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.pdf', '.doc', '.docx', '.txt'].includes(ext) ? ext : '.bin';
    cb(null, `${generateId('resume')}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.doc', '.docx', '.txt'].includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, DOCX, or TXT files are allowed for resumes.'));
  }
});

const VALID_JOB_STATUSES = ['Open', 'Closed', 'Draft'];
const VALID_APP_STATUSES = ['Submitted', 'Under Review', 'Interview', 'Offer', 'Rejected'];

function sanitizeUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title || '',
    createdAt: u.createdAt
  };
}

function normalizeListField(val) {
  if (Array.isArray(val)) {
    return val.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(/\r?\n/)
      .map((s) => s.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

// ---------- Auth Routes ----------

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, title } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: generateId('usr'),
    name: String(name).trim(),
    email: cleanEmail,
    role: 'user',
    title: title ? String(title).trim() : 'Applicant',
    passwordHash: hashPassword(String(password)),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);

  const safeUser = sanitizeUser(newUser);
  const token = signToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, name: safeUser.name });
  res.status(201).json({ user: safeUser, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user || !verifyPassword(String(password), user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const safeUser = sanitizeUser(user);
  const token = signToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, name: safeUser.name });
  res.json({ user: safeUser, token });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user: sanitizeUser(user) });
});

// ---------- Job Routes ----------

app.get('/api/jobs', (req, res) => {
  const currentUser = extractUser(req);
  const isAdmin = currentUser && currentUser.role === 'admin';
  const includeAll = isAdmin && req.query.includeAll === '1';

  const db = readDb();
  const appsByJob = new Map();
  const myAppByJob = new Map();

  for (const appItem of db.applications) {
    appsByJob.set(appItem.jobId, (appsByJob.get(appItem.jobId) || 0) + 1);
    if (currentUser && appItem.userId === currentUser.id) {
      myAppByJob.set(appItem.jobId, appItem);
    }
  }

  let jobs = db.jobs.filter((job) => (includeAll ? true : job.status === 'Open'));

  const q = String(req.query.q || '').trim().toLowerCase();
  const department = String(req.query.department || '').trim();
  const workMode = String(req.query.workMode || '').trim();
  const employmentType = String(req.query.employmentType || '').trim();
  const statusFilter = String(req.query.status || '').trim();

  if (q) {
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.summary.toLowerCase().includes(q)
    );
  }
  if (department && department !== 'All') {
    jobs = jobs.filter((j) => j.department === department);
  }
  if (workMode && workMode !== 'All') {
    jobs = jobs.filter((j) => j.workMode === workMode);
  }
  if (employmentType && employmentType !== 'All') {
    jobs = jobs.filter((j) => j.employmentType === employmentType);
  }
  if (includeAll && statusFilter && statusFilter !== 'All') {
    jobs = jobs.filter((j) => j.status === statusFilter);
  }

  jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const enriched = jobs.map((job) => {
    const myApp = myAppByJob.get(job.id);
    return {
      ...job,
      applicantCount: appsByJob.get(job.id) || 0,
      myApplicationId: myApp ? myApp.id : null,
      myApplicationStatus: myApp ? myApp.status : null
    };
  });

  res.json({ jobs: enriched });
});

app.get('/api/jobs/:id', (req, res) => {
  const currentUser = extractUser(req);
  const isAdmin = currentUser && currentUser.role === 'admin';
  const db = readDb();
  const job = db.jobs.find((j) => j.id === req.params.id);
  if (!job || (job.status !== 'Open' && !isAdmin)) {
    return res.status(404).json({ error: 'Job opening not found.' });
  }
  const applicantCount = db.applications.filter((a) => a.jobId === job.id).length;
  const myApp = currentUser
    ? db.applications.find((a) => a.jobId === job.id && a.userId === currentUser.id)
    : null;

  res.json({
    job: {
      ...job,
      applicantCount,
      myApplicationId: myApp ? myApp.id : null,
      myApplicationStatus: myApp ? myApp.status : null
    }
  });
});

app.post('/api/jobs', requireAdmin, (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.department || !body.location || !body.summary) {
    return res.status(400).json({ error: 'Title, department, location, and summary are required.' });
  }

  const status = VALID_JOB_STATUSES.includes(body.status) ? body.status : 'Open';
  const now = new Date().toISOString();

  const newJob = {
    id: generateId('job'),
    title: String(body.title).trim(),
    company: body.company ? String(body.company).trim() : 'Jobify',
    department: String(body.department).trim(),
    location: String(body.location).trim(),
    workMode: body.workMode ? String(body.workMode).trim() : 'Hybrid',
    employmentType: body.employmentType ? String(body.employmentType).trim() : 'Full-time',
    salaryMin: body.salaryMin !== undefined && body.salaryMin !== '' ? Number(body.salaryMin) : null,
    salaryMax: body.salaryMax !== undefined && body.salaryMax !== '' ? Number(body.salaryMax) : null,
    currency: body.currency ? String(body.currency).trim() : 'USD',
    deadline: body.deadline ? String(body.deadline).trim() : '',
    summary: String(body.summary).trim(),
    responsibilities: normalizeListField(body.responsibilities),
    requirements: normalizeListField(body.requirements),
    status,
    createdBy: req.user.id,
    createdAt: now,
    updatedAt: now
  };

  const db = readDb();
  db.jobs.unshift(newJob);
  writeDb(db);

  res.status(201).json({ job: { ...newJob, applicantCount: 0 } });
});

app.put('/api/jobs/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.jobs.findIndex((j) => j.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Job opening not found.' });
  }

  const existing = db.jobs[idx];
  const body = req.body || {};

  const updated = {
    ...existing,
    title: body.title !== undefined ? String(body.title).trim() : existing.title,
    company: body.company !== undefined ? String(body.company).trim() : existing.company,
    department: body.department !== undefined ? String(body.department).trim() : existing.department,
    location: body.location !== undefined ? String(body.location).trim() : existing.location,
    workMode: body.workMode !== undefined ? String(body.workMode).trim() : existing.workMode,
    employmentType:
      body.employmentType !== undefined ? String(body.employmentType).trim() : existing.employmentType,
    salaryMin:
      body.salaryMin !== undefined
        ? body.salaryMin === '' || body.salaryMin === null
          ? null
          : Number(body.salaryMin)
        : existing.salaryMin,
    salaryMax:
      body.salaryMax !== undefined
        ? body.salaryMax === '' || body.salaryMax === null
          ? null
          : Number(body.salaryMax)
        : existing.salaryMax,
    currency: body.currency !== undefined ? String(body.currency).trim() : existing.currency,
    deadline: body.deadline !== undefined ? String(body.deadline).trim() : existing.deadline,
    summary: body.summary !== undefined ? String(body.summary).trim() : existing.summary,
    responsibilities:
      body.responsibilities !== undefined
        ? normalizeListField(body.responsibilities)
        : existing.responsibilities,
    requirements:
      body.requirements !== undefined ? normalizeListField(body.requirements) : existing.requirements,
    status:
      body.status !== undefined && VALID_JOB_STATUSES.includes(body.status)
        ? body.status
        : existing.status,
    updatedAt: new Date().toISOString()
  };

  if (!updated.title || !updated.department || !updated.location || !updated.summary) {
    return res.status(400).json({ error: 'Title, department, location, and summary cannot be empty.' });
  }

  db.jobs[idx] = updated;
  writeDb(db);

  const applicantCount = db.applications.filter((a) => a.jobId === updated.id).length;
  res.json({ job: { ...updated, applicantCount } });
});

app.delete('/api/jobs/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.jobs.findIndex((j) => j.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Job opening not found.' });
  }

  const [removed] = db.jobs.splice(idx, 1);
  // Clean up uploaded resume files for deleted job's applications
  const remainingApps = [];
  for (const appItem of db.applications) {
    if (appItem.jobId === removed.id) {
      if (appItem.resumeFile && appItem.resumeFile.storedName) {
        const fp = path.join(UPLOAD_DIR, path.basename(appItem.resumeFile.storedName));
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    } else {
      remainingApps.push(appItem);
    }
  }
  db.applications = remainingApps;
  writeDb(db);

  res.json({ deletedId: removed.id });
});

// ---------- Application Routes (Normal User & Admin) ----------

app.post('/api/jobs/:id/apply', (req, res) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }

    const reqUser = extractUser(req);
    if (reqUser && reqUser.role === 'admin') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: 'Admins manage openings rather than applying. Switch to a normal user account to apply.'
      });
    }

    const db = readDb();
    const job = db.jobs.find((j) => j.id === req.params.id);
    if (!job || job.status !== 'Open') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'This job opening is no longer accepting applications.' });
    }

    const body = req.body || {};
    const applicantName = String(body.applicantName || reqUser?.name || '').trim();
    const applicantEmail = String(body.applicantEmail || reqUser?.email || '')
      .trim()
      .toLowerCase();
    const coverLetter = String(body.coverLetter || '').trim();

    if (!applicantName || !applicantEmail || !coverLetter) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ error: 'Full name, email, and a short cover letter / pitch are required.' });
    }

    let activeUser = reqUser;
    let issuedToken = null;
    let issuedUser = null;

    if (!activeUser) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      const existingAccount = db.users.find((u) => u.email.toLowerCase() === applicantEmail);
      if (existingAccount) {
        if (
          existingAccount.role === 'user' &&
          body.password &&
          verifyPassword(String(body.password), existingAccount.passwordHash)
        ) {
          issuedUser = sanitizeUser(existingAccount);
          issuedToken = signToken({
            id: issuedUser.id,
            email: issuedUser.email,
            role: issuedUser.role,
            name: issuedUser.name
          });
          activeUser = issuedUser;
        } else {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(409).json({
            error: 'An account with this email already exists. Please sign in to submit and track your application.'
          });
        }
      } else {
        const rawPass =
          body.password && String(body.password).length >= 6
            ? String(body.password)
            : crypto.randomBytes(12).toString('hex');
        const newUser = {
          id: generateId('usr'),
          name: applicantName,
          email: applicantEmail,
          role: 'user',
          title: 'Applicant',
          passwordHash: hashPassword(rawPass),
          createdAt: new Date().toISOString()
        };
        db.users.push(newUser);
        issuedUser = sanitizeUser(newUser);
        issuedToken = signToken({
          id: issuedUser.id,
          email: issuedUser.email,
          role: issuedUser.role,
          name: issuedUser.name
        });
        activeUser = issuedUser;
      }
    }

    const existing = db.applications.find(
      (a) => a.jobId === job.id && a.userId === activeUser.id
    );
    if (existing) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({ error: 'You have already applied for this job.' });
    }

    const now = new Date().toISOString();
    const application = {
      id: generateId('app'),
      jobId: job.id,
      userId: activeUser.id,
      applicantName,
      applicantEmail,
      phone: body.phone ? String(body.phone).trim() : '',
      portfolioUrl: body.portfolioUrl ? String(body.portfolioUrl).trim() : '',
      yearsExperience: body.yearsExperience ? String(body.yearsExperience).trim() : '',
      coverLetter,
      resumeFile: req.file
        ? {
            originalName: req.file.originalname,
            storedName: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size
          }
        : null,
      status: 'Submitted',
      adminNotes: '',
      statusHistory: [
        {
          status: 'Submitted',
          changedAt: now,
          note: 'Application submitted by candidate.'
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    db.applications.unshift(application);
    writeDb(db);

    res.status(201).json({
      application,
      ...(issuedToken ? { token: issuedToken, user: issuedUser } : {})
    });
  });
});

app.get('/api/my-applications', requireAuth, (req, res) => {
  const db = readDb();
  const jobMap = new Map(db.jobs.map((j) => [j.id, j]));

  const items = db.applications
    .filter((a) => a.userId === req.user.id)
    .map((a) => {
      const job = jobMap.get(a.jobId);
      return {
        ...a,
        job: job
          ? {
              id: job.id,
              title: job.title,
              company: job.company,
              department: job.department,
              location: job.location,
              workMode: job.workMode,
              employmentType: job.employmentType,
              status: job.status
            }
          : null
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json({ applications: items });
});

app.delete('/api/applications/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.applications.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const target = db.applications[idx];
  if (target.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You cannot withdraw another user’s application.' });
  }
  if (target.status === 'Offer' && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Applications in Offer stage cannot be withdrawn directly.' });
  }

  db.applications.splice(idx, 1);
  if (target.resumeFile && target.resumeFile.storedName) {
    const fp = path.join(UPLOAD_DIR, path.basename(target.resumeFile.storedName));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  writeDb(db);

  res.json({ withdrawnId: target.id });
});

app.get('/api/applications/:id/resume', requireAuth, (req, res) => {
  const db = readDb();
  const appItem = db.applications.find((a) => a.id === req.params.id);
  if (!appItem || !appItem.resumeFile) {
    return res.status(404).json({ error: 'Resume file not found.' });
  }
  if (appItem.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to access this resume.' });
  }

  const safeName = path.basename(appItem.resumeFile.storedName);
  const fullPath = path.join(UPLOAD_DIR, safeName);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Resume file is missing from storage.' });
  }

  res.download(fullPath, appItem.resumeFile.originalName);
});

// ---------- Admin Applicant Tracking Routes ----------

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const db = readDb();
  const openJobs = db.jobs.filter((j) => j.status === 'Open').length;
  const closedOrDraftJobs = db.jobs.length - openJobs;
  const totalApplications = db.applications.length;
  const byStatus = {};
  for (const s of VALID_APP_STATUSES) byStatus[s] = 0;
  for (const a of db.applications) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  }

  res.json({
    stats: {
      totalJobs: db.jobs.length,
      openJobs,
      closedOrDraftJobs,
      totalApplications,
      byStatus
    }
  });
});

app.get('/api/admin/applications', requireAdmin, (req, res) => {
  const db = readDb();
  const jobMap = new Map(db.jobs.map((j) => [j.id, j]));
  const jobId = String(req.query.jobId || '').trim();
  const status = String(req.query.status || '').trim();

  let list = db.applications;
  if (jobId && jobId !== 'All') {
    list = list.filter((a) => a.jobId === jobId);
  }
  if (status && status !== 'All') {
    list = list.filter((a) => a.status === status);
  }

  const enriched = list
    .map((a) => {
      const job = jobMap.get(a.jobId);
      return {
        ...a,
        jobTitle: job ? job.title : 'Deleted Role',
        jobDepartment: job ? job.department : '',
        jobLocation: job ? job.location : ''
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ applications: enriched });
});

app.patch('/api/admin/applications/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.applications.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const appItem = db.applications[idx];
  const { status, adminNotes } = req.body || {};
  const now = new Date().toISOString();

  if (status !== undefined) {
    if (!VALID_APP_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid application status.' });
    }
    if (status !== appItem.status) {
      appItem.status = status;
      appItem.statusHistory = appItem.statusHistory || [];
      appItem.statusHistory.push({
        status,
        changedAt: now,
        note: `Status updated to ${status} by ${req.user.name}.`
      });
    }
  }

  if (adminNotes !== undefined) {
    appItem.adminNotes = String(adminNotes).trim();
  }

  appItem.updatedAt = now;
  db.applications[idx] = appItem;
  writeDb(db);

  res.json({ application: appItem });
});

// ---------- Serve Frontend Build if Present ----------

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Jobify Job Tracker API running on http://localhost:${PORT}`);
  });
}

module.exports = app;

