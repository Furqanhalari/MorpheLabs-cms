const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const svc = require('../controllers/services.controller');

router.use(authenticate);

router.get   ('/',                  authorize('services','read'),    svc.getServices);
router.post  ('/reorder',           authorize('services','update'),  svc.reorderServices);
router.get   ('/:id',               authorize('services','read'),    svc.getService);
router.post  ('/',                  authorize('services','create'),  svc.createService);
router.put   ('/:id',               authorize('services','update'),  svc.updateService);
router.patch ('/:id/toggle',        authorize('services','publish'), svc.togglePublish);
router.delete('/:id',               authorize('services','delete'),  svc.deleteService);

router.get   ('/portfolio/all',     authorize('services','read'),   svc.getPortfolios);
router.get   ('/portfolio/:id',     authorize('services','read'),   svc.getPortfolio);
router.post  ('/portfolio',         authorize('services','create'), svc.createPortfolio);
router.put   ('/portfolio/:id',     authorize('services','update'), svc.updatePortfolio);
router.delete('/portfolio/:id',     authorize('services','delete'), svc.deletePortfolio);

router.get   ('/categories/all',    authorize('services','read'),   svc.getServiceCategories);
router.post  ('/categories',        authorize('services','create'), svc.createServiceCategory);

module.exports = router;
