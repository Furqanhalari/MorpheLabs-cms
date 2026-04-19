const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const media = require('../controllers/media.controller');

router.use(authenticate);
router.get   ('/',    authorize('media','read'),   media.getMedia);
router.post  ('/',    authorize('media','create'), upload.single('file'), media.uploadMedia);
router.delete('/:id', authorize('media','delete'), media.deleteMedia);

module.exports = router;
