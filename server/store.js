const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashPassword } = require('./auth');

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'skyhire-data')
  : path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function createSeedData() {
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
  const daysAhead = (d) => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);

  const adminId = 'usr_admin_demo';
  const userId = 'usr_applicant_demo';

  const users = [
    {
      id: adminId,
      name: 'Alex Morgan',
      email: 'admin@jobify.io',
      role: 'admin',
      title: 'Talent Acquisition Lead',
      passwordHash: hashPassword('admin123'),
      createdAt: daysAgo(30)
    },
    {
      id: userId,
      name: 'Jordan Taylor',
      email: 'user@jobify.io',
      role: 'user',
      title: 'Software Engineer',
      passwordHash: hashPassword('user123'),
      createdAt: daysAgo(20)
    }
  ];

  const jobs = [
    {
      id: 'job_frontend_eng',
      title: 'Senior Frontend Engineer',
      company: 'Jobify Labs',
      department: 'Engineering',
      location: 'San Francisco, CA',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      salaryMin: 135000,
      salaryMax: 165000,
      currency: 'USD',
      deadline: daysAhead(28),
      summary:
        'Lead the design and implementation of responsive, accessible web interfaces powering our recruitment and workflow tracking suite.',
      responsibilities: [
        'Architect modular React components and shared design-system primitives.',
        'Partner with product designers and backend engineers to ship fast, intuitive workflows.',
        'Optimize rendering performance, accessibility (WCAG AA), and automated UI testing.'
      ],
      requirements: [
        '4+ years of production experience with React, TypeScript/JavaScript, and modern CSS.',
        'Strong eye for clean layout, typography, and responsive interactions.',
        'Experience consuming REST APIs and handling complex client-side state.'
      ],
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(9),
      updatedAt: daysAgo(9)
    },
    {
      id: 'job_product_designer',
      title: 'Product Designer (UI/UX)',
      company: 'Jobify Labs',
      department: 'Design',
      location: 'Remote (US / EU)',
      workMode: 'Remote',
      employmentType: 'Full-time',
      salaryMin: 110000,
      salaryMax: 140000,
      currency: 'USD',
      deadline: daysAhead(21),
      summary:
        'Shape clear, human-centered hiring workflows from early wireframes and user research to polished visual systems.',
      responsibilities: [
        'Conduct user interviews with recruiters and job seekers to uncover friction points.',
        'Produce interactive Figma prototypes and maintain component guidelines.',
        'Collaborate directly with frontend engineers during implementation reviews.'
      ],
      requirements: [
        '3+ years designing B2B SaaS or marketplace web applications.',
        'Portfolio demonstrating systems thinking and clean visual hierarchy.',
        'Proficiency in Figma and modern design token workflows.'
      ],
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7)
    },
    {
      id: 'job_backend_node',
      title: 'Backend Platform Engineer',
      company: 'Jobify Labs',
      department: 'Engineering',
      location: 'Austin, TX',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      salaryMin: 130000,
      salaryMax: 160000,
      currency: 'USD',
      deadline: daysAhead(35),
      summary:
        'Build resilient APIs, authentication pipelines, and real-time analytics services supporting thousands of daily candidate applications.',
      responsibilities: [
        'Design and maintain RESTful microservices with Node.js and relational/document stores.',
        'Ensure strict data security, role-based access control, and audit logging.',
        'Improve observability, automated integration testing, and CI/CD reliability.'
      ],
      requirements: [
        '3+ years building backend services in Node.js, Go, or Python.',
        'Deep understanding of HTTP, authentication, caching, and database indexing.',
        'Comfort owning features end-to-end from schema design to monitoring.'
      ],
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5)
    },
    {
      id: 'job_data_analyst',
      title: 'People Operations & Data Analyst',
      company: 'Jobify Labs',
      department: 'Operations',
      location: 'New York, NY',
      workMode: 'On-site',
      employmentType: 'Full-time',
      salaryMin: 85000,
      salaryMax: 108000,
      currency: 'USD',
      deadline: daysAhead(18),
      summary:
        'Turn hiring funnel metrics into actionable insights that improve candidate experience, diversity outreach, and time-to-hire.',
      responsibilities: [
        'Build weekly hiring pipeline dashboards and conversion reports for leadership.',
        'Analyze drop-off stages and collaborate with hiring managers to streamline interviews.',
        'Maintain data hygiene across our applicant tracking system.'
      ],
      requirements: [
        '2+ years in operations analytics, people analytics, or business intelligence.',
        'Fluency in SQL and spreadsheet modeling; familiarity with Python or BI tools.',
        'Clear written communication and stakeholder presentation skills.'
      ],
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3)
    },
    {
      id: 'job_qa_intern',
      title: 'QA Automation Intern',
      company: 'Jobify Labs',
      department: 'Quality Assurance',
      location: 'Remote',
      workMode: 'Remote',
      employmentType: 'Internship',
      salaryMin: 35,
      salaryMax: 45,
      currency: 'USD/hr',
      deadline: daysAhead(14),
      summary:
        'Join our engineering quality team for a 12-week paid internship writing end-to-end tests and validating new product releases.',
      responsibilities: [
        'Write Playwright/Cypress automated tests for core applicant and admin flows.',
        'Log clear reproduction steps for edge-case bugs and verify fixes.',
        'Participate in sprint planning and engineering code reviews.'
      ],
      requirements: [
        'Currently pursuing or recently completed a degree/bootcamp in CS or related field.',
        'Familiarity with JavaScript/TypeScript and Git workflows.',
        'Detail-oriented mindset and curiosity for breaking software constructively.'
      ],
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1)
    }
  ];

  const applications = [
    {
      id: 'app_demo_1',
      jobId: 'job_frontend_eng',
      userId,
      applicantName: 'Jordan Taylor',
      applicantEmail: 'user@jobify.io',
      phone: '+1 (555) 234-8910',
      portfolioUrl: 'https://github.com/jordantaylor-dev',
      yearsExperience: '5 years',
      coverLetter:
        'I have led frontend architecture for two SaaS workflow platforms using React and accessible design systems, and I would love to bring that craft to Jobify Labs.',
      resumeFile: null,
      status: 'Interview',
      adminNotes: 'Strong React portfolio. Technical screen scheduled for Thursday.',
      statusHistory: [
        { status: 'Submitted', changedAt: daysAgo(6), note: 'Application submitted by candidate.' },
        { status: 'Under Review', changedAt: daysAgo(4), note: 'Reviewed by Alex Morgan.' },
        { status: 'Interview', changedAt: daysAgo(2), note: 'Moved to technical interview stage.' }
      ],
      createdAt: daysAgo(6),
      updatedAt: daysAgo(2)
    },
    {
      id: 'app_demo_2',
      jobId: 'job_backend_node',
      userId,
      applicantName: 'Jordan Taylor',
      applicantEmail: 'user@jobify.io',
      phone: '+1 (555) 234-8910',
      portfolioUrl: 'https://github.com/jordantaylor-dev',
      yearsExperience: '5 years',
      coverLetter:
        'Alongside frontend work, I have built Node.js APIs and authentication middleware in production and enjoy owning full-stack features.',
      resumeFile: null,
      status: 'Under Review',
      adminNotes: 'Checking backend system design availability.',
      statusHistory: [
        { status: 'Submitted', changedAt: daysAgo(3), note: 'Application submitted by candidate.' },
        { status: 'Under Review', changedAt: daysAgo(1), note: 'Shortlisted for hiring manager review.' }
      ],
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1)
    }
  ];

  return { users, jobs, applications };
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeedData();
    writeDb(seed);
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempPath = `${DB_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, DB_PATH);
}

module.exports = {
  generateId,
  readDb,
  writeDb
};

