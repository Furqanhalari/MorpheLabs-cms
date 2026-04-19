const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, logAction } = require('../middleware/auth.middleware');
const { sendWelcomeEmail } = require('../utils/email.utils');

const prisma = new PrismaClient();

router.use(authenticate);

// GET all users — Super Admin only
router.get('/', authorize('users','read'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id:true, email:true, firstName:true, lastName:true, role:true, isActive:true, lastLoginAt:true, createdAt:true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// POST invite new user
router.post('/', authorize('users','create'), async (req, res) => {
  const { email, firstName, lastName, role } = req.body;
  if (!email || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already in use' });

  const tempPass = uuidv4().slice(0, 12) + 'A1!';
  const password = await bcrypt.hash(tempPass, 12);
  const user = await prisma.user.create({ data: { email, firstName, lastName, role, password } });

  await sendWelcomeEmail(email, firstName, tempPass);
  await logAction(req.user.id, 'CREATE_USER', 'users', user.id, { email, role }, req);

  res.status(201).json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role });
});

// PATCH update role or active status
router.patch('/:id', authorize('users','update'), async (req, res) => {
  const { role, isActive } = req.body;
  const data = {};
  if (role !== undefined)     data.role     = role;
  if (isActive !== undefined) data.isActive = isActive;

  const user = await prisma.user.update({ where: { id: req.params.id }, data,
    select: { id:true, email:true, firstName:true, lastName:true, role:true, isActive:true },
  });
  await logAction(req.user.id, 'UPDATE_USER', 'users', req.params.id, data, req);
  res.json(user);
});

// DELETE user
router.delete('/:id', authorize('users','delete'), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  await prisma.user.delete({ where: { id: req.params.id } });
  await logAction(req.user.id, 'DELETE_USER', 'users', req.params.id, null, req);
  res.json({ message: 'User deleted' });
});

module.exports = router;
