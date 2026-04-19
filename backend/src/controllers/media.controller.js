const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path  = require('path');
const fs    = require('fs');

const getMedia = async (req, res) => {
  const { type, page = 1, limit = 50, search } = req.query;
  const where = {};
  if (type)   where.type = type.toUpperCase();
  if (search) where.originalName = { contains: search, mode: 'insensitive' };

  const [files, total] = await Promise.all([
    prisma.mediaFile.findMany({ where, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.mediaFile.count({ where }),
  ]);
  return res.json({ data: files, meta: { total, page: parseInt(page), pages: Math.ceil(total/parseInt(limit)) } });
};

const uploadMedia = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { file } = req;
  const type = file.mimetype.startsWith('image/') ? 'IMAGE'
             : file.mimetype === 'application/pdf' ? 'DOCUMENT'
             : file.mimetype.startsWith('video/')  ? 'VIDEO' : 'OTHER';

  const url = `/uploads/${file.filename}`;

  const media = await prisma.mediaFile.create({
    data: { filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, url, type, uploadedById: req.user.id },
  });

  return res.status(201).json(media);
};

const deleteMedia = async (req, res) => {
  const media = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
  if (!media) return res.status(404).json({ error: 'File not found' });

  const filepath = path.join(__dirname, '../../..', process.env.UPLOAD_DIR || 'uploads', media.filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

  await prisma.mediaFile.delete({ where: { id: req.params.id } });
  return res.json({ message: 'File deleted' });
};

module.exports = { getMedia, uploadMedia, deleteMedia };
