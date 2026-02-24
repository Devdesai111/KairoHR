# KairoHR - AI-Powered Human Resource Management System

A full-stack, production-grade HRMS built with NestJS (backend) and React (frontend).

## 🚀 Features

- **Auth & RBAC** — JWT auth, 6 system roles, 48 granular permissions
- **Organization** — Multi-tenant, legal entities, locations, departments, HR policies
- **Employee Management** — Directory, org chart, onboarding/offboarding, documents
- **Attendance** — Check-in/out, shifts, rosters, regularization, live dashboard
- **Leave Management** — Multiple leave types, balance tracking, approvals, calendar
- **Payroll** — Salary templates, payroll runs, payslips, India statutory (PF/ESI/PT/TDS)
- **Recruitment ATS** — Jobs, candidates, pipeline stages, interviews, offers
- **Meetings** — Schedule, rooms, calendar view
- **Grievance** — Filing, tracking, compliance, incidents
- **Reports & Analytics** — Headcount, attrition, attendance, payroll, recruitment reports
- **AI HR Assistant** — Claude-powered chat, policy Q&A, HR insights, RAG knowledge base
- **Settings** — Org settings, notifications, integrations

## 🛠 Tech Stack

### Backend
- **NestJS 10** + TypeScript (strict mode)
- **Prisma 5** + PostgreSQL 16
- **Redis 7** (via ioredis + BullMQ)
- **AWS S3 / MinIO** (file storage)
- **Anthropic Claude API** (AI features)
- **Argon2id** (password hashing) + **AES-256-GCM** (field encryption)

### Frontend
- **React 18** + Vite + TypeScript
- **TanStack Query v5** (server state)
- **Zustand** (client state)
- **shadcn/ui** + Tailwind CSS
- **React Hook Form** + Zod
- **Recharts** (analytics)

## 📦 Getting Started

### Prerequisites
- Node.js 20+, pnpm, Docker

### Backend Setup
```bash
cd ai-hr-backend
cp .env.example .env          # Edit with your values
docker compose up -d          # Start PostgreSQL, Redis, MinIO
pnpm install
pnpm db:migrate               # Run migrations
pnpm db:seed                  # Seed demo data
pnpm dev                      # Start dev server on :3000
```

### Frontend Setup
```bash
cd ai-hr-frontend
cp .env.example .env          # Set VITE_API_URL=http://localhost:3000
npm install
npm run dev                   # Start dev server on :5173
```

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@techcorp.com | Admin@123 |
| HR Admin | hr@techcorp.com | Admin@123 |
| Employee | john.doe@techcorp.com | Admin@123 |

## 🗂 Project Structure
```
KairoHR/
├── ai-hr-backend/     # NestJS API
│   ├── prisma/        # Schema & migrations
│   └── src/
│       ├── modules/   # Feature modules (12+)
│       └── common/    # Guards, interceptors, utils
└── ai-hr-frontend/    # React SPA
    └── src/
        ├── pages/     # Route pages (40+)
        ├── components/# UI + layout + common
        └── stores/    # Zustand state
```

## 📖 API Documentation
Available at `http://localhost:3000/api/docs` (Swagger UI)

## 🏗 Architecture
- Multi-tenant row-level isolation (orgId on every table)
- JWT access tokens (15min) + refresh tokens (7d) with rotation
- BullMQ queues for payroll computation, emails, reports
- AES-256-GCM encryption for sensitive fields (bank details, PAN)
