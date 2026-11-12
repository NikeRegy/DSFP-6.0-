const { spawn } = require('child_process');
const path = require('path');

const PORT = 3099;
const BASE = `http://localhost:${PORT}`;

function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

async function waitForServer(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE}/api/jobs`);
      if (res.ok) return;
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Server did not start in time');
}

async function run() {
  const srv = spawn('node', [path.join(__dirname, '..', 'server', 'index.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });

  try {
    await waitForServer();
    console.log('1. Server started and responding.');

    // Public jobs fetch
    const pubJobsRes = await fetch(`${BASE}/api/jobs`);
    const pubJobs = await pubJobsRes.json();
    assert(pubJobsRes.status === 200 && Array.isArray(pubJobs.jobs) && pubJobs.jobs.length >= 5, 'Seeded open jobs should load');
    console.log(`2. Public jobs loaded (${pubJobs.jobs.length} open jobs).`);

    // Admin login
    const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@jobify.io', password: 'admin123' })
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLogin.token && adminLogin.user.role === 'admin', 'Admin login failed');
    const adminToken = adminLogin.token;
    console.log('3. Admin login succeeded.');

    // Admin posts a new job
    const createJobRes = await fetch(`${BASE}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Cloud Infrastructure Engineer',
        company: 'Jobify Labs',
        department: 'Engineering',
        location: 'Remote',
        workMode: 'Remote',
        employmentType: 'Full-time',
        salaryMin: 140000,
        salaryMax: 170000,
        summary: 'Manage cloud deployment pipelines and observability.'
      })
    });
    const createdJob = await createJobRes.json();
    assert(createJobRes.status === 201 && createdJob.job.id, 'Admin job creation failed');
    const newJobId = createdJob.job.id;
    console.log(`4. Admin posted job (${newJobId}).`);

    // Register a normal user
    const regEmail = `applicant_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sam Rivera',
        email: regEmail,
        password: 'password123',
        title: 'DevOps Engineer'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.user.role === 'user', 'Normal user registration failed');
    const userToken = regData.token;
    console.log('5. Normal user registered.');

    // Normal user cannot post a job
    const forbiddenPostRes = await fetch(`${BASE}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized Job',
        department: 'Ops',
        location: 'Remote',
        summary: 'Should fail'
      })
    });
    assert(forbiddenPostRes.status === 403, 'Normal user should be forbidden from posting jobs');
    console.log('6. Verified normal user cannot post jobs (403).');

    // Normal user applies for the newly posted job (with resume upload)
    const fd = new FormData();
    fd.append('applicantName', 'Sam Rivera');
    fd.append('applicantEmail', regEmail);
    fd.append('yearsExperience', '4 years');
    fd.append('coverLetter', 'Excited to help scale SkyHire cloud infrastructure.');
    fd.append('resume', new Blob(['Sample resume text'], { type: 'text/plain' }), 'sam-resume.txt');

    const applyRes = await fetch(`${BASE}/api/jobs/${newJobId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: fd
    });
    const applyData = await applyRes.json();
    assert(applyRes.status === 201 && applyData.application.status === 'Submitted', 'User application failed');
    const appId = applyData.application.id;
    console.log(`7. Normal user applied for job (${appId}) with resume attachment.`);

    // Admin updates application status to Interview
    const patchRes = await fetch(`${BASE}/api/admin/applications/${appId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Interview', adminNotes: 'Great resume, moving to interview!' })
    });
    const patchData = await patchRes.json();
    assert(patchRes.status === 200 && patchData.application.status === 'Interview', 'Admin status update failed');
    console.log('8. Admin moved application to Interview.');

    // Normal user tracks application and sees Interview status + recruiter note
    const myAppsRes = await fetch(`${BASE}/api/my-applications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const myApps = await myAppsRes.json();
    const tracked = myApps.applications.find((a) => a.id === appId);
    assert(tracked && tracked.status === 'Interview' && tracked.adminNotes.includes('Great resume'), 'User tracking check failed');
    console.log('9. Normal user tracked updated application status.');

    // Also verify guest one-step apply without pre-registration
    const guestFd = new FormData();
    guestFd.append('applicantName', 'Guest Applicant');
    guestFd.append('applicantEmail', `guest_${Date.now()}@example.com`);
    guestFd.append('coverLetter', 'Applying directly from a shared job link!');
    const guestApplyRes = await fetch(`${BASE}/api/jobs/${newJobId}/apply`, {
      method: 'POST',
      body: guestFd
    });
    const guestApplyData = await guestApplyRes.json();
    assert(
      guestApplyRes.status === 201 &&
        guestApplyData.application.id &&
        guestApplyData.token &&
        guestApplyData.user.role === 'user',
      'Guest one-step apply should succeed and return session token'
    );
    console.log('10. Guest one-step apply succeeded and issued applicant token.');

    // Verify shared job link route serves index.html
    const sharePageRes = await fetch(`${BASE}/jobs/${newJobId}`);
    assert(sharePageRes.status === 200, 'Shared job link /jobs/:id should serve frontend HTML');
    console.log('11. Shared job link route /jobs/:id served HTML.');

    // Clean up created test job (cascades test applications & resume file)
    const delRes = await fetch(`${BASE}/api/jobs/${newJobId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(delRes.status === 200, 'Admin cleanup delete failed');
    console.log('12. Cleanup completed.');

    // Also verify static index.html served when dist exists
    const htmlRes = await fetch(`${BASE}/`);
    assert(htmlRes.status === 200, 'Built frontend HTML should be served on /');
    console.log('13. Built frontend served successfully on /.');

    console.log('ALL VERIFICATION CHECKS PASSED!');
  } finally {
    srv.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

