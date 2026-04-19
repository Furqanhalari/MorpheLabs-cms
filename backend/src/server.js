require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path       = require('path');
const { rateLimit } = require('express-rate-limit');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const blogRoutes     = require('./routes/blog.routes');
const servicesRoutes = require('./routes/services.routes');
const careersRoutes  = require('./routes/careers.routes');
const mediaRoutes    = require('./routes/media.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Global Rate Limit ─────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again later.' },
}));

// ── General Middleware ────────────────────────────────────────────────────────
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Static Uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/users',     userRoutes);
app.use('/api/v1/blog',      blogRoutes);
app.use('/api/v1/services',  servicesRoutes);
app.use('/api/v1/careers',   careersRoutes);
app.use('/api/v1/media',     mediaRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message;
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 MorpheLabs CMS API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
