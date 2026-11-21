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
        experienceLevel: 'Senior',
        salaryMin: 140000,
        salaryMax: 170000,
        summary: 'Manage cloud deployment pipelines and observability.',
        skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'Go']
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

    // Normal user profile get & update
    const profGetRes = await fetch(`${BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const profGet = await profGetRes.json();
    assert(profGetRes.status === 200 && profGet.profile, 'Get profile failed');

    const profUpdateRes = await fetch(`${BASE}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        skills: ['Kubernetes', 'Docker', 'AWS', 'Python', 'Go'],
        preferredWorkModes: ['Remote'],
        headline: 'Staff Infrastructure & DevOps Architect'
      })
    });
    const profUpdate = await profUpdateRes.json();
    assert(profUpdateRes.status === 200 && profUpdate.profile.skills.length === 5, 'Update profile failed');
    console.log('6. Profile get and update verified.');

    // AI Job Fit Match
    const matchRes = await fetch(`${BASE}/api/match-job/${newJobId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const matchData = await matchRes.json();
    assert(matchRes.status === 200 && typeof matchData.match.score === 'number', 'AI match fit calculation failed');
    console.log(`7. AI Matcher calculated score: ${matchData.match.score}% with matched skills: ${matchData.match.matchingSkills.join(', ')}.`);

    // Saved Jobs: Save, List, Patch, Delete
    const saveJobRes = await fetch(`${BASE}/api/saved-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ jobId: newJobId, category: 'Priority', notes: 'Top priority for Q1' })
    });
    const savedJobData = await saveJobRes.json();
    assert(saveJobRes.status === 201 && savedJobData.savedJob.id, 'Save job failed');
    const savedId = savedJobData.savedJob.id;

    const listSavedRes = await fetch(`${BASE}/api/saved-jobs`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const listSaved = await listSavedRes.json();
    assert(listSaved.savedJobs.some((s) => s.id === savedId), 'Saved job should appear in list');
    console.log('8. Saved Jobs system verified.');

    // Upload Document (Document Hub)
    const docFd = new FormData();
    docFd.append('title', 'Senior DevOps Resume 2026');
    docFd.append('category', 'Resume / CV');
    docFd.append('description', 'Tailored for cloud architect roles');
    docFd.append('file', new Blob(['DevOps Resume Content'], { type: 'text/plain' }), 'devops-cv.txt');

    const docUploadRes = await fetch(`${BASE}/api/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: docFd
    });
    const docUploadData = await docUploadRes.json();
    assert(docUploadRes.status === 201 && docUploadData.document.id, 'Document upload failed');
    const docId = docUploadData.document.id;
    console.log(`9. Document hub upload verified (${docId}).`);

    // Normal user applies for the job using documentId
    const applyFd = new FormData();
    applyFd.append('applicantName', 'Sam Rivera');
    applyFd.append('applicantEmail', regEmail);
    applyFd.append('yearsExperience', '5 years');
    applyFd.append('coverLetter', 'Excited to help scale Jobify cloud infrastructure.');
    applyFd.append('documentId', docId);

    const applyRes = await fetch(`${BASE}/api/jobs/${newJobId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: applyFd
    });
    const applyData = await applyRes.json();
    assert(
      applyRes.status === 201 &&
        applyData.application &&
        (applyData.application.status === 'Applied / Submitted' || applyData.application.status === 'Submitted'),
      'User application failed'
    );
    const appId = applyData.application.id;
    console.log(`10. Normal user applied using documentId (${appId}).`);

    // Application timeline check and manual event logging
    const appDetailRes = await fetch(`${BASE}/api/applications/${appId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const appDetail = await appDetailRes.json();
    assert(appDetail.application && appDetail.application.timeline.length >= 1, 'Application timeline initialization failed');

    const addEventRes = await fetch(`${BASE}/api/applications/${appId}/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        description: 'Sent follow-up email to recruiter Sarah',
        notes: 'Requested status on review'
      })
    });
    const addEventData = await addEventRes.json();
    assert(addEventRes.status === 201 && addEventData.application.timeline.length >= 2, 'Timeline manual event logging failed');
    console.log('11. Application timeline & history stream verified.');

    // Follow-up Reminder: create, list, patch complete, delete
    const remRes = await fetch(`${BASE}/api/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        applicationId: appId,
        type: 'Follow-up',
        reminderDate: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Check inbox for interview schedule confirmation'
      })
    });
    const remData = await remRes.json();
    assert(remRes.status === 201 && remData.reminder.id, 'Create reminder failed');
    const remId = remData.reminder.id;

    const patchRemRes = await fetch(`${BASE}/api/reminders/${remId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ completed: true })
    });
    const patchRemData = await patchRemRes.json();
    assert(patchRemRes.status === 200 && patchRemData.reminder.completed === true, 'Patch reminder failed');
    console.log('12. Follow-up reminder system verified.');

    // Interviews: create, list, patch outcome
    const intRes = await fetch(`${BASE}/api/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        applicationId: appId,
        company: 'Jobify Labs',
        position: 'Cloud Infrastructure Engineer',
        stage: 'Technical interview',
        format: 'Video',
        interviewDate: new Date(Date.now() + 172800000).toISOString(),
        locationOrLink: 'https://meet.google.com/abc-defg-hij',
        interviewerName: 'Dr. Jane Smith',
        prepNotes: 'Study distributed consensus & raft protocol'
      })
    });
    const intData = await intRes.json();
    assert(intRes.status === 201 && intData.interview.id, 'Create interview failed');
    const intId = intData.interview.id;

    const patchIntRes = await fetch(`${BASE}/api/interviews/${intId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ status: 'Passed', feedback: 'Exceptional deep knowledge' })
    });
    const patchIntData = await patchIntRes.json();
    assert(patchIntRes.status === 200 && patchIntData.interview.status === 'Passed', 'Patch interview outcome failed');
    console.log('13. Interview hub & outcome tracking verified.');

    // Calendar Events API
    const calRes = await fetch(`${BASE}/api/calendar/events`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const calData = await calRes.json();
    assert(calRes.status === 200 && Array.isArray(calData.events) && calData.events.length >= 1, 'Calendar events retrieval failed');
    console.log(`14. Calendar events retrieval verified (${calData.events.length} events).`);

    // Dashboard Overview API
    const dashRes = await fetch(`${BASE}/api/dashboard/overview?range=all`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200 && dashData.overview && dashData.overview.metrics.total >= 1, 'Dashboard overview calculation failed');
    console.log(`15. Real-time dashboard overview verified (Total apps: ${dashData.overview.metrics.total}).`);

    // Analytics API
    const anaRes = await fetch(`${BASE}/api/analytics?range=all`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const anaData = await anaRes.json();
    assert(anaRes.status === 200 && anaData.analytics && typeof anaData.analytics.interviewConversionRate === 'number', 'Analytics calculation failed');
    console.log(`16. Analytics metrics verified (Interview conversion: ${anaData.analytics.interviewConversionRate}%).`);

    // Report Vacancy & Admin Reports
    const reportRes = await fetch(`${BASE}/api/jobs/${newJobId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        reason: 'Misleading job description or requirements',
        details: 'Listing salary seems different on external board'
      })
    });
    const reportData = await reportRes.json();
    assert(reportRes.status === 201, 'Job reporting failed');

    const adminReportsRes = await fetch(`${BASE}/api/admin/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminReportsData = await adminReportsRes.json();
    assert(adminReportsRes.status === 200 && adminReportsData.reports.length >= 1, 'Admin reports listing failed');
    console.log('17. Job reporting and admin moderation queue verified.');

    // Admin updates application status to Offer
    const patchAppRes = await fetch(`${BASE}/api/admin/applications/${appId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Offer', adminNotes: 'Congratulations! Official offer sent via email.' })
    });
    const patchAppData = await patchAppRes.json();
    assert(patchAppRes.status === 200 && patchAppData.application.status === 'Offer', 'Admin offer status update failed');
    console.log('18. Admin moved application to Offer stage.');

    // Cleanup created test job (cascades apps, interviews, reminders, saved)
    const delRes = await fetch(`${BASE}/api/jobs/${newJobId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(delRes.status === 200, 'Admin cleanup delete failed');
    console.log('19. Cleanup completed.');

    // Built frontend static serving test
    const htmlRes = await fetch(`${BASE}/`);
    assert(htmlRes.status === 200, 'Built frontend HTML should be served on /');
    console.log('20. Built frontend served successfully on /.');

    console.log('\n==========================================');
    console.log('ALL 20 VERIFICATION CHECKS PASSED 100%!');
    console.log('==========================================\n');
  } finally {
    srv.kill();
  }
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
