const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken, revokeRefreshToken, revokeAllUserTokens } = require('../utils/jwt.utils');
const { logAction } = require('../middleware/auth.middleware');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email.utils');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// ── POST /api/v1/auth/login ────────────────────────────────────────────────────
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await logAction(user.id, 'LOGIN_FAILED', 'auth', null, { email }, req);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken  = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data:  { lastLoginAt: new Date() },
  });

  await logAction(user.id, 'LOGIN', 'auth', user.id, null, req);

  // Set refresh token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.json({
    accessToken,
    user: {
      id:        user.id,
      email:     user.email,
      firstName: user.firstName,
      lastName:  user.lastName,
      role:      user.role,
      avatar:    user.avatar,
    },
  });
};

// ── POST /api/v1/auth/refresh ──────────────────────────────────────────────────
const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  // Rotate: revoke old, issue new
  await revokeRefreshToken(token);
  const newRefresh = await generateRefreshToken(stored.userId);
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });

  if (!user || !user.isActive) return res.status(401).json({ error: 'User not found' });

  const accessToken = generateAccessToken(user.id, user.role);

  res.cookie('refreshToken', newRefresh, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ accessToken });
};

// ── POST /api/v1/auth/logout ───────────────────────────────────────────────────
const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) await revokeRefreshToken(token);
  res.clearCookie('refreshToken');
  if (req.user) await logAction(req.user.id, 'LOGOUT', 'auth', null, null, req);
  return res.json({ message: 'Logged out successfully' });
};

// ── GET /api/v1/auth/me ────────────────────────────────────────────────────────
const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user.id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, lastLoginAt: true, createdAt: true },
  });
  return res.json(user);
};

// ── POST /api/v1/auth/forgot-password ─────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return 200 to prevent user enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

  const token     = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({ data: { token, userId: user.id, expiresAt } });
  await sendPasswordResetEmail(user.email, token);

  return res.json({ message: 'If that email exists, a reset link was sent.' });
};

// ── POST /api/v1/auth/reset-password ──────────────────────────────────────────
const resetPasswordValidation = [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*\d)/),
];

const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { token, password } = req.body;
  const reset = await prisma.passwordReset.findUnique({ where: { token } });

  if (!reset || reset.used || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } }),
    prisma.passwordReset.update({ where: { token }, data: { used: true } }),
  ]);

  await revokeAllUserTokens(reset.userId);
  return res.json({ message: 'Password reset successfully' });
};

// ── PATCH /api/v1/auth/change-password ────────────────────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ error: 'Current password incorrect' });

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await revokeAllUserTokens(user.id);

  await logAction(user.id, 'PASSWORD_CHANGED', 'auth', null, null, req);
  return res.json({ message: 'Password changed. Please log in again.' });
};

module.exports = { login, loginValidation, refresh, logout, me, forgotPassword, resetPassword, resetPasswordValidation, changePassword };
