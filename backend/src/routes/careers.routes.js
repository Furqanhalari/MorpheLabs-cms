const router  = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const careers = require('../controllers/careers.controller');
const { resumeUpload } = require('../middleware/upload.middleware');

// ── Public: submit application ─────────────────────────────────────────────
router.post('/:jobId/applications', resumeUpload.single('resume'), careers.submitApplication);

// ── Protected ──────────────────────────────────────────────────────────────
router.use(authenticate);

router.get   ('/',                         authorize('careers','read'),    careers.getJobs);
router.get   ('/:id',                      authorize('careers','read'),    careers.getJob);
router.post  ('/',                         authorize('careers','create'),  careers.createJob);
router.put   ('/:id',                      authorize('careers','update'),  careers.updateJob);
router.patch ('/:id/publish',              authorize('careers','publish'), careers.publishJob);
router.patch ('/:id/close',                authorize('careers','publish'), careers.closeJob);
router.delete('/:id',                      authorize('careers','delete'),  careers.deleteJob);

router.get   ('/:jobId/applications',      authorize('applications','read'),   careers.getApplications);
router.patch ('/applications/:id/status',  authorize('applications','update'), careers.updateApplicationStatus);

module.exports = router;
