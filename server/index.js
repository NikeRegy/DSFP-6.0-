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
const {
  generateId,
  readDb,
  writeDb,
  VALID_JOB_STATUSES,
  VALID_APP_STATUSES,
  SAVED_CATEGORIES,
  REMINDER_TYPES,
  DOCUMENT_CATEGORIES,
  INTERVIEW_STAGES,
  INTERVIEW_FORMATS,
  INTERVIEW_OUTCOMES
} = require('./store');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const UPLOAD_DIR = process.env.VERCEL
  ? path.join('/tmp', 'jobify-uploads')
  : path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json({ limit: '4mb' }));

// Safe file upload configuration for resumes & career documents
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'].includes(ext)
      ? ext
      : '.bin';
    cb(null, `${generateId('doc')}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'].includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, DOCX, TXT, PNG, or JPG files up to 5MB are allowed.'));
  }
});

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

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function isDateInRange(isoString, rangeKey) {
  if (!rangeKey || rangeKey === 'all') return true;
  if (!isoString) return false;
  const d = new Date(isoString).getTime();
  const now = Date.now();
  const diffDays = (now - d) / (1000 * 60 * 60 * 24);
  if (rangeKey === '7d') return diffDays <= 7;
  if (rangeKey === '30d') return diffDays <= 30;
  if (rangeKey === '90d') return diffDays <= 90;
  return true;
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & PROFILE ROUTES
// -------------------------------------------------------------

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

  const userId = generateId('usr');
  const now = new Date().toISOString();
  const newUser = {
    id: userId,
    name: String(name).trim(),
    email: cleanEmail,
    role: 'user',
    title: title ? String(title).trim() : 'Applicant',
    passwordHash: hashPassword(String(password)),
    createdAt: now
  };

  db.users.push(newUser);

  // Initialize empty career profile for new user
  db.profiles.push({
    id: generateId('prof'),
    userId,
    fullName: newUser.name,
    email: newUser.email,
    phone: '',
    headline: newUser.title,
    location: '',
    bio: '',
    skills: [],
    experience: [],
    education: [],
    linkedInUrl: '',
    portfolioUrl: '',
    preferredCategories: [],
    preferredWorkModes: ['Remote', 'Hybrid'],
    targetSalaryMin: null,
    targetSalaryMax: null,
    currency: 'USD',
    updatedAt: now
  });

  writeDb(db);

  const safeUser = sanitizeUser(newUser);
  const token = signToken({
    id: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    name: safeUser.name
  });
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
  const token = signToken({
    id: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    name: safeUser.name
  });
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

app.get('/api/profile', requireAuth, (req, res) => {
  const db = readDb();
  let profile = db.profiles.find((p) => p.userId === req.user.id);
  if (!profile) {
    profile = {
      id: generateId('prof'),
      userId: req.user.id,
      fullName: req.user.name || '',
      email: req.user.email || '',
      phone: '',
      headline: '',
      location: '',
      bio: '',
      skills: [],
      experience: [],
      education: [],
      linkedInUrl: '',
      portfolioUrl: '',
      preferredCategories: [],
      preferredWorkModes: [],
      targetSalaryMin: null,
      targetSalaryMax: null,
      currency: 'USD',
      updatedAt: new Date().toISOString()
    };
    db.profiles.push(profile);
    writeDb(db);
  }
  res.json({ profile });
});

app.put('/api/profile', requireAuth, (req, res) => {
  const db = readDb();
  let idx = db.profiles.findIndex((p) => p.userId === req.user.id);
  const body = req.body || {};
  const now = new Date().toISOString();

  const skills = Array.isArray(body.skills)
    ? body.skills.map((s) => String(s).trim()).filter(Boolean)
    : typeof body.skills === 'string'
    ? body.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const updatedProfile = {
    id: idx !== -1 ? db.profiles[idx].id : generateId('prof'),
    userId: req.user.id,
    fullName: body.fullName !== undefined ? String(body.fullName).trim() : req.user.name,
    email: body.email !== undefined ? String(body.email).trim() : req.user.email,
    phone: body.phone !== undefined ? String(body.phone).trim() : '',
    headline: body.headline !== undefined ? String(body.headline).trim() : '',
    location: body.location !== undefined ? String(body.location).trim() : '',
    bio: body.bio !== undefined ? String(body.bio).trim() : '',
    skills,
    experience: Array.isArray(body.experience) ? body.experience : [],
    education: Array.isArray(body.education) ? body.education : [],
    linkedInUrl: body.linkedInUrl !== undefined ? String(body.linkedInUrl).trim() : '',
    portfolioUrl: body.portfolioUrl !== undefined ? String(body.portfolioUrl).trim() : '',
    preferredCategories: Array.isArray(body.preferredCategories)
      ? body.preferredCategories
      : typeof body.preferredCategories === 'string'
      ? body.preferredCategories.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    preferredWorkModes: Array.isArray(body.preferredWorkModes) ? body.preferredWorkModes : [],
    targetSalaryMin: body.targetSalaryMin !== undefined && body.targetSalaryMin !== '' ? Number(body.targetSalaryMin) : null,
    targetSalaryMax: body.targetSalaryMax !== undefined && body.targetSalaryMax !== '' ? Number(body.targetSalaryMax) : null,
    currency: body.currency ? String(body.currency).trim() : 'USD',
    updatedAt: now
  };

  if (idx !== -1) {
    db.profiles[idx] = updatedProfile;
  } else {
    db.profiles.push(updatedProfile);
  }

  // Also update user's headline and name if changed
  const uIdx = db.users.findIndex((u) => u.id === req.user.id);
  if (uIdx !== -1) {
    if (updatedProfile.fullName) db.users[uIdx].name = updatedProfile.fullName;
    if (updatedProfile.headline) db.users[uIdx].title = updatedProfile.headline;
  }

  writeDb(db);
  res.json({ profile: updatedProfile });
});

// -------------------------------------------------------------
// 2. JOB DISCOVERY, POSTING & REPORTING ROUTES
// -------------------------------------------------------------

app.get('/api/jobs', (req, res) => {
  const currentUser = extractUser(req);
  const isAdmin = currentUser && currentUser.role === 'admin';
  const includeAll = isAdmin && req.query.includeAll === '1';

  const db = readDb();
  const now = new Date();

  // Maps for rapid lookup
  const appsByJob = new Map();
  const myAppByJob = new Map();
  const mySavedByJob = new Map();

  for (const appItem of db.applications) {
    appsByJob.set(appItem.jobId, (appsByJob.get(appItem.jobId) || 0) + 1);
    if (currentUser && appItem.userId === currentUser.id) {
      myAppByJob.set(appItem.jobId, appItem);
    }
  }

  if (currentUser) {
    for (const saved of db.savedJobs) {
      if (saved.userId === currentUser.id) {
        mySavedByJob.set(saved.jobId, saved);
      }
    }
  }

  let jobs = db.jobs.filter((job) => (includeAll ? true : job.status === 'Open'));

  const q = String(req.query.q || '').trim().toLowerCase();
  const department = String(req.query.department || '').trim();
  const workMode = String(req.query.workMode || '').trim();
  const employmentType = String(req.query.employmentType || '').trim();
  const experienceLevel = String(req.query.experienceLevel || '').trim();
  const statusFilter = String(req.query.status || '').trim();
  const minSalary = req.query.minSalary ? Number(req.query.minSalary) : null;
  const sort = String(req.query.sort || 'newest').trim();

  if (q) {
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.summary.toLowerCase().includes(q) ||
        (j.requirements && j.requirements.some((r) => r.toLowerCase().includes(q)))
    );
  }

  if (department && department !== 'All') {
    jobs = jobs.filter((j) => j.department.toLowerCase() === department.toLowerCase());
  }
  if (workMode && workMode !== 'All') {
    jobs = jobs.filter((j) => j.workMode.toLowerCase() === workMode.toLowerCase());
  }
  if (employmentType && employmentType !== 'All') {
    jobs = jobs.filter((j) => j.employmentType.toLowerCase() === employmentType.toLowerCase());
  }
  if (experienceLevel && experienceLevel !== 'All') {
    jobs = jobs.filter((j) => (j.experienceLevel || 'Mid').toLowerCase() === experienceLevel.toLowerCase());
  }
  if (minSalary && !Number.isNaN(minSalary)) {
    jobs = jobs.filter((j) => (j.salaryMax || j.salaryMin || 0) >= minSalary);
  }
  if (includeAll && statusFilter && statusFilter !== 'All') {
    jobs = jobs.filter((j) => j.status === statusFilter);
  }

  // Sorting
  if (sort === 'oldest') {
    jobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sort === 'salary_desc') {
    jobs.sort((a, b) => (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0));
  } else if (sort === 'deadline_asc') {
    jobs.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  } else {
    // default newest
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const enriched = jobs.map((job) => {
    const myApp = myAppByJob.get(job.id);
    const mySaved = mySavedByJob.get(job.id);

    let isExpired = false;
    let isClosingSoon = false;
    if (job.deadline) {
      const deadlineDate = new Date(job.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < 0) {
        isExpired = true;
      } else if (diffDays <= 3) {
        isClosingSoon = true;
      }
    }

    return {
      ...job,
      applicantCount: appsByJob.get(job.id) || 0,
      isSaved: Boolean(mySaved),
      savedId: mySaved ? mySaved.id : null,
      savedCategory: mySaved ? mySaved.category : null,
      savedNotes: mySaved ? mySaved.notes : null,
      myApplicationId: myApp ? myApp.id : null,
      myApplicationStatus: myApp ? myApp.status : null,
      isExpired,
      isClosingSoon
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
  const mySaved = currentUser
    ? db.savedJobs.find((s) => s.jobId === job.id && s.userId === currentUser.id)
    : null;

  const now = new Date();
  let isExpired = false;
  let isClosingSoon = false;
  if (job.deadline) {
    const deadlineDate = new Date(job.deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 0) isExpired = true;
    else if (diffDays <= 3) isClosingSoon = true;
  }

  res.json({
    job: {
      ...job,
      applicantCount,
      isSaved: Boolean(mySaved),
      savedId: mySaved ? mySaved.id : null,
      savedCategory: mySaved ? mySaved.category : null,
      savedNotes: mySaved ? mySaved.notes : null,
      myApplicationId: myApp ? myApp.id : null,
      myApplicationStatus: myApp ? myApp.status : null,
      isExpired,
      isClosingSoon
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
    logoUrl: body.logoUrl ? String(body.logoUrl).trim() : '',
    department: String(body.department).trim(),
    location: String(body.location).trim(),
    workMode: body.workMode ? String(body.workMode).trim() : 'Hybrid',
    employmentType: body.employmentType ? String(body.employmentType).trim() : 'Full-time',
    experienceLevel: body.experienceLevel ? String(body.experienceLevel).trim() : 'Mid',
    salaryMin: body.salaryMin !== undefined && body.salaryMin !== '' ? Number(body.salaryMin) : null,
    salaryMax: body.salaryMax !== undefined && body.salaryMax !== '' ? Number(body.salaryMax) : null,
    currency: body.currency ? String(body.currency).trim() : 'USD',
    deadline: body.deadline ? String(body.deadline).trim() : '',
    summary: String(body.summary).trim(),
    responsibilities: normalizeListField(body.responsibilities),
    requirements: normalizeListField(body.requirements),
    qualifications: normalizeListField(body.qualifications),
    benefits: normalizeListField(body.benefits),
    applicationInstructions: body.applicationInstructions ? String(body.applicationInstructions).trim() : '',
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
    logoUrl: body.logoUrl !== undefined ? String(body.logoUrl).trim() : existing.logoUrl,
    department: body.department !== undefined ? String(body.department).trim() : existing.department,
    location: body.location !== undefined ? String(body.location).trim() : existing.location,
    workMode: body.workMode !== undefined ? String(body.workMode).trim() : existing.workMode,
    employmentType: body.employmentType !== undefined ? String(body.employmentType).trim() : existing.employmentType,
    experienceLevel: body.experienceLevel !== undefined ? String(body.experienceLevel).trim() : existing.experienceLevel || 'Mid',
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
      body.responsibilities !== undefined ? normalizeListField(body.responsibilities) : existing.responsibilities,
    requirements:
      body.requirements !== undefined ? normalizeListField(body.requirements) : existing.requirements,
    qualifications:
      body.qualifications !== undefined ? normalizeListField(body.qualifications) : existing.qualifications || [],
    benefits:
      body.benefits !== undefined ? normalizeListField(body.benefits) : existing.benefits || [],
    applicationInstructions:
      body.applicationInstructions !== undefined
        ? String(body.applicationInstructions).trim()
        : existing.applicationInstructions || '',
    status:
      body.status !== undefined && VALID_JOB_STATUSES.includes(body.status) ? body.status : existing.status,
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

  // Clean up references in applications, savedJobs, interviews
  db.applications = db.applications.filter((a) => a.jobId !== removed.id);
  db.savedJobs = db.savedJobs.filter((s) => s.jobId !== removed.id);
  db.interviews = db.interviews.filter((i) => i.jobId !== removed.id);
  db.jobReports = db.jobReports.filter((r) => r.jobId !== removed.id);

  writeDb(db);
  res.json({ deletedId: removed.id });
});

app.post('/api/jobs/:id/report', requireAuth, (req, res) => {
  const { reason, details } = req.body || {};
  if (!reason) {
    return res.status(400).json({ error: 'A reason for reporting is required.' });
  }

  const db = readDb();
  const job = db.jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job opening not found.' });
  }

  const report = {
    id: generateId('rep'),
    userId: req.user.id,
    userName: req.user.name,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    reason: String(reason).trim(),
    details: details ? String(details).trim() : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    resolvedAt: null
  };

  db.jobReports.unshift(report);
  writeDb(db);

  res.status(201).json({ report, message: 'Thank you for reporting. Our moderation team will review this listing.' });
});

// -------------------------------------------------------------
// 3. SAVED JOBS ROUTES
// -------------------------------------------------------------

app.get('/api/saved-jobs', requireAuth, (req, res) => {
  const db = readDb();
  const jobMap = new Map(db.jobs.map((j) => [j.id, j]));

  const list = db.savedJobs
    .filter((s) => s.userId === req.user.id)
    .map((s) => {
      const job = jobMap.get(s.jobId);
      return {
        ...s,
        job: job || null
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json({ savedJobs: list });
});

app.post('/api/saved-jobs', requireAuth, (req, res) => {
  const { jobId, category, notes } = req.body || {};
  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required.' });
  }

  const db = readDb();
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const existing = db.savedJobs.find((s) => s.userId === req.user.id && s.jobId === jobId);
  if (existing) {
    return res.status(409).json({ error: 'This job is already in your Saved Jobs.' });
  }

  const cat = SAVED_CATEGORIES.includes(category) ? category : 'Interested';
  const now = new Date().toISOString();

  const savedRecord = {
    id: generateId('save'),
    userId: req.user.id,
    jobId,
    category: cat,
    notes: notes ? String(notes).trim() : '',
    createdAt: now,
    updatedAt: now
  };

  db.savedJobs.unshift(savedRecord);
  writeDb(db);

  res.status(201).json({ savedJob: { ...savedRecord, job } });
});

app.patch('/api/saved-jobs/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.savedJobs.findIndex((s) => s.id === req.params.id && s.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Saved job record not found.' });
  }

  const { category, notes } = req.body || {};
  if (category && SAVED_CATEGORIES.includes(category)) {
    db.savedJobs[idx].category = category;
  }
  if (notes !== undefined) {
    db.savedJobs[idx].notes = String(notes).trim();
  }
  db.savedJobs[idx].updatedAt = new Date().toISOString();

  writeDb(db);
  res.json({ savedJob: db.savedJobs[idx] });
});

app.delete('/api/saved-jobs/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.savedJobs.findIndex((s) => s.id === req.params.id && s.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Saved job record not found.' });
  }

  const [removed] = db.savedJobs.splice(idx, 1);
  writeDb(db);
  res.json({ removedId: removed.id });
});

// -------------------------------------------------------------
// 4. ADVANCED APPLICATION TRACKING & TIMELINE
// -------------------------------------------------------------

app.post('/api/jobs/:id/apply', (req, res) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }

    const reqUser = extractUser(req);
    if (reqUser && reqUser.role === 'admin') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: 'Admins manage openings rather than applying. Switch to a normal applicant account to apply.'
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
      return res.status(400).json({ error: 'Full name, email, and cover letter / pitch are required.' });
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

        db.profiles.push({
          id: generateId('prof'),
          userId: newUser.id,
          fullName: newUser.name,
          email: newUser.email,
          phone: body.phone ? String(body.phone).trim() : '',
          headline: 'Applicant',
          location: '',
          bio: '',
          skills: [],
          experience: [],
          education: [],
          linkedInUrl: '',
          portfolioUrl: body.portfolioUrl ? String(body.portfolioUrl).trim() : '',
          preferredCategories: [],
          preferredWorkModes: [],
          targetSalaryMin: null,
          targetSalaryMax: null,
          currency: 'USD',
          updatedAt: new Date().toISOString()
        });

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

    // Check if user attached an existing document from document hub
    let resumeFile = null;
    let cvDocumentId = (body.cvDocumentId || body.documentId) ? String(body.cvDocumentId || body.documentId).trim() : '';
    let cvVersionName = (body.cvVersionName || body.versionName) ? String(body.cvVersionName || body.versionName).trim() : '';

    if (req.file) {
      resumeFile = {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size
      };
      // Automatically record in document hub as well
      const newDoc = {
        id: generateId('doc'),
        userId: activeUser.id,
        name: `Resume - ${job.title}`,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category: 'Tech CV',
        description: `Submitted for ${job.title} at ${job.company}`,
        createdAt: now,
        updatedAt: now
      };
      db.documents.unshift(newDoc);
      cvDocumentId = newDoc.id;
      cvVersionName = newDoc.name;
    } else if (cvDocumentId) {
      const doc = db.documents.find((d) => d.id === cvDocumentId && d.userId === activeUser.id);
      if (doc) {
        resumeFile = {
          originalName: doc.originalName,
          storedName: doc.storedName,
          mimeType: doc.mimeType,
          size: doc.size
        };
        cvVersionName = doc.name;
      }
    }

    const application = {
      id: generateId('app'),
      jobId: job.id,
      userId: activeUser.id,
      applicantName,
      applicantEmail,
      phone: body.phone ? String(body.phone).trim() : '',
      portfolioUrl: body.portfolioUrl ? String(body.portfolioUrl).trim() : '',
      yearsExperience: body.yearsExperience ? String(body.yearsExperience).trim() : '',
      salaryExpectations: body.salaryExpectations ? String(body.salaryExpectations).trim() : '',
      recruiterName: body.recruiterName ? String(body.recruiterName).trim() : '',
      recruiterEmail: body.recruiterEmail ? String(body.recruiterEmail).trim() : '',
      recruiterPhone: body.recruiterPhone ? String(body.recruiterPhone).trim() : '',
      personalNotes: body.personalNotes ? String(body.personalNotes).trim() : '',
      nextAction: body.nextAction ? String(body.nextAction).trim() : 'Wait for initial recruiter review',
      followUpDate: body.followUpDate ? String(body.followUpDate).trim() : '',
      cvDocumentId,
      cvVersionName,
      coverLetter,
      resumeFile,
      status: 'Applied / Submitted',
      adminNotes: '',
      archived: false,
      statusHistory: [
        {
          status: 'Applied / Submitted',
          changedAt: now,
          note: 'Application submitted by candidate.'
        }
      ],
      timeline: [
        {
          id: generateId('tl'),
          eventType: 'Application Submitted',
          description: `Applied for ${job.title} at ${job.company}.`,
          previousStatus: 'Saved',
          newStatus: 'Applied / Submitted',
          notes: 'Cover letter and credentials submitted.',
          source: 'applicant',
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    db.applications.unshift(application);

    // If this job was previously saved, update category or remove
    const savedIdx = db.savedJobs.findIndex((s) => s.userId === activeUser.id && s.jobId === job.id);
    if (savedIdx !== -1) {
      db.savedJobs[savedIdx].category = 'Planning to Apply';
    }

    // Auto-create a follow-up reminder 5 days out
    const followDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    db.reminders.push({
      id: generateId('rem'),
      userId: activeUser.id,
      applicationId: application.id,
      title: `Follow up on application for ${job.title}`,
      reminderDate: followDate,
      reminderTime: '10:00',
      type: 'Follow-up',
      notes: `Send gentle check-in if recruiter has not updated status for ${job.company}.`,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    });

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
  const interviewsByApp = new Map();

  for (const intItem of db.interviews) {
    if (intItem.userId === req.user.id) {
      const arr = interviewsByApp.get(intItem.applicationId) || [];
      arr.push(intItem);
      interviewsByApp.set(intItem.applicationId, arr);
    }
  }

  const status = String(req.query.status || '').trim();
  const company = String(req.query.company || '').trim().toLowerCase();
  const q = String(req.query.q || '').trim().toLowerCase();
  const showArchived = req.query.archived === '1';

  let list = db.applications.filter((a) => {
    if (a.userId !== req.user.id) return false;
    if (showArchived) return a.archived === true;
    return a.archived !== true;
  });

  if (status && status !== 'All') {
    list = list.filter((a) => a.status === status);
  }

  const enriched = list
    .map((a) => {
      const job = jobMap.get(a.jobId);
      return {
        ...a,
        job: job || null,
        interviews: interviewsByApp.get(a.id) || []
      };
    })
    .filter((item) => {
      if (company && (!item.job || !item.job.company.toLowerCase().includes(company))) return false;
      if (q) {
        const titleMatch = item.job && item.job.title.toLowerCase().includes(q);
        const compMatch = item.job && item.job.company.toLowerCase().includes(q);
        const noteMatch = item.personalNotes && item.personalNotes.toLowerCase().includes(q);
        if (!titleMatch && !compMatch && !noteMatch) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json({ applications: enriched });
});

app.get('/api/applications/:id', requireAuth, (req, res) => {
  const db = readDb();
  const appItem = db.applications.find((a) => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  if (appItem.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to view this application.' });
  }

  const job = db.jobs.find((j) => j.id === appItem.jobId);
  const interviews = db.interviews.filter((i) => i.applicationId === appItem.id);
  const reminders = db.reminders.filter((r) => r.applicationId === appItem.id);

  res.json({
    application: {
      ...appItem,
      job: job || null,
      interviews,
      reminders
    }
  });
});

app.put('/api/applications/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.applications.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const appItem = db.applications[idx];
  const isOwner = appItem.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to edit this application.' });
  }

  const body = req.body || {};
  const now = new Date().toISOString();
  const prevStatus = appItem.status;

  if (body.status !== undefined) {
    if (!VALID_APP_STATUSES.includes(body.status)) {
      return res.status(400).json({ error: `Invalid application status: ${body.status}` });
    }
    if (body.status !== prevStatus) {
      appItem.status = body.status;
      appItem.statusHistory = appItem.statusHistory || [];
      appItem.statusHistory.push({
        status: body.status,
        changedAt: now,
        note: body.statusNote || `Status updated from ${prevStatus} to ${body.status} by ${req.user.name}.`
      });

      appItem.timeline = appItem.timeline || [];
      appItem.timeline.unshift({
        id: generateId('tl'),
        eventType: 'Status Changed',
        description: `Status changed to ${body.status}.`,
        previousStatus: prevStatus,
        newStatus: body.status,
        notes: body.statusNote || '',
        source: isAdmin ? 'recruiter' : 'applicant',
        createdAt: now
      });
    }
  }

  if (body.salaryExpectations !== undefined) appItem.salaryExpectations = String(body.salaryExpectations).trim();
  if (body.recruiterName !== undefined) appItem.recruiterName = String(body.recruiterName).trim();
  if (body.recruiterEmail !== undefined) appItem.recruiterEmail = String(body.recruiterEmail).trim();
  if (body.recruiterPhone !== undefined) appItem.recruiterPhone = String(body.recruiterPhone).trim();
  if (body.personalNotes !== undefined) appItem.personalNotes = String(body.personalNotes).trim();
  if (body.nextAction !== undefined) appItem.nextAction = String(body.nextAction).trim();
  if (body.followUpDate !== undefined) appItem.followUpDate = String(body.followUpDate).trim();
  if (body.cvVersionName !== undefined) appItem.cvVersionName = String(body.cvVersionName).trim();
  if (body.cvDocumentId !== undefined) appItem.cvDocumentId = String(body.cvDocumentId).trim();
  if (body.archived !== undefined) appItem.archived = Boolean(body.archived);

  appItem.updatedAt = now;
  db.applications[idx] = appItem;
  writeDb(db);

  res.json({ application: appItem });
});

app.post('/api/applications/:id/timeline', requireAuth, (req, res) => {
  const { eventType, description, notes } = req.body || {};
  if (!description && !notes) {
    return res.status(400).json({ error: 'Description or notes required.' });
  }
  const cleanEventType = eventType ? String(eventType).trim() : 'Activity Note';
  const cleanDesc = description ? String(description).trim() : String(notes).trim();

  const db = readDb();
  const idx = db.applications.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const appItem = db.applications[idx];
  if (appItem.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized.' });
  }

  const now = new Date().toISOString();
  const newEvent = {
    id: generateId('tl'),
    eventType: cleanEventType,
    description: cleanDesc,
    previousStatus: appItem.status,
    newStatus: appItem.status,
    notes: notes ? String(notes).trim() : '',
    source: req.user.role === 'admin' ? 'recruiter' : 'applicant',
    createdAt: now
  };

  appItem.timeline = appItem.timeline || [];
  appItem.timeline.unshift(newEvent);
  appItem.updatedAt = now;

  db.applications[idx] = appItem;
  writeDb(db);

  res.status(201).json({ timelineEvent: newEvent, application: appItem });
});

app.patch('/api/applications/:id/archive', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.applications.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  const appItem = db.applications[idx];
  if (appItem.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized.' });
  }

  appItem.archived = !appItem.archived;
  appItem.updatedAt = new Date().toISOString();
  db.applications[idx] = appItem;
  writeDb(db);

  res.json({ application: appItem, archived: appItem.archived });
});

app.delete('/api/applications/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.applications.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const target = db.applications[idx];
  if (target.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You cannot delete another candidate’s application.' });
  }

  db.applications.splice(idx, 1);

  // Clean up associated reminders and interviews
  db.reminders = db.reminders.filter((r) => r.applicationId !== target.id);
  db.interviews = db.interviews.filter((i) => i.applicationId !== target.id);

  writeDb(db);
  res.json({ deletedId: target.id });
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

// -------------------------------------------------------------
// 5. FOLLOW-UP REMINDER SYSTEM
// -------------------------------------------------------------

app.get('/api/reminders', requireAuth, (req, res) => {
  const db = readDb();
  const list = db.reminders
    .filter((r) => r.userId === req.user.id)
    .sort((a, b) => new Date(`${a.reminderDate}T${a.reminderTime || '00:00'}`) - new Date(`${b.reminderDate}T${b.reminderTime || '00:00'}`));

  res.json({ reminders: list });
});

app.post('/api/reminders', requireAuth, (req, res) => {
  const { applicationId, title, reminderDate, reminderTime, type, notes } = req.body || {};
  if (!reminderDate) {
    return res.status(400).json({ error: 'Reminder date is required.' });
  }

  const now = new Date().toISOString();
  const remType = REMINDER_TYPES.includes(type) ? type : 'Follow-up';
  const cleanTitle = title ? String(title).trim() : (notes ? String(notes).slice(0, 50) : `${remType} Reminder`);

  const newReminder = {
    id: generateId('rem'),
    userId: req.user.id,
    applicationId: applicationId ? String(applicationId).trim() : '',
    title: cleanTitle,
    reminderDate: String(reminderDate).trim(),
    reminderTime: reminderTime ? String(reminderTime).trim() : '09:00',
    type: remType,
    notes: notes ? String(notes).trim() : '',
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  };

  const db = readDb();
  db.reminders.unshift(newReminder);
  writeDb(db);

  res.status(201).json({ reminder: newReminder });
});

app.patch('/api/reminders/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.reminders.findIndex((r) => r.id === req.params.id && r.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Reminder not found.' });
  }

  const rem = db.reminders[idx];
  const body = req.body || {};
  const now = new Date().toISOString();

  if (body.completed !== undefined) {
    rem.completed = Boolean(body.completed);
    rem.completedAt = rem.completed ? now : null;
  }
  if (body.title !== undefined) rem.title = String(body.title).trim();
  if (body.reminderDate !== undefined) rem.reminderDate = String(body.reminderDate).trim();
  if (body.reminderTime !== undefined) rem.reminderTime = String(body.reminderTime).trim();
  if (body.type !== undefined && REMINDER_TYPES.includes(body.type)) rem.type = body.type;
  if (body.notes !== undefined) rem.notes = String(body.notes).trim();

  rem.updatedAt = now;
  db.reminders[idx] = rem;
  writeDb(db);

  res.json({ reminder: rem });
});

app.delete('/api/reminders/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.reminders.findIndex((r) => r.id === req.params.id && r.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Reminder not found.' });
  }

  const [removed] = db.reminders.splice(idx, 1);
  writeDb(db);
  res.json({ deletedId: removed.id });
});

// -------------------------------------------------------------
// 6. CV & DOCUMENT MANAGEMENT
// -------------------------------------------------------------

app.get('/api/documents', requireAuth, (req, res) => {
  const db = readDb();
  const docs = db.documents
    .filter((d) => d.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ documents: docs });
});

app.post('/api/documents', requireAuth, (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Document upload failed.' });
    }
    const uploadedFile = (req.files && req.files[0]) || req.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: 'Please choose a document file to upload.' });
    }

    const body = req.body || {};
    const name = body.title || body.name ? String(body.title || body.name).trim() : uploadedFile.originalname;
    const category = body.category ? String(body.category).trim() : 'General CV';
    const now = new Date().toISOString();

    const newDoc = {
      id: generateId('doc'),
      userId: req.user.id,
      name,
      title: name,
      originalName: uploadedFile.originalname,
      storedName: uploadedFile.filename,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      category,
      description: body.description ? String(body.description).trim() : '',
      createdAt: now,
      updatedAt: now
    };

    const db = readDb();
    db.documents.unshift(newDoc);
    writeDb(db);

    res.status(201).json({ document: newDoc });
  });
});

app.patch('/api/documents/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.documents.findIndex((d) => d.id === req.params.id && d.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const doc = db.documents[idx];
  const { name, title, category, description } = req.body || {};
  if (title !== undefined) {
    doc.title = String(title).trim();
    doc.name = String(title).trim();
  } else if (name !== undefined) {
    doc.name = String(name).trim();
    doc.title = String(name).trim();
  }
  if (category !== undefined) doc.category = String(category).trim();
  if (description !== undefined) doc.description = String(description).trim();
  doc.updatedAt = new Date().toISOString();

  db.documents[idx] = doc;
  writeDb(db);
  res.json({ document: doc });
});

app.delete('/api/documents/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.documents.findIndex((d) => d.id === req.params.id && d.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const [removed] = db.documents.splice(idx, 1);
  if (removed.storedName) {
    const fp = path.join(UPLOAD_DIR, path.basename(removed.storedName));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  writeDb(db);
  res.json({ deletedId: removed.id });
});

app.get('/api/documents/:id/download', requireAuth, (req, res) => {
  const db = readDb();
  const doc = db.documents.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  if (doc.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to download this document.' });
  }

  const fp = path.join(UPLOAD_DIR, path.basename(doc.storedName));
  if (!fs.existsSync(fp)) {
    return res.status(404).json({ error: 'File is missing from disk.' });
  }

  res.download(fp, doc.originalName || `${doc.name}.pdf`);
});

// -------------------------------------------------------------
// 7. INTERVIEW MANAGEMENT
// -------------------------------------------------------------

app.get('/api/interviews', requireAuth, (req, res) => {
  const db = readDb();
  const list = db.interviews
    .filter((i) => i.userId === req.user.id)
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

  res.json({ interviews: list });
});

app.post('/api/interviews', requireAuth, (req, res) => {
  const body = req.body || {};
  const intDate = body.interviewDate || body.date;
  if (!body.company || !body.position || !intDate) {
    return res.status(400).json({ error: 'Company, position, and interview date are required.' });
  }

  const now = new Date().toISOString();
  const stage = body.stage ? String(body.stage).trim() : 'Technical interview';
  const format = body.format ? String(body.format).trim() : 'Video';
  const status = body.status || body.outcome || 'Scheduled';
  const locationOrLink = body.locationOrLink || body.location || '';
  const questionsExpected = body.questionsToExpect || body.questionsExpected || '';

  const newInterview = {
    id: generateId('int'),
    userId: req.user.id,
    applicationId: body.applicationId ? String(body.applicationId).trim() : '',
    jobId: body.jobId ? String(body.jobId).trim() : '',
    company: String(body.company).trim(),
    position: String(body.position).trim(),
    stage,
    format,
    date: String(intDate).trim(),
    interviewDate: String(intDate).trim(),
    time: body.time ? String(body.time).trim() : '10:00',
    location: String(locationOrLink).trim(),
    locationOrLink: String(locationOrLink).trim(),
    interviewerName: body.interviewerName ? String(body.interviewerName).trim() : '',
    interviewerEmail: body.interviewerEmail ? String(body.interviewerEmail).trim() : '',
    interviewerPhone: body.interviewerPhone ? String(body.interviewerPhone).trim() : '',
    prepNotes: body.prepNotes ? String(body.prepNotes).trim() : '',
    questionsExpected: String(questionsExpected).trim(),
    questionsToExpect: String(questionsExpected).trim(),
    questionsAsked: body.questionsAsked ? String(body.questionsAsked).trim() : '',
    feedback: body.feedback ? String(body.feedback).trim() : '',
    outcome: status,
    status,
    createdAt: now,
    updatedAt: now
  };

  const db = readDb();
  db.interviews.unshift(newInterview);

  // If tied to an application, log a timeline entry and move status to Interview
  if (newInterview.applicationId) {
    const aIdx = db.applications.findIndex((a) => a.id === newInterview.applicationId && a.userId === req.user.id);
    if (aIdx !== -1) {
      const appItem = db.applications[aIdx];
      const prev = appItem.status;
      appItem.status = 'Interview';
      appItem.timeline = appItem.timeline || [];
      appItem.timeline.unshift({
        id: generateId('tl'),
        eventType: 'Interview Scheduled',
        description: `${stage} scheduled with ${newInterview.company} for ${newInterview.date} at ${newInterview.time}.`,
        previousStatus: prev,
        newStatus: 'Interview',
        notes: newInterview.location ? `Meeting Location / Link: ${newInterview.location}` : '',
        source: 'applicant',
        createdAt: now
      });
      appItem.updatedAt = now;
      db.applications[aIdx] = appItem;
    }
  }

  // Create an interview preparation reminder
  const prepDate = new Date(new Date(newInterview.date).getTime() - 86400000).toISOString().slice(0, 10);
  db.reminders.push({
    id: generateId('rem'),
    userId: req.user.id,
    applicationId: newInterview.applicationId,
    title: `Prep for ${stage} at ${newInterview.company}`,
    reminderDate: prepDate > now.slice(0, 10) ? prepDate : newInterview.date,
    reminderTime: '09:00',
    type: 'Interview Prep',
    notes: `Review expected questions and questions to ask for ${newInterview.position}.`,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  });

  writeDb(db);
  res.status(201).json({ interview: newInterview });
});

app.patch('/api/interviews/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.interviews.findIndex((i) => i.id === req.params.id && i.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Interview not found.' });
  }

  const interview = db.interviews[idx];
  const body = req.body || {};
  const now = new Date().toISOString();
  const prevOutcome = interview.outcome;

  if (body.company !== undefined) interview.company = String(body.company).trim();
  if (body.position !== undefined) interview.position = String(body.position).trim();
  if (body.stage !== undefined) interview.stage = String(body.stage).trim();
  if (body.format !== undefined) interview.format = String(body.format).trim();
  if (body.interviewDate !== undefined || body.date !== undefined) {
    const d = String(body.interviewDate || body.date).trim();
    interview.date = d;
    interview.interviewDate = d;
  }
  if (body.time !== undefined) interview.time = String(body.time).trim();
  if (body.locationOrLink !== undefined || body.location !== undefined) {
    const loc = String(body.locationOrLink || body.location).trim();
    interview.location = loc;
    interview.locationOrLink = loc;
  }
  if (body.interviewerName !== undefined) interview.interviewerName = String(body.interviewerName).trim();
  if (body.interviewerEmail !== undefined) interview.interviewerEmail = String(body.interviewerEmail).trim();
  if (body.interviewerPhone !== undefined) interview.interviewerPhone = String(body.interviewerPhone).trim();
  if (body.prepNotes !== undefined) interview.prepNotes = String(body.prepNotes).trim();
  if (body.questionsToExpect !== undefined || body.questionsExpected !== undefined) {
    const q = String(body.questionsToExpect || body.questionsExpected).trim();
    interview.questionsExpected = q;
    interview.questionsToExpect = q;
  }
  if (body.questionsAsked !== undefined) interview.questionsAsked = String(body.questionsAsked).trim();
  if (body.feedback !== undefined) interview.feedback = String(body.feedback).trim();
  if (body.status !== undefined || body.outcome !== undefined) {
    const nextOutcome = String(body.status || body.outcome).trim();
    interview.outcome = nextOutcome;
    interview.status = nextOutcome;
    if (nextOutcome !== prevOutcome && interview.applicationId) {
      const aIdx = db.applications.findIndex((a) => a.id === interview.applicationId && a.userId === req.user.id);
      if (aIdx !== -1) {
        db.applications[aIdx].timeline = db.applications[aIdx].timeline || [];
        db.applications[aIdx].timeline.unshift({
          id: generateId('tl'),
          eventType: 'Interview Outcome Logged',
          description: `${interview.stage} outcome marked as ${body.outcome}.`,
          previousStatus: db.applications[aIdx].status,
          newStatus: body.outcome === 'Passed' ? 'Offer' : db.applications[aIdx].status,
          notes: interview.feedback || '',
          source: 'applicant',
          createdAt: now
        });
        if (body.outcome === 'Passed' && body.advanceToOffer) {
          db.applications[aIdx].status = 'Offer';
        }
      }
    }
  }

  interview.updatedAt = now;
  db.interviews[idx] = interview;
  writeDb(db);

  res.json({ interview });
});

app.delete('/api/interviews/:id', requireAuth, (req, res) => {
  const db = readDb();
  const idx = db.interviews.findIndex((i) => i.id === req.params.id && i.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Interview not found.' });
  }

  const [removed] = db.interviews.splice(idx, 1);
  writeDb(db);
  res.json({ deletedId: removed.id });
});

// -------------------------------------------------------------
// 8. JOB SEARCH CALENDAR & DASHBOARD OVERVIEW
// -------------------------------------------------------------

app.get('/api/calendar/events', requireAuth, (req, res) => {
  const db = readDb();
  const userId = req.user.id;
  const events = [];

  // Application deadlines
  for (const job of db.jobs) {
    if (job.status === 'Open' && job.deadline) {
      events.push({
        id: `cal_deadline_${job.id}`,
        type: 'deadline',
        title: `Deadline: ${job.title} (${job.company})`,
        date: job.deadline,
        time: '23:59',
        relatedId: job.id,
        summary: `Application closes for ${job.title} at ${job.company}.`
      });
    }
  }

  // Scheduled interviews
  for (const intItem of db.interviews) {
    if (intItem.userId === userId && intItem.date) {
      events.push({
        id: `cal_int_${intItem.id}`,
        type: 'interview',
        title: `${intItem.stage}: ${intItem.company} (${intItem.position})`,
        date: intItem.date,
        time: intItem.time || '10:00',
        relatedId: intItem.id,
        applicationId: intItem.applicationId,
        summary: `${intItem.format} with ${intItem.interviewerName || intItem.company}. Location: ${intItem.location || 'Online'}`
      });
    }
  }

  // Follow-up & other reminders
  for (const rem of db.reminders) {
    if (rem.userId === userId && rem.reminderDate) {
      events.push({
        id: `cal_rem_${rem.id}`,
        type: 'reminder',
        title: rem.title,
        date: rem.reminderDate,
        time: rem.reminderTime || '09:00',
        relatedId: rem.id,
        completed: rem.completed,
        summary: rem.notes || `Type: ${rem.type}`
      });
    }
  }

  // Scheduled application follow-ups
  for (const appItem of db.applications) {
    if (appItem.userId === userId && appItem.followUpDate) {
      const job = db.jobs.find((j) => j.id === appItem.jobId);
      events.push({
        id: `cal_followup_${appItem.id}`,
        type: 'followup',
        title: `Follow-up on ${job ? job.title : 'Application'}`,
        date: appItem.followUpDate,
        time: '11:00',
        relatedId: appItem.id,
        summary: `Next Action: ${appItem.nextAction || 'Check status with recruiter'}`
      });
    }
  }

  events.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));
  res.json({ events });
});

app.get('/api/dashboard/overview', requireAuth, (req, res) => {
  const db = readDb();
  const userId = req.user.id;
  const range = String(req.query.range || 'all').trim(); // '7d' | '30d' | '90d' | 'all'

  const jobMap = new Map(db.jobs.map((j) => [j.id, j]));

  // Filter applications by user & date range
  const userApps = db.applications.filter((a) => a.userId === userId && isDateInRange(a.createdAt, range));

  // Compute live metrics
  const total = userApps.length;
  const inProgress = userApps.filter((a) =>
    ['Applied / Submitted', 'Under Review', 'Shortlisted', 'Assessment', 'Interview'].includes(a.status)
  ).length;
  const interviewsCount = userApps.filter((a) => a.status === 'Interview').length;
  const offersCount = userApps.filter((a) => a.status === 'Offer').length;
  const rejectedCount = userApps.filter((a) => a.status === 'Rejected').length;
  const withdrawnCount = userApps.filter((a) => a.status === 'Withdrawn').length;

  // Upcoming interviews
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingInterviews = db.interviews
    .filter((i) => i.userId === userId && i.date >= todayStr && i.outcome === 'Pending')
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 5);

  // Pending reminders
  const pendingReminders = db.reminders
    .filter((r) => r.userId === userId && !r.completed)
    .sort((a, b) => new Date(`${a.reminderDate}T${a.reminderTime}`) - new Date(`${b.reminderDate}T${b.reminderTime}`))
    .slice(0, 5);

  // Recently saved jobs
  const recentlySaved = db.savedJobs
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)
    .map((s) => ({
      ...s,
      job: jobMap.get(s.jobId) || null
    }));

  // Approaching deadlines (within next 7 days and open)
  const approachingDeadlines = db.jobs
    .filter((j) => {
      if (j.status !== 'Open' || !j.deadline) return false;
      const d = new Date(j.deadline);
      const diffDays = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  // Recent recruiter updates from application timeline
  const recentRecruiterUpdates = [];
  for (const appItem of userApps) {
    if (Array.isArray(appItem.timeline)) {
      for (const event of appItem.timeline) {
        if (event.source === 'recruiter') {
          const job = jobMap.get(appItem.jobId);
          recentRecruiterUpdates.push({
            id: event.id,
            applicationId: appItem.id,
            jobTitle: job ? job.title : 'Job',
            company: job ? job.company : '',
            description: event.description,
            notes: event.notes,
            date: event.createdAt
          });
        }
      }
    }
  }
  recentRecruiterUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));

  const overviewPayload = {
    metrics: {
      total,
      inProgress,
      interviewsCount,
      offersCount,
      rejectedCount,
      withdrawnCount
    },
    upcomingInterviews,
    pendingReminders,
    recentlySaved,
    approachingDeadlines,
    recentRecruiterUpdates: recentRecruiterUpdates.slice(0, 5),
    recentApplications: userApps
      .slice(0, 5)
      .map((a) => ({ ...a, job: jobMap.get(a.jobId) || null }))
  };

  res.json({
    ...overviewPayload,
    overview: overviewPayload
  });
});

// -------------------------------------------------------------
// 9. JOB SEARCH ANALYTICS ENGINE
// -------------------------------------------------------------

app.get('/api/analytics', requireAuth, (req, res) => {
  const db = readDb();
  const userId = req.user.id;
  const range = String(req.query.range || 'all').trim();
  const jobMap = new Map(db.jobs.map((j) => [j.id, j]));

  const userApps = db.applications.filter((a) => a.userId === userId && isDateInRange(a.createdAt, range));

  // Monthly breakdown
  const monthlyMap = new Map();
  for (const a of userApps) {
    const ym = a.createdAt ? a.createdAt.slice(0, 7) : 'Unknown';
    monthlyMap.set(ym, (monthlyMap.get(ym) || 0) + 1);
  }
  const byMonth = Array.from(monthlyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Category / Department breakdown
  const deptMap = new Map();
  const compMap = new Map();
  const typeMap = new Map();
  const statusMap = new Map();

  for (const s of VALID_APP_STATUSES) statusMap.set(s, 0);

  let totalResponseMs = 0;
  let responseCount = 0;

  for (const a of userApps) {
    const job = jobMap.get(a.jobId);
    const dept = job ? job.department : 'Other';
    const comp = job ? job.company : 'Other';
    const type = job ? job.employmentType : 'Full-time';

    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    compMap.set(comp, (compMap.get(comp) || 0) + 1);
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
    statusMap.set(a.status, (statusMap.get(a.status) || 0) + 1);

    // Calculate response time from creation to first recruiter status transition
    if (Array.isArray(a.timeline)) {
      const firstRecruiterEvent = a.timeline.find((t) => t.source === 'recruiter' && t.createdAt);
      if (firstRecruiterEvent) {
        const diff = new Date(firstRecruiterEvent.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (diff > 0) {
          totalResponseMs += diff;
          responseCount++;
        }
      }
    }
  }

  const byDepartment = Array.from(deptMap.entries()).map(([department, count]) => ({ department, count }));
  const byCompany = Array.from(compMap.entries()).map(([company, count]) => ({ company, count }));
  const byEmploymentType = Array.from(typeMap.entries()).map(([employmentType, count]) => ({ employmentType, count }));
  const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  // Conversion rates: rigorously calculated
  const submittedTotal = userApps.filter((a) => a.status !== 'Saved').length;
  const interviewsTotal = userApps.filter((a) => ['Interview', 'Offer'].includes(a.status)).length;
  const offersTotal = userApps.filter((a) => a.status === 'Offer').length;
  const rejectedTotal = userApps.filter((a) => a.status === 'Rejected').length;

  const interviewConversionRate = submittedTotal > 0 ? Number(((interviewsTotal / submittedTotal) * 100).toFixed(1)) : 0;
  const offerConversionRate = submittedTotal > 0 ? Number(((offersTotal / submittedTotal) * 100).toFixed(1)) : 0;
  const rejectionRate = submittedTotal > 0 ? Number(((rejectedTotal / submittedTotal) * 100).toFixed(1)) : 0;
  const avgResponseDays = responseCount > 0 ? Number((totalResponseMs / (responseCount * 86400000)).toFixed(1)) : null;

  const analyticsPayload = {
    totalApplications: userApps.length,
    submittedTotal,
    interviewConversionRate,
    offerConversionRate,
    rejectionRate,
    avgResponseDays,
    byMonth,
    byDepartment,
    byCompany,
    byEmploymentType,
    statusDistribution
  };

  res.json({
    ...analyticsPayload,
    analytics: analyticsPayload
  });
});

// -------------------------------------------------------------
// 10. AI / SMART JOB MATCHING ENGINE
// -------------------------------------------------------------

app.post('/api/match-job/:jobId', requireAuth, (req, res) => {
  const db = readDb();
  const job = db.jobs.find((j) => j.id === req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job opening not found.' });
  }

  const profile = db.profiles.find((p) => p.userId === req.user.id);
  if (!profile) {
    return res.status(400).json({ error: 'Please complete your Career Profile first to calculate job match insights.' });
  }

  const userSkills = (profile.skills || []).map((s) => s.toLowerCase());
  const jobText = [
    job.title,
    job.summary,
    ...(job.requirements || []),
    ...(job.responsibilities || []),
    ...(job.qualifications || [])
  ]
    .join(' ')
    .toLowerCase();

  // Match skills against job description text
  const matchingSkills = [];
  const missingSkills = [];

  for (const s of userSkills) {
    if (jobText.includes(s)) {
      matchingSkills.push(s);
    }
  }

  // Common high-demand tech and professional keywords to check for gaps
  const techKeywords = [
    'react',
    'typescript',
    'javascript',
    'node.js',
    'python',
    'sql',
    'figma',
    'graphql',
    'docker',
    'aws',
    'testing',
    'accessibility',
    'architecture',
    'communication'
  ];

  for (const kw of techKeywords) {
    if (jobText.includes(kw) && !userSkills.some((s) => s.includes(kw))) {
      missingSkills.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  }

  // Compute transparent percentage match
  const totalAspects = Math.max(userSkills.length, 5);
  let score = Math.round((matchingSkills.length / totalAspects) * 75);

  // Additional weight for work mode & location alignment
  if (profile.preferredWorkModes && profile.preferredWorkModes.includes(job.workMode)) {
    score += 15;
  }
  if (profile.location && job.location && job.location.toLowerCase().includes(profile.location.toLowerCase())) {
    score += 10;
  }
  score = Math.min(Math.max(score, 25), 98); // Bounds between 25% and 98%

  // Build actionable advice
  const suggestions = [];
  if (missingSkills.length > 0) {
    suggestions.push(`Consider highlighting projects or coursework involving ${missingSkills.slice(0, 3).join(', ')}.`);
  }
  if (job.experienceLevel === 'Senior' && (!profile.experience || profile.experience.length < 2)) {
    suggestions.push('Emphasize leadership, architecture decisions, and measurable production impact in your pitch.');
  }
  if (job.workMode === 'Remote') {
    suggestions.push('Mention your experience with asynchronous collaboration, Git workflows, and remote accountability.');
  }
  suggestions.push(`Tailor your cover note to reference ${job.department} goals at ${job.company}.`);

  res.json({
    match: {
      score,
      explanation: `Calculated from ${matchingSkills.length} matching skills, alignment with ${job.workMode} work mode, and experience history.`,
      matchingSkills: matchingSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
      missingSkills: missingSkills.slice(0, 4),
      experienceMatch: job.experienceLevel || 'Mid',
      suggestions
    }
  });
});

// -------------------------------------------------------------
// 11. DATA EXPORT ROUTES (CSV)
// -------------------------------------------------------------

app.get('/api/export/applications', requireAuth, (req, res) => {
  const db = readDb();
  const jobMap = new Map(db.jobs.map((j) => [j.id, j]));
  const apps = db.applications.filter((a) => a.userId === req.user.id);

  const headers = [
    'Application ID',
    'Job Title',
    'Company',
    'Department',
    'Location',
    'Work Mode',
    'Status',
    'Applied Date',
    'Salary Expectations',
    'Recruiter Name',
    'Recruiter Email',
    'Next Action',
    'Follow-up Date',
    'Personal Notes'
  ];

  const rows = apps.map((a) => {
    const job = jobMap.get(a.jobId);
    return [
      escapeCsvCell(a.id),
      escapeCsvCell(job ? job.title : 'Position Removed'),
      escapeCsvCell(job ? job.company : ''),
      escapeCsvCell(job ? job.department : ''),
      escapeCsvCell(job ? job.location : ''),
      escapeCsvCell(job ? job.workMode : ''),
      escapeCsvCell(a.status),
      escapeCsvCell(a.createdAt ? a.createdAt.slice(0, 10) : ''),
      escapeCsvCell(a.salaryExpectations || ''),
      escapeCsvCell(a.recruiterName || ''),
      escapeCsvCell(a.recruiterEmail || ''),
      escapeCsvCell(a.nextAction || ''),
      escapeCsvCell(a.followUpDate || ''),
      escapeCsvCell(a.personalNotes || '')
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="jobify_applications.csv"');
  res.send(csv);
});

app.get('/api/export/saved-jobs', requireAuth, (req, res) => {
  const db = readDb();
  const jobMap = new Map(db.jobs.map((j) => [j.id, j]));
  const saved = db.savedJobs.filter((s) => s.userId === req.user.id);

  const headers = ['Saved ID', 'Job Title', 'Company', 'Department', 'Location', 'Category', 'Deadline', 'Saved Date', 'Personal Notes'];
  const rows = saved.map((s) => {
    const job = jobMap.get(s.jobId);
    return [
      escapeCsvCell(s.id),
      escapeCsvCell(job ? job.title : 'Deleted Job'),
      escapeCsvCell(job ? job.company : ''),
      escapeCsvCell(job ? job.department : ''),
      escapeCsvCell(job ? job.location : ''),
      escapeCsvCell(s.category),
      escapeCsvCell(job?.deadline || ''),
      escapeCsvCell(s.createdAt ? s.createdAt.slice(0, 10) : ''),
      escapeCsvCell(s.notes || '')
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="jobify_saved_jobs.csv"');
  res.send(csv);
});

// -------------------------------------------------------------
// 12. ADMIN MODERATION & REPORTS
// -------------------------------------------------------------

app.get('/api/admin/reports', requireAdmin, (_req, res) => {
  const db = readDb();
  res.json({ reports: db.jobReports || [] });
});

app.patch('/api/admin/reports/:id', requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.jobReports.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const { status, action } = req.body || {};
  if (status) db.jobReports[idx].status = status;
  db.jobReports[idx].resolvedAt = new Date().toISOString();

  // If admin chooses to unpublish/close the reported job
  if (action === 'close_job' && db.jobReports[idx].jobId) {
    const jIdx = db.jobs.findIndex((j) => j.id === db.jobReports[idx].jobId);
    if (jIdx !== -1) {
      db.jobs[jIdx].status = 'Closed';
    }
  }

  writeDb(db);
  res.json({ report: db.jobReports[idx] });
});

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
  const pendingReports = (db.jobReports || []).filter((r) => r.status === 'pending').length;

  res.json({
    stats: {
      totalJobs: db.jobs.length,
      openJobs,
      closedOrDraftJobs,
      totalApplications,
      pendingReports,
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
  const prevStatus = appItem.status;

  if (status !== undefined) {
    if (!VALID_APP_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid application status.' });
    }
    if (status !== prevStatus) {
      appItem.status = status;
      appItem.statusHistory = appItem.statusHistory || [];
      appItem.statusHistory.push({
        status,
        changedAt: now,
        note: `Status updated to ${status} by ${req.user.name}.`
      });

      appItem.timeline = appItem.timeline || [];
      appItem.timeline.unshift({
        id: generateId('tl'),
        eventType: 'Status Changed',
        description: `Recruiter updated status to ${status}.`,
        previousStatus: prevStatus,
        newStatus: status,
        notes: adminNotes || '',
        source: 'recruiter',
        createdAt: now
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

// -------------------------------------------------------------
// 13. SERVE FRONTEND BUILD
// -------------------------------------------------------------

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
