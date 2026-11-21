const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashPassword } = require('./auth');

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'jobify-data')
  : path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

const VALID_JOB_STATUSES = ['Open', 'Closed', 'Draft'];
const VALID_APP_STATUSES = [
  'Saved',
  'Applied / Submitted',
  'Under Review',
  'Shortlisted',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
];

const SAVED_CATEGORIES = ['Interested', 'Planning to Apply', 'Priority', 'Not Interested'];
const REMINDER_TYPES = [
  'Follow-up',
  'Interview Prep',
  'Interview Date',
  'Assessment Deadline',
  'Application Closing Date',
  'General'
];
const DOCUMENT_CATEGORIES = [
  'General CV',
  'Tech CV',
  'Operations CV',
  'Cover Letter',
  'Certificate',
  'Qualification',
  'Portfolio',
  'Other'
];
const INTERVIEW_STAGES = ['HR screening', 'Technical interview', 'Assessment', 'Final interview'];
const INTERVIEW_FORMATS = ['Video Call', 'Phone Call', 'On-site'];
const INTERVIEW_OUTCOMES = ['Pending', 'Passed', 'Failed', 'Rescheduled', 'Cancelled'];

function createSeedData() {
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
  const daysAhead = (d) => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);
  const hoursAhead = (h) => new Date(now.getTime() + h * 3600000).toISOString();

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
      title: 'Senior Software Engineer',
      passwordHash: hashPassword('user123'),
      createdAt: daysAgo(20)
    }
  ];

  const profiles = [
    {
      id: 'prof_demo_1',
      userId,
      fullName: 'Jordan Taylor',
      email: 'user@jobify.io',
      phone: '+1 (555) 234-8910',
      headline: 'Senior Frontend & Full-Stack Engineer | React, TypeScript, Node.js',
      location: 'San Francisco, CA',
      bio: 'Passionate software engineer with 5+ years of production experience building high-performance design systems, real-time workflow portals, and accessible web apps.',
      skills: [
        'React',
        'TypeScript',
        'JavaScript',
        'Node.js',
        'Express',
        'Next.js',
        'Tailwind CSS',
        'REST APIs',
        'HTML5/CSS3',
        'Git',
        'GraphQL',
        'Automated Testing'
      ],
      experience: [
        {
          title: 'Senior Frontend Engineer',
          company: 'Acme Cloud Systems',
          startDate: '2022-03',
          endDate: '',
          current: true,
          description: 'Architected component library used by 18 distributed product teams, cutting UI build cycles by 35%.'
        },
        {
          title: 'Full-Stack Developer',
          company: 'HyperFlow Media',
          startDate: '2019-06',
          endDate: '2022-02',
          current: false,
          description: 'Built REST APIs and customer dashboards handling 2M+ monthly active requests.'
        }
      ],
      education: [
        {
          degree: 'B.S. in Computer Science',
          institution: 'University of California, Berkeley',
          year: '2019',
          field: 'Software Engineering'
        }
      ],
      linkedInUrl: 'https://linkedin.com/in/jordantaylor-dev',
      portfolioUrl: 'https://github.com/jordantaylor-dev',
      preferredCategories: ['Engineering', 'Product', 'Design'],
      preferredWorkModes: ['Remote', 'Hybrid'],
      targetSalaryMin: 130000,
      targetSalaryMax: 175000,
      currency: 'USD',
      updatedAt: daysAgo(1)
    }
  ];

  const jobs = [
    {
      id: 'job_frontend_eng',
      title: 'Senior Frontend Engineer',
      company: 'Jobify Labs',
      logoUrl: '',
      department: 'Engineering',
      location: 'San Francisco, CA',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      experienceLevel: 'Senior',
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
      qualifications: [
        'Bachelor’s in Computer Science or equivalent hands-on industry experience.',
        'Demonstrated portfolio of shipped web applications with clean code standards.'
      ],
      benefits: [
        'Comprehensive health, dental, and vision insurance.',
        '$2,500 annual home-office stipend and flexible hybrid scheduling.',
        '401(k) retirement matching up to 5%.'
      ],
      applicationInstructions:
        'Please submit your resume and a link to your GitHub or interactive portfolio.',
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(9),
      updatedAt: daysAgo(9)
    },
    {
      id: 'job_product_designer',
      title: 'Product Designer (UI/UX)',
      company: 'Jobify Labs',
      logoUrl: '',
      department: 'Design',
      location: 'Remote (US / EU)',
      workMode: 'Remote',
      employmentType: 'Full-time',
      experienceLevel: 'Mid',
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
      qualifications: [
        'Strong UX portfolio detailing problem definitions and iterative prototypes.',
        'Familiarity with responsive web standards and design-to-code handoffs.'
      ],
      benefits: [
        '100% remote flexibility across US and EU time zones.',
        'Generous paid parental leave and unlimited PTO policy.',
        '$1,500 professional conference and learning allowance.'
      ],
      applicationInstructions:
        'Include a portfolio link with password (if protected) showcasing your process.',
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7)
    },
    {
      id: 'job_backend_node',
      title: 'Backend Platform Engineer',
      company: 'Jobify Labs',
      logoUrl: '',
      department: 'Engineering',
      location: 'Austin, TX',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      experienceLevel: 'Mid',
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
      qualifications: [
        'Production experience building secure authentication and data pipelines.',
        'Demonstrated understanding of automated test suites and containerization.'
      ],
      benefits: [
        'Competitive equity compensation package.',
        'Top-tier medical coverage and mental health wellness days.',
        'Commuter transit passes and catered lunch twice weekly.'
      ],
      applicationInstructions:
        'Submit your resume and brief notes on your favorite backend architecture project.',
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5)
    },
    {
      id: 'job_data_analyst',
      title: 'People Operations & Data Analyst',
      company: 'Jobify Labs',
      logoUrl: '',
      department: 'Operations',
      location: 'New York, NY',
      workMode: 'On-site',
      employmentType: 'Full-time',
      experienceLevel: 'Mid',
      salaryMin: 85000,
      salaryMax: 108000,
      currency: 'USD',
      deadline: daysAhead(2), // Closing Soon (within 2 days)
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
      qualifications: [
        'Degree in Statistics, Analytics, Economics, or proven track record in BI.',
        'Proven ability to present statistical summaries to non-technical executives.'
      ],
      benefits: [
        'Subsidized gym and fitness memberships.',
        'Pre-tax transit benefits and annual performance bonuses.',
        'Mentorship from Senior Operations leadership.'
      ],
      applicationInstructions:
        'Submit your resume with a sample dashboard or analysis summary if available.',
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3)
    },
    {
      id: 'job_qa_intern',
      title: 'QA Automation Intern',
      company: 'Jobify Labs',
      logoUrl: '',
      department: 'Quality Assurance',
      location: 'Remote',
      workMode: 'Remote',
      employmentType: 'Internship',
      experienceLevel: 'Entry',
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
      qualifications: [
        'Basic familiarity with frontend DOM structures and HTTP request lifecycles.',
        'Enthusiasm for software quality assurance and automated testing.'
      ],
      benefits: [
        'Dedicated 1-on-1 mentorship from a Senior QA Engineer.',
        'Flexible school-friendly schedule (20-40 hours per week).',
        'Direct pathway to full-time Associate QA Engineer consideration.'
      ],
      applicationInstructions:
        'Tell us about a bug you found and fixed in a school or personal project.',
      status: 'Open',
      createdBy: adminId,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1)
    },
    {
      id: 'job_lead_architect',
      title: 'Principal Cloud & Systems Architect',
      company: 'Jobify Labs',
      logoUrl: '',
      department: 'Engineering',
      location: 'Seattle, WA',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      experienceLevel: 'Executive',
      salaryMin: 180000,
      salaryMax: 225000,
      currency: 'USD',
      deadline: daysAgo(2), // Expired vacancy
      summary:
        'Define long-term infrastructure roadmap, distributed reliability standards, and enterprise compliance across all cloud environments.',
      responsibilities: [
        'Set architectural patterns for microservice resilience, caching, and database sharding.',
        'Drive security audits, SOC 2 compliance, and zero-downtime release pipelines.'
      ],
      requirements: [
        '8+ years leading enterprise systems architecture and distributed clouds.',
        'Track record designing high-concurrency systems at scale.'
      ],
      qualifications: ['Master’s in CS or equivalent enterprise leadership experience.'],
      benefits: ['Executive equity pool and top-tier comprehensive insurance.'],
      applicationInstructions: 'Applications for this closed cohort are now completed.',
      status: 'Closed',
      createdBy: adminId,
      createdAt: daysAgo(40),
      updatedAt: daysAgo(2)
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
      salaryExpectations: '$150,000 / year',
      recruiterName: 'Alex Morgan',
      recruiterEmail: 'admin@jobify.io',
      recruiterPhone: '+1 (555) 432-1098',
      personalNotes: 'Technical screen is with Alex and the Lead UI Architect. Focus on state management and accessibility.',
      nextAction: 'Review React 18 concurrency notes and design system patterns before Thursday screen.',
      followUpDate: daysAhead(1),
      cvVersionName: 'Senior Frontend CV',
      cvDocumentId: 'doc_demo_cv1',
      coverLetter:
        'I have led frontend architecture for two SaaS workflow platforms using React and accessible design systems, and I would love to bring that craft to Jobify Labs.',
      resumeFile: {
        originalName: 'Jordan_Taylor_Frontend_Resume.pdf',
        storedName: 'sample_resume_frontend.pdf',
        mimeType: 'application/pdf',
        size: 142800
      },
      status: 'Interview',
      adminNotes: 'Strong React portfolio. Technical screen scheduled for Thursday.',
      archived: false,
      statusHistory: [
        { status: 'Applied / Submitted', changedAt: daysAgo(6), note: 'Application submitted by candidate.' },
        { status: 'Under Review', changedAt: daysAgo(4), note: 'Reviewed by Alex Morgan.' },
        { status: 'Interview', changedAt: daysAgo(2), note: 'Moved to technical interview stage.' }
      ],
      timeline: [
        {
          id: 'tl_1',
          eventType: 'Application Submitted',
          description: 'Submitted application for Senior Frontend Engineer with attached resume.',
          previousStatus: 'Saved',
          newStatus: 'Applied / Submitted',
          notes: 'Cover letter highlighted design system & React experience.',
          source: 'applicant',
          createdAt: daysAgo(6)
        },
        {
          id: 'tl_2',
          eventType: 'Status Changed',
          description: 'Application moved to Under Review by Talent Acquisition.',
          previousStatus: 'Applied / Submitted',
          newStatus: 'Under Review',
          notes: 'Candidate profile matched 92% of core requirements.',
          source: 'recruiter',
          createdAt: daysAgo(4)
        },
        {
          id: 'tl_3',
          eventType: 'Interview Scheduled',
          description: 'Technical Interview scheduled for Thursday 2:00 PM PST via Google Meet.',
          previousStatus: 'Under Review',
          newStatus: 'Interview',
          notes: 'Interviewers: Alex Morgan & Staff Frontend Engineer.',
          source: 'recruiter',
          createdAt: daysAgo(2)
        }
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
      salaryExpectations: '$145,000 / year',
      recruiterName: 'Hiring Committee',
      recruiterEmail: 'careers@jobify.io',
      recruiterPhone: '',
      personalNotes: 'Emphasize experience with Node.js authentication middleware, caching, and PostgreSQL.',
      nextAction: 'Send friendly check-in message if no response by Friday.',
      followUpDate: daysAhead(4),
      cvVersionName: 'Full-Stack Developer CV',
      cvDocumentId: 'doc_demo_cv2',
      coverLetter:
        'Alongside frontend work, I have built Node.js APIs and authentication middleware in production and enjoy owning full-stack features.',
      resumeFile: {
        originalName: 'Jordan_Taylor_FullStack_Resume.pdf',
        storedName: 'sample_resume_fullstack.pdf',
        mimeType: 'application/pdf',
        size: 153200
      },
      status: 'Under Review',
      adminNotes: 'Checking backend system design team availability.',
      archived: false,
      statusHistory: [
        { status: 'Applied / Submitted', changedAt: daysAgo(3), note: 'Application submitted by candidate.' },
        { status: 'Under Review', changedAt: daysAgo(1), note: 'Shortlisted for hiring manager review.' }
      ],
      timeline: [
        {
          id: 'tl_4',
          eventType: 'Application Submitted',
          description: 'Submitted application for Backend Platform Engineer.',
          previousStatus: '',
          newStatus: 'Applied / Submitted',
          notes: 'Submitted via Jobify one-step application form.',
          source: 'applicant',
          createdAt: daysAgo(3)
        },
        {
          id: 'tl_5',
          eventType: 'Status Changed',
          description: 'Recruiter moved candidate to Under Review.',
          previousStatus: 'Applied / Submitted',
          newStatus: 'Under Review',
          notes: 'Passing to Engineering Team lead for technical fit check.',
          source: 'recruiter',
          createdAt: daysAgo(1)
        }
      ],
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1)
    }
  ];

  const savedJobs = [
    {
      id: 'save_demo_1',
      userId,
      jobId: 'job_product_designer',
      category: 'Priority',
      notes: 'Strong alignment with my hybrid design-engineering interests. Tailor resume to emphasize design systems.',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4)
    },
    {
      id: 'save_demo_2',
      userId,
      jobId: 'job_data_analyst',
      category: 'Planning to Apply',
      notes: 'Closing in 2 days! Review BI portfolio before submitting application tonight.',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2)
    }
  ];

  const reminders = [
    {
      id: 'rem_demo_1',
      userId,
      applicationId: 'app_demo_1',
      title: 'Review System Design & Accessibility for Frontend Technical Screen',
      reminderDate: daysAhead(1),
      reminderTime: '10:00',
      type: 'Interview Prep',
      notes: 'Prepare questions about Jobify component modularity and WCAG compliance.',
      completed: false,
      completedAt: null,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2)
    },
    {
      id: 'rem_demo_2',
      userId,
      applicationId: 'app_demo_2',
      title: 'Send follow-up check-in to careers@jobify.io',
      reminderDate: daysAhead(4),
      reminderTime: '09:30',
      type: 'Follow-up',
      notes: 'Polite 1-week follow-up on Backend Platform Engineer status.',
      completed: false,
      completedAt: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1)
    },
    {
      id: 'rem_demo_3',
      userId,
      applicationId: '',
      title: 'Apply for People Operations & Data Analyst before closing date',
      reminderDate: daysAhead(1),
      reminderTime: '18:00',
      type: 'Application Closing Date',
      notes: 'Application deadline is in 2 days.',
      completed: false,
      completedAt: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1)
    }
  ];

  const documents = [
    {
      id: 'doc_demo_cv1',
      userId,
      name: 'Senior Frontend Resume - 2026',
      originalName: 'Jordan_Taylor_Frontend_Resume.pdf',
      storedName: 'doc_sample_frontend.pdf',
      mimeType: 'application/pdf',
      size: 142800,
      category: 'Tech CV',
      description: 'Primary CV tailored for Senior React and Frontend Engineering roles with metrics on design system adoption.',
      createdAt: daysAgo(12),
      updatedAt: daysAgo(12)
    },
    {
      id: 'doc_demo_cv2',
      userId,
      name: 'Full-Stack Developer Resume - 2026',
      originalName: 'Jordan_Taylor_FullStack_Resume.pdf',
      storedName: 'doc_sample_fullstack.pdf',
      mimeType: 'application/pdf',
      size: 153200,
      category: 'Tech CV',
      description: 'Secondary CV highlighting Node.js, Express, REST APIs, and database architecture.',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10)
    },
    {
      id: 'doc_demo_cov1',
      userId,
      name: 'General SaaS Cover Pitch',
      originalName: 'Jordan_Taylor_General_Pitch.txt',
      storedName: 'doc_sample_cover.txt',
      mimeType: 'text/plain',
      size: 4200,
      category: 'Cover Letter',
      description: 'Standard value pitch emphasizing fast feature delivery, clean UX craft, and proactive collaboration.',
      createdAt: daysAgo(8),
      updatedAt: daysAgo(8)
    }
  ];

  const interviews = [
    {
      id: 'int_demo_1',
      userId,
      applicationId: 'app_demo_1',
      jobId: 'job_frontend_eng',
      company: 'Jobify Labs',
      position: 'Senior Frontend Engineer',
      stage: 'Technical interview',
      format: 'Video Call',
      date: daysAhead(2),
      time: '14:00',
      location: 'https://meet.google.com/jobify-tech-screen',
      interviewerName: 'Alex Morgan & Lead Engineer',
      interviewerEmail: 'admin@jobify.io',
      interviewerPhone: '+1 (555) 432-1098',
      prepNotes:
        'Have code sandbox ready. Be ready to explain state lifting, memoization, and custom hooks for infinite scroll.',
      questionsExpected:
        '1. How do you structure design tokens in CSS/Tailwind?\n2. Walk us through a complex performance bottleneck you diagnosed and resolved.',
      questionsAsked: '',
      feedback: '',
      outcome: 'Pending',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2)
    }
  ];

  const jobReports = [];

  return {
    users,
    profiles,
    jobs,
    applications,
    savedJobs,
    reminders,
    documents,
    interviews,
    jobReports
  };
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeedData();
    writeDb(seed);
    return;
  }

  // Safe migration to guarantee new collections exist in existing db.json
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(raw);
    let mutated = false;

    if (!Array.isArray(data.profiles)) {
      data.profiles = [];
      mutated = true;
    }
    if (!Array.isArray(data.savedJobs)) {
      data.savedJobs = [];
      mutated = true;
    }
    if (!Array.isArray(data.reminders)) {
      data.reminders = [];
      mutated = true;
    }
    if (!Array.isArray(data.documents)) {
      data.documents = [];
      mutated = true;
    }
    if (!Array.isArray(data.interviews)) {
      data.interviews = [];
      mutated = true;
    }
    if (!Array.isArray(data.jobReports)) {
      data.jobReports = [];
      mutated = true;
    }

    // Ensure applicant demo has default profile if missing
    if (data.users && data.users.some((u) => u.id === 'usr_applicant_demo')) {
      if (!data.profiles.some((p) => p.userId === 'usr_applicant_demo')) {
        const seed = createSeedData();
        data.profiles.push(...seed.profiles);
        data.savedJobs.push(...seed.savedJobs);
        data.reminders.push(...seed.reminders);
        data.documents.push(...seed.documents);
        data.interviews.push(...seed.interviews);
        mutated = true;
      }
    }

    if (mutated) {
      writeDb(data);
    }
  } catch {
    // If parse fails, rewrite fresh seed
    writeDb(createSeedData());
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
  writeDb,
  VALID_JOB_STATUSES,
  VALID_APP_STATUSES,
  SAVED_CATEGORIES,
  REMINDER_TYPES,
  DOCUMENT_CATEGORIES,
  INTERVIEW_STAGES,
  INTERVIEW_FORMATS,
  INTERVIEW_OUTCOMES
};
