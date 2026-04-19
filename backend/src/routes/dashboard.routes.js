const router  = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/stats', async (req, res) => {
  const [totalPosts, publishedPosts, draftPosts, totalServices,
         publishedServices, activeJobs, totalApplications, recentApplications] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
    prisma.service.count(),
    prisma.service.count({ where: { isPublished: true } }),
    prisma.jobListing.count({ where: { status: 'ACTIVE' } }),
    prisma.application.count(),
    prisma.application.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { job: { select: { title: true } } },
    }),
  ]);

  res.json({ totalPosts, publishedPosts, draftPosts, totalServices, publishedServices, activeJobs, totalApplications, recentApplications });
});

router.get('/activity', async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    take: 20, orderBy: { createdAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true, role: true } } },
  });
  res.json(logs);
});

module.exports = router;
