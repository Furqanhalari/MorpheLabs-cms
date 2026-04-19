# MorpheLabs CMS

A full-stack, production-ready Content Management System for MorpheLabs built with:

- **Backend:** Node.js + Express + Prisma ORM
- **Database:** PostgreSQL
- **Admin Panel:** React + Vite + Ant Design
- **Public Frontend:** Next.js (ISR)
- **Auth:** JWT (access + refresh tokens) + bcrypt

---

## Project Structure

```
morphelabs-cms/
├── backend/              # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma # Full DB schema (15 tables)
│   │   └── seed.js       # Seed data with default users
│   └── src/
│       ├── server.js
│       ├── controllers/  # auth, blog, careers, services, media
│       ├── middleware/   # auth (JWT + RBAC), upload (multer)
│       ├── routes/       # all API routes
│       └── utils/        # jwt, email utilities
├── admin/                # React + Ant Design admin panel
│   └── src/
│       ├── App.jsx
│       ├── contexts/     # AuthContext with useAuth hook
│       ├── pages/        # Dashboard, Blog, Services, Careers, Media, Users, Audit
│       └── services/     # axios API client with auto-refresh
└── frontend/             # Next.js public website
    ├── lib/cms.js        # CMS API client with ISR fetch
    └── pages/            # blog, careers pages
```

---

## Prerequisites

| Tool       | Version    |
|------------|------------|
| Node.js    | >= 18.x    |
| PostgreSQL | >= 14.x    |
| npm        | >= 9.x     |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/morphelabs/cms.git
cd morphelabs-cms

# Install all dependencies
cd backend  && npm install && cd ..
cd admin    && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Set Up PostgreSQL

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE morphelabs_cms;"
```

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and secrets
```

**Required .env values:**

| Variable              | Description                        |
|-----------------------|------------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string        |
| `JWT_ACCESS_SECRET`   | 64-char random string               |
| `JWT_REFRESH_SECRET`  | 64-char random string (different)   |
| `SMTP_HOST/USER/PASS` | Email credentials                   |
| `HR_EMAIL`            | Email to notify on new applications |

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Run Database Migrations & Seed

```bash
cd backend
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Apply all migrations
npm run db:seed          # Seed default users and content
```

**Default seed accounts:**

| Email                    | Password      | Role         |
|--------------------------|---------------|--------------|
| admin@morphelabs.org     | Admin@1234    | Super Admin  |
| editor@morphelabs.org    | Editor@1234   | Blog Editor  |
| hr@morphelabs.org        | Hr@1234567    | HR Manager   |

> ⚠️ Change all passwords immediately after first login in production.

### 5. Start Development Servers

Open **3 terminal windows:**

```bash
# Terminal 1 — Backend API (port 4000)
cd backend && npm run dev

# Terminal 2 — Admin Panel (port 5173)
cd admin && npm run dev

# Terminal 3 — Public Frontend (port 3000)
cd frontend && npm run dev
```

**Access URLs:**
- Admin Panel: http://localhost:5173
- Public Site: http://localhost:3000
- API:         http://localhost:4000/api/v1
- Health:      http://localhost:4000/health
- DB Studio:   `cd backend && npx prisma studio`

---

## API Overview

### Auth
| Method | Endpoint                       | Description              |
|--------|-------------------------------|--------------------------|
| POST   | /api/v1/auth/login            | Login → access + cookie  |
| POST   | /api/v1/auth/refresh          | Rotate refresh token     |
| POST   | /api/v1/auth/logout           | Revoke refresh token     |
| GET    | /api/v1/auth/me               | Current user             |
| POST   | /api/v1/auth/forgot-password  | Send reset email         |
| POST   | /api/v1/auth/reset-password   | Apply new password       |

### Blog
| Method | Endpoint                    | Description             |
|--------|-----------------------------|-------------------------|
| GET    | /api/v1/blog                | List posts (paginated)  |
| POST   | /api/v1/blog                | Create post             |
| GET    | /api/v1/blog/:id            | Get post by ID          |
| PUT    | /api/v1/blog/:id            | Update post             |
| DELETE | /api/v1/blog/:id            | Delete post             |
| PATCH  | /api/v1/blog/:id/publish    | Publish post            |
| PATCH  | /api/v1/blog/:id/unpublish  | Unpublish post          |

### Careers
| Method | Endpoint                              | Auth      | Description               |
|--------|---------------------------------------|-----------|---------------------------|
| GET    | /api/v1/careers                       | Required  | List job listings          |
| POST   | /api/v1/careers                       | Required  | Create listing             |
| PATCH  | /api/v1/careers/:id/publish           | Required  | Publish listing            |
| PATCH  | /api/v1/careers/:id/close             | Required  | Close listing              |
| POST   | /api/v1/careers/:jobId/applications   | **Public**| Submit application + PDF   |
| GET    | /api/v1/careers/:jobId/applications   | Required  | List applications (admin)  |
| PATCH  | /api/v1/careers/applications/:id/status | Required | Update applicant status   |

### Media
| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| GET    | /api/v1/media     | List media library   |
| POST   | /api/v1/media     | Upload file          |
| DELETE | /api/v1/media/:id | Delete file          |

---

## Role-Based Access Control

| Permission           | Super Admin | Content Mgr | Blog Editor | Blog Author | HR Manager | Viewer |
|----------------------|:-----------:|:-----------:|:-----------:|:-----------:|:----------:|:------:|
| Manage Users         | ✅          | ❌          | ❌          | ❌          | ❌         | ❌     |
| Publish Posts        | ✅          | ✅          | ✅          | ❌          | ❌         | ❌     |
| Edit Any Post        | ✅          | ✅          | ✅          | Own only    | ❌         | ❌     |
| Create Posts         | ✅          | ✅          | ✅          | ✅          | ❌         | ❌     |
| Manage Services      | ✅          | ✅          | ❌          | ❌          | ❌         | ❌     |
| Manage Jobs          | ✅          | ✅          | ❌          | ❌          | ✅         | ❌     |
| View Applications    | ✅          | ✅          | ❌          | ❌          | ✅         | ❌     |
| View Audit Logs      | ✅          | ❌          | ❌          | ❌          | ❌         | ❌     |

---

## Security Architecture

- **JWT Access Tokens:** 15-minute expiry, signed with HS256
- **Refresh Tokens:** 7-day expiry, stored as HttpOnly cookie, rotated on every use
- **Passwords:** bcrypt with cost factor 12 minimum
- **Rate Limiting:** 5 failed logins per 15 minutes → lockout
- **File Uploads:** Type whitelist + 10MB limit + filename UUID sanitization
- **CORS:** Explicit origin whitelist, credentials: true
- **Helmet:** Security headers (HSTS, CSP, X-Frame-Options, etc.)
- **Audit Logging:** Every create/update/delete/publish/login stored with IP and user agent
- **SQL Injection:** Prevented by Prisma parameterized queries — zero raw string interpolation

---

## Production Deployment

```bash
# Build admin panel
cd admin && npm run build

# Build Next.js frontend
cd frontend && npm run build

# Run migrations on production DB
cd backend && npx prisma migrate deploy

# Start API in production
cd backend && NODE_ENV=production npm start
```

**Recommended production stack:**
- API: PM2 or Docker on any VPS
- Admin: Vercel or Netlify (static build)
- Frontend: Vercel (for ISR support)
- Database: Supabase, Railway, or self-hosted PostgreSQL
- Files: Local disk (current) or migrate to S3-compatible storage

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `prisma: command not found` | Run `npx prisma` instead, or `npm install -g prisma` |
| Database connection refused | Check DATABASE_URL in .env, ensure PostgreSQL is running |
| CORS errors in admin panel | Ensure ADMIN_URL in backend .env matches your admin dev URL |
| Uploads not serving | Check UPLOAD_DIR path and that directory exists |
| Email not sending | In development, emails are logged to console — check terminal |
| Token expired on page refresh | Normal — the admin auto-refreshes via the cookie |

---

## Developed By

**Furqan Halari**  
AI Automation Intern — MorpheLabs  
Task #5 — April 2026
