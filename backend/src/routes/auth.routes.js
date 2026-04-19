const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const { authenticate } = require('../middleware/auth.middleware');
const auth = require('../controllers/auth.controller');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login',            authLimiter, auth.loginValidation, auth.login);
router.post('/refresh',          auth.refresh);
router.post('/logout',           authenticate, auth.logout);
router.get ('/me',               authenticate, auth.me);
router.post('/forgot-password',  authLimiter, auth.forgotPassword);
router.post('/reset-password',   authLimiter, auth.resetPasswordValidation, auth.resetPassword);
router.patch('/change-password', authenticate, auth.changePassword);

module.exports = router;
