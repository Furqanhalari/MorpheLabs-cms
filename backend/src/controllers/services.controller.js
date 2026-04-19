const { PrismaClient } = require('@prisma/client');
const slugify  = require('slugify');
const { logAction } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();
const toSlug = (t) => slugify(t, { lower: true, strict: true });

// ── Services ──────────────────────────────────────────────────────────────────
const getServices = async (req, res) => {
  const { published, category, page = 1, limit = 50 } = req.query;
  const where = {};
  if (published !== undefined) where.isPublished = published === 'true';
  if (category)                where.category = { slug: category };

  const services = await prisma.service.findMany({
    where, orderBy: { sortOrder: 'asc' },
    include: { category: true, _count: { select: { portfolios: true } } },
    skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit),
  });

  return res.json(services);
};

const getService = async (req, res) => {
  const service = await prisma.service.findUnique({
    where:   { id: req.params.id },
    include: { category: true, portfolios: true },
  });
  if (!service) return res.status(404).json({ error: 'Service not found' });
  return res.json(service);
};

const createService = async (req, res) => {
  const { title, description, content, icon, image, categoryId, features = [], metaTitle, metaDesc } = req.body;

  const service = await prisma.service.create({
    data: {
      title, slug: toSlug(title), description, content, icon, image,
      categoryId, features, metaTitle, metaDesc, isPublished: false,
    },
    include: { category: true },
  });

  await logAction(req.user.id, 'CREATE', 'services', service.id, { title }, req);
  return res.status(201).json(service);
};

const updateService = async (req, res) => {
  const { title, ...rest } = req.body;
  const data = { ...rest };
  if (title) { data.title = title; data.slug = toSlug(title); }

  const service = await prisma.service.update({
    where:   { id: req.params.id }, data,
    include: { category: true },
  });

  await logAction(req.user.id, 'UPDATE', 'services', req.params.id, null, req);
  return res.json(service);
};

const togglePublish = async (req, res) => {
  const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data:  { isPublished: !existing.isPublished },
  });
  await logAction(req.user.id, service.isPublished ? 'PUBLISH' : 'UNPUBLISH', 'services', req.params.id, null, req);
  return res.json(service);
};

const deleteService = async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } });
  await logAction(req.user.id, 'DELETE', 'services', req.params.id, null, req);
  return res.json({ message: 'Service deleted' });
};

// Reorder services
const reorderServices = async (req, res) => {
  const { order } = req.body; // [{ id, sortOrder }]
  const updates = order.map(({ id, sortOrder }) =>
    prisma.service.update({ where: { id }, data: { sortOrder } })
  );
  await Promise.all(updates);
  return res.json({ message: 'Order updated' });
};

// ── Portfolio ─────────────────────────────────────────────────────────────────
const getPortfolios = async (req, res) => {
  const { published, service } = req.query;
  const where = {};
  if (published !== undefined) where.isPublished = published === 'true';
  if (service)                 where.serviceId   = service;

  const items = await prisma.portfolioItem.findMany({
    where, orderBy: { sortOrder: 'asc' },
    include: { service: { select: { id: true, title: true, slug: true } } },
  });
  return res.json(items);
};

const getPortfolio = async (req, res) => {
  const item = await prisma.portfolioItem.findUnique({
    where: { id: req.params.id }, include: { service: true },
  });
  if (!item) return res.status(404).json({ error: 'Portfolio item not found' });
  return res.json(item);
};

const createPortfolio = async (req, res) => {
  const { title, clientName, industry, description, content, coverImage, images = [], results, tags = [], serviceId, completedAt } = req.body;

  const item = await prisma.portfolioItem.create({
    data: {
      title, slug: toSlug(title), clientName, industry,
      description, content, coverImage, images, results, tags,
      serviceId, completedAt: completedAt ? new Date(completedAt) : null,
      isPublished: false,
    },
  });

  await logAction(req.user.id, 'CREATE', 'portfolio', item.id, { title }, req);
  return res.status(201).json(item);
};

const updatePortfolio = async (req, res) => {
  const { title, ...rest } = req.body;
  const data = { ...rest };
  if (title) { data.title = title; data.slug = toSlug(title); }
  if (rest.completedAt) data.completedAt = new Date(rest.completedAt);

  const item = await prisma.portfolioItem.update({ where: { id: req.params.id }, data });
  await logAction(req.user.id, 'UPDATE', 'portfolio', req.params.id, null, req);
  return res.json(item);
};

const deletePortfolio = async (req, res) => {
  await prisma.portfolioItem.delete({ where: { id: req.params.id } });
  await logAction(req.user.id, 'DELETE', 'portfolio', req.params.id, null, req);
  return res.json({ message: 'Portfolio item deleted' });
};

// ── Service Categories ────────────────────────────────────────────────────────
const getServiceCategories = async (req, res) => {
  const cats = await prisma.serviceCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { services: true } } } });
  return res.json(cats);
};

const createServiceCategory = async (req, res) => {
  const { name, description } = req.body;
  const cat = await prisma.serviceCategory.create({ data: { name, slug: toSlug(name), description } });
  return res.status(201).json(cat);
};

module.exports = { getServices, getService, createService, updateService, togglePublish, deleteService, reorderServices, getPortfolios, getPortfolio, createPortfolio, updatePortfolio, deletePortfolio, getServiceCategories, createServiceCategory };
