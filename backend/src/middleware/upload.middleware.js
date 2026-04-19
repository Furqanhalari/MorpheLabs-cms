const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const resumeDir = path.join(uploadDir, 'resumes');

[uploadDir, resumeDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = file.fieldname === 'resume' ? resumeDir : uploadDir;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf','video/mp4','video/webm',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type ${file.mimetype} not allowed`), false);
};

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 10;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

const resumeUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted for resumes'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for resumes
});

module.exports = { upload, resumeUpload };
