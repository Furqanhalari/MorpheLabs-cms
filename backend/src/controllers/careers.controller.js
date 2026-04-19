const { PrismaClient } = require('@prisma/client');
const slugify  = require('slugify');
const { logAction } = require('../middleware/auth.middleware');
const { sendNewApplicationEmail } = require('../utils/email.utils');

const prisma = new PrismaClient();
const toSlug = (t) => slugify(t, { lower: true, strict: true });

// ── Job Listings ──────────────────────────────────────────────────────────────

const getJobs = async (req, res) => {
  const { status, department, page = 1, limit = 20, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (status)     where.status     = status;
  if (department) where.department = department;
  if (search)     where.OR = [
    { title:      { contains: search, mode: 'insensitive' } },
    { department: { contains: search, mode: 'insensitive' } },
  ];

  const [jobs, total] = await Promise.all([
    prisma.jobListing.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    }),
    prisma.jobListing.count({ where }),
  ]);

  return res.json({ data: jobs, meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
};

const getJob = async (req, res) => {
  const job = await prisma.jobListing.findUnique({
    where:   { id: req.params.id },
    include: { _count: { select: { applications: true } }, applications: req.user ? true : false },
  });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json(job);
};

const createJob = async (req, res) => {
  const { title, department, location, locationType, employmentType, description, requirements, responsibilities, benefits, salaryMin, salaryMax, salaryCurrency, applicationDeadline } = req.body;

  const job = await prisma.jobListing.create({
    data: {
      title, slug: toSlug(title), department, location,
      locationType:   locationType  || 'HYBRID',
      employmentType: employmentType || 'FULL_TIME',
      description, requirements, responsibilities, benefits,
      salaryMin: salaryMin ? parseInt(salaryMin) : null,
      salaryMax: salaryMax ? parseInt(salaryMax) : null,
      salaryCurrency,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      status: 'DRAFT',
    },
  });

  await logAction(req.user.id, 'CREATE', 'careers', job.id, { title }, req);
  return res.status(201).json(job);
};

const updateJob = async (req, res) => {
  const { title, ...rest } = req.body;
  const data = { ...rest };
  if (title) { data.title = title; data.slug = toSlug(title); }
  if (rest.salaryMin) data.salaryMin = parseInt(rest.salaryMin);
  if (rest.salaryMax) data.salaryMax = parseInt(rest.salaryMax);
  if (rest.applicationDeadline) data.applicationDeadline = new Date(rest.applicationDeadline);

  const job = await prisma.jobListing.update({ where: { id: req.params.id }, data });
  await logAction(req.user.id, 'UPDATE', 'careers', req.params.id, null, req);
  return res.json(job);
};

const publishJob = async (req, res) => {
  const job = await prisma.jobListing.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
  await logAction(req.user.id, 'PUBLISH', 'careers', req.params.id, null, req);
  return res.json(job);
};

const closeJob = async (req, res) => {
  const job = await prisma.jobListing.update({ where: { id: req.params.id }, data: { status: 'CLOSED' } });
  await logAction(req.user.id, 'CLOSE', 'careers', req.params.id, null, req);
  return res.json(job);
};

const deleteJob = async (req, res) => {
  await prisma.jobListing.delete({ where: { id: req.params.id } });
  await logAction(req.user.id, 'DELETE', 'careers', req.params.id, null, req);
  return res.json({ message: 'Job listing deleted' });
};

// ── Applications ──────────────────────────────────────────────────────────────

// Public: submit application
const submitApplication = async (req, res) => {
  const { jobId } = req.params;
  const job = await prisma.jobListing.findUnique({ where: { id: jobId } });

  if (!job || job.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'This position is not accepting applications' });
  }

  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    return res.status(400).json({ error: 'Application deadline has passed' });
  }

  const { firstName, lastName, email, phone, coverLetter, linkedInUrl, portfolioUrl } = req.body;

  // Resume uploaded via multer
  if (!req.file) return res.status(400).json({ error: 'Resume (PDF) is required' });
  const resumeUrl = `/uploads/resumes/${req.file.filename}`;

  const application = await prisma.application.create({
    data: {
      jobId, firstName, lastName, email, phone, resumeUrl,
      coverLetter, linkedInUrl, portfolioUrl,
      status: 'SUBMITTED',
    },
  });

  // Notify HR
  await sendNewApplicationEmail(process.env.HR_EMAIL, { job, applicant: application });

  return res.status(201).json({ message: 'Application submitted successfully', id: application.id });
};

// Admin: list applications for a job
const getApplications = async (req, res) => {
  const { jobId } = req.params;
  const { status, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { jobId };
  if (status) where.status = status;

  const [apps, total] = await Promise.all([
    prisma.application.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.application.count({ where }),
  ]);

  return res.json({ data: apps, meta: { total, page: parseInt(page) } });
};

// Admin: update application status
const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const app = await prisma.application.update({
    where: { id },
    data:  { status, notes },
  });

  await logAction(req.user.id, 'UPDATE_APPLICATION', 'applications', id, { status }, req);
  return res.json(app);
};

module.exports = { getJobs, getJob, createJob, updateJob, publishJob, closeJob, deleteJob, submitApplication, getApplications, updateApplicationStatus };
