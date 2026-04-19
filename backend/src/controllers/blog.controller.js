const { PrismaClient } = require('@prisma/client');
const slugify  = require('slugify');
const { logAction } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

const toSlug = (title) => slugify(title, { lower: true, strict: true, trim: true });

// ── Helpers ───────────────────────────────────────────────────────────────────
const postSelect = {
  id: true, title: true, slug: true, excerpt: true, status: true,
  isFeatured: true, readingTime: true, featuredImage: true,
  publishedAt: true, scheduledAt: true, viewCount: true,
  createdAt: true, updatedAt: true,
  metaTitle: true, metaDescription: true, ogImage: true,
  author: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
  categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
  tags:       { select: { tag:      { select: { id: true, name: true, slug: true } } } },
};

const calcReadingTime = (content) => Math.ceil(content.replace(/<[^>]*>/g, '').split(' ').length / 200);

// ── GET /api/v1/blog/posts ────────────────────────────────────────────────────
const getPosts = async (req, res) => {
  const { status, page = 1, limit = 20, search, category, author, featured } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status)   where.status    = status;
  if (featured) where.isFeatured = featured === 'true';
  if (author)   where.authorId  = author;
  if (search)   where.OR = [
    { title:   { contains: search, mode: 'insensitive' } },
    { excerpt: { contains: search, mode: 'insensitive' } },
  ];
  if (category) where.categories = { some: { category: { slug: category } } };

  // Authors only see their own posts
  if (req.user.role === 'BLOG_AUTHOR') where.authorId = req.user.id;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, select: postSelect, skip, take: parseInt(limit), orderBy: { updatedAt: 'desc' } }),
    prisma.post.count({ where }),
  ]);

  return res.json({ data: posts, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
};

// ── GET /api/v1/blog/posts/:id ────────────────────────────────────────────────
const getPost = async (req, res) => {
  const post = await prisma.post.findUnique({
    where:  { id: req.params.id },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
               categories: { include: { category: true } },
               tags: { include: { tag: true } } },
  });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  return res.json(post);
};

// ── POST /api/v1/blog/posts ───────────────────────────────────────────────────
const createPost = async (req, res) => {
  const { title, excerpt, content, featuredImage, categories = [], tags = [], metaTitle, metaDescription, ogImage, isFeatured } = req.body;

  const slug        = toSlug(title);
  const readingTime = calcReadingTime(content || '');

  const post = await prisma.post.create({
    data: {
      title, slug, excerpt, content, featuredImage, readingTime, isFeatured: !!isFeatured,
      metaTitle, metaDescription, ogImage,
      status:   'DRAFT',
      authorId: req.user.id,
      categories: { create: categories.map(id => ({ category: { connect: { id } } })) },
      tags:       { create: tags.map(id =>       ({ tag:      { connect: { id } } })) },
    },
    include: { author: { select: { id: true, firstName: true, lastName: true } },
               categories: { include: { category: true } }, tags: { include: { tag: true } } },
  });

  await logAction(req.user.id, 'CREATE', 'posts', post.id, { title }, req);
  return res.status(201).json(post);
};

// ── PUT /api/v1/blog/posts/:id ────────────────────────────────────────────────
const updatePost = async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Post not found' });

  // Authors can only edit their own
  if (req.user.role === 'BLOG_AUTHOR' && existing.authorId !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own posts' });
  }

  const { title, excerpt, content, featuredImage, categories, tags, metaTitle, metaDescription, ogImage, isFeatured } = req.body;

  const data = {};
  if (title !== undefined)           { data.title = title; data.slug = toSlug(title); }
  if (excerpt !== undefined)          data.excerpt = excerpt;
  if (content !== undefined)          { data.content = content; data.readingTime = calcReadingTime(content); }
  if (featuredImage !== undefined)    data.featuredImage = featuredImage;
  if (metaTitle !== undefined)        data.metaTitle = metaTitle;
  if (metaDescription !== undefined)  data.metaDescription = metaDescription;
  if (ogImage !== undefined)          data.ogImage = ogImage;
  if (isFeatured !== undefined)       data.isFeatured = isFeatured;

  // Sync categories and tags
  if (categories) {
    await prisma.postCategory.deleteMany({ where: { postId: id } });
    data.categories = { create: categories.map(cid => ({ category: { connect: { id: cid } } })) };
  }
  if (tags) {
    await prisma.postTag.deleteMany({ where: { postId: id } });
    data.tags = { create: tags.map(tid => ({ tag: { connect: { id: tid } } })) };
  }

  const post = await prisma.post.update({ where: { id }, data,
    include: { author: { select: { id: true, firstName: true, lastName: true } },
               categories: { include: { category: true } }, tags: { include: { tag: true } } },
  });

  await logAction(req.user.id, 'UPDATE', 'posts', id, { title: data.title }, req);
  return res.json(post);
};

// ── PATCH /api/v1/blog/posts/:id/publish ─────────────────────────────────────
const publishPost = async (req, res) => {
  const { id } = req.params;
  const { scheduledAt } = req.body;

  const post = await prisma.post.update({
    where: { id },
    data: {
      status:      scheduledAt ? 'SCHEDULED' : 'PUBLISHED',
      publishedAt: scheduledAt ? null : new Date(),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  await logAction(req.user.id, 'PUBLISH', 'posts', id, null, req);
  return res.json(post);
};

// ── PATCH /api/v1/blog/posts/:id/unpublish ────────────────────────────────────
const unpublishPost = async (req, res) => {
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data:  { status: 'DRAFT', publishedAt: null, scheduledAt: null },
  });
  await logAction(req.user.id, 'UNPUBLISH', 'posts', req.params.id, null, req);
  return res.json(post);
};

// ── DELETE /api/v1/blog/posts/:id ─────────────────────────────────────────────
const deletePost = async (req, res) => {
  const { id } = req.params;
  await prisma.post.delete({ where: { id } });
  await logAction(req.user.id, 'DELETE', 'posts', id, null, req);
  return res.json({ message: 'Post deleted' });
};

// ── Categories ────────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { posts: true } } } });
  return res.json(categories);
};

const createCategory = async (req, res) => {
  const { name, description, color } = req.body;
  const category = await prisma.category.create({ data: { name, slug: toSlug(name), description, color } });
  return res.status(201).json(category);
};

const updateCategory = async (req, res) => {
  const { name, description, color } = req.body;
  const category = await prisma.category.update({ where: { id: req.params.id }, data: { name, slug: toSlug(name), description, color } });
  return res.json(category);
};

const deleteCategory = async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Category deleted' });
};

// ── Tags ──────────────────────────────────────────────────────────────────────
const getTags = async (req, res) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { posts: true } } } });
  return res.json(tags);
};

const createTag = async (req, res) => {
  const { name } = req.body;
  const tag = await prisma.tag.create({ data: { name, slug: toSlug(name) } });
  return res.status(201).json(tag);
};

const deleteTag = async (req, res) => {
  await prisma.tag.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Tag deleted' });
};

module.exports = { getPosts, getPost, createPost, updatePost, publishPost, unpublishPost, deletePost, getCategories, createCategory, updateCategory, deleteCategory, getTags, createTag, deleteTag };
