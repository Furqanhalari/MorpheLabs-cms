const jwt    = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Role hierarchy ─────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    users:    ['create','read','update','delete'],
    posts:    ['create','read','update','delete','publish'],
    services: ['create','read','update','delete','publish'],
    careers:  ['create','read','update','delete','publish'],
    applications: ['read','update','delete'],
    media:    ['create','read','delete'],
    settings: ['read','update'],
    audit:    ['read'],
  },
  CONTENT_MANAGER: {
    posts:    ['create','read','update','delete','publish'],
    services: ['create','read','update','delete','publish'],
    careers:  ['create','read','update','delete','publish'],
    applications: ['read','update'],
    media:    ['create','read','delete'],
  },
  BLOG_EDITOR: {
    posts:    ['create','read','update','publish'],
    media:    ['create','read'],
  },
  BLOG_AUTHOR: {
    posts:    ['create','read','update'],
    media:    ['create','read'],
  },
  HR_MANAGER: {
    careers:  ['create','read','update','delete','publish'],
    applications: ['read','update','delete'],
    media:    ['create','read'],
  },
  VIEWER: {
    posts:    ['read'],
    services: ['read'],
    careers:  ['read'],
    applications: ['read'],
    media:    ['read'],
  },
};

// ── Verify Access Token ────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true, firstName: true, lastName: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Account not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Role-Based Access Control ──────────────────────────────────────────────────
const authorize = (resource, action) => (req, res, next) => {
  const permissions = ROLE_PERMISSIONS[req.user.role];
  if (!permissions) return res.status(403).json({ error: 'Access denied' });

  const resourcePerms = permissions[resource];
  if (!resourcePerms || !resourcePerms.includes(action)) {
    return res.status(403).json({
      error: `Permission denied: ${action} on ${resource}`,
    });
  }
  next();
};

// ── Own-Resource Guard ────────────────────────────────────────────────────────
// Blog Authors can only edit their own posts
const ownResourceOrRole = (roles) => (req, res, next) => {
  if (roles.includes(req.user.role)) return next();
  req.mustOwnResource = true;
  next();
};

// ── Log Action ────────────────────────────────────────────────────────────────
const logAction = async (userId, action, resource, resourceId, metadata, req) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: resourceId?.toString(),
        metadata,
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
      },
    });
  } catch (_) {}
};

module.exports = { authenticate, authorize, ownResourceOrRole, logAction, ROLE_PERMISSIONS };
