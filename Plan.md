# AI_HR — Complete Backend Build Plan

> **Purpose:** Step-by-step execution guide for building a production-grade backend for the AI_HR platform using Claude Code.
> **Frontend:** React 18 + Vite + Tailwind 4 + Radix UI + shadcn/ui (already built, uses mock data throughout)
> **Goal:** Replace every mock data source with real API calls backed by a scalable backend.

---

## 1. Project Audit Summary

### 1.1 Frontend Modules Identified (12 domains, ~80 components)

| # | Module | Key Components | Core Entities |
|---|--------|---------------|---------------|
| 1 | **Organization Setup** | OrganizationProfile, LegalEntitiesManager, LocationsBranchesManager, DepartmentsManager, HRPoliciesDocuments, WorkTimePolicies | Organization, LegalEntity, Location, Department, Policy, WorkTimeRule |
| 2 | **Roles & Access (RBAC)** | RolesAccess (RoleManagement, AccessMatrix, ApprovalAuthority, AuditLog) | Role, Permission, RolePermission, ApprovalChain, AuditLog |
| 3 | **Employee Management** | EmployeeDirectory, AddEditEmployee, EmployeeProfile, OnboardingPipeline, OffboardingManagement | Employee, EmployeeDocument, OnboardingTask, OffboardingTask, Transfer |
| 4 | **Attendance** | AttendanceDashboard, LiveAttendance, AttendanceHistory, ShiftsRosters, RegularizationRequests, AttendanceRules, AttendanceReports | AttendanceRecord, Shift, Roster, RegularizationRequest, AttendanceRule |
| 5 | **Leave Management** | LeaveDashboard, LeaveApplications, LeaveApprovals, LeaveBalance, LeaveCalendar, LeavePolicies, LeaveTypes, LeaveReports | LeaveType, LeavePolicy, LeaveApplication, LeaveBalance, LeaveEncashment |
| 6 | **Payroll & Salary** | PayrollDashboard, PayrollProcessing, SalaryStructure, PaySlips, StatutoryCompliance, Reimbursements, LoansAdvances, PayrollReports | SalaryTemplate, SalaryComponent, PayrollRun, PaySlip, Reimbursement, Loan, StatutoryConfig |
| 7 | **Recruitment (ATS)** | Recruitment (Jobs, Candidates, Pipeline, Interviews, Offers, Analytics) | JobRequisition, Candidate, Application, Interview, Offer, RecruitmentPipeline |
| 8 | **Meetings & Calendar** | MyMeetings, MeetingScheduler, CalendarView, MeetingRooms, RecurringMeetings, MeetingAnalytics | Meeting, MeetingRoom, MeetingParticipant, RecurrenceRule |
| 9 | **Grievance & Compliance** | GrievanceDashboard, GrievanceManagement, InvestigationManagement, WhistleblowerPortal, ComplianceTracker, IncidentReports, AuditLogs, ComplianceReports | Grievance, Investigation, WhistleblowerReport, ComplianceItem, IncidentReport |
| 10 | **AI HR Assistant** | AIChatInterface, AIDocumentAnalysis, AIInsights, AIKnowledgeBase, AIPolicyQA, AIWorkflowAutomation | ChatSession, ChatMessage, KBDocument, WorkflowTemplate, AIInsight |
| 11 | **Reports & Analytics** | ReportsAnalytics | ReportDefinition, ScheduledReport, ExportJob |
| 12 | **Settings** | Settings (General, Notifications, Integrations, Security) | SystemSetting, NotificationPreference, Integration, SecurityConfig |

### 1.2 Key Observations

- **India-focused statutory compliance:** PF, ESI, PT, Professional Tax, TDS — deeply embedded in payroll.
- **Multi-tenant architecture needed:** Organizations → Legal Entities → Locations → Departments hierarchy.
- **Role system is granular:** 6 predefined roles (Super Admin → Employee) with module-level permission matrix.
- **All data is currently mock:** Every component has inline `const mock*` arrays — zero API integration exists.
- **AI features are UI shells:** Chat, document analysis, insights — all need real LLM integration.

---

## 2. Architecture Decision

### 2.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js 20 LTS + TypeScript 5 | Same language as frontend, strong typing, mature ecosystem |
| **Framework** | NestJS 10 | Production-grade, modular, built-in DI, guards, interceptors, OpenAPI |
| **Database** | PostgreSQL 16 | Relational data fits HR domain perfectly, JSONB for flexible fields, battle-tested |
| **ORM** | Prisma 5 | Type-safe queries, excellent migrations, introspection, good DX with Claude Code |
| **Cache** | Redis 7 | Session store, rate limiting, job queues, real-time attendance cache |
| **Queue** | BullMQ (Redis-backed) | Payroll processing, report generation, email notifications, async AI calls |
| **Auth** | Passport.js + JWT + Refresh tokens | Industry standard, supports SSO extension later |
| **File Storage** | S3-compatible (MinIO for local dev) | Documents, payslips, profile images, policy PDFs |
| **AI Integration** | Anthropic Claude API | Chat, document analysis, policy QA, insights generation |
| **Search** | PostgreSQL full-text search (→ Elasticsearch later) | Good enough for v1, clear migration path |
| **API Style** | REST with OpenAPI 3.0 spec | Frontend team familiarity, tooling, codegen potential |
| **Validation** | class-validator + class-transformer | Request validation at the framework level |
| **Testing** | Jest + Supertest | Unit + integration, NestJS native support |
| **Logging** | Pino (structured JSON) | Fast, structured, ELK-compatible |
| **Monitoring** | Prometheus metrics endpoint + health checks | Ready for Grafana dashboards |

### 2.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                   React Frontend                      │
│          (Vite + Tailwind + shadcn/ui)               │
└──────────────────┬───────────────────────────────────┘
                   │ HTTPS / REST
┌──────────────────▼───────────────────────────────────┐
│               API Gateway / NestJS                    │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐            │
│  │ Auth    │ │ Rate     │ │ Request    │            │
│  │ Guard   │ │ Limiter  │ │ Validation │            │
│  └────┬────┘ └────┬─────┘ └─────┬──────┘            │
│       └───────────┴─────────────┘                    │
│  ┌───────────────────────────────────────────┐       │
│  │           Domain Modules                   │       │
│  │  org │ employee │ attendance │ leave │ ... │       │
│  └───────────────┬───────────────────────────┘       │
│                  │                                    │
│  ┌───────┐  ┌───▼────┐  ┌────────┐  ┌──────────┐   │
│  │ Redis │  │Postgres│  │ S3/    │  │ BullMQ   │   │
│  │ Cache │  │  (DB)  │  │ MinIO  │  │ (Queues) │   │
│  └───────┘  └────────┘  └────────┘  └──────────┘   │
└──────────────────────────────────────────────────────┘
```

### 2.3 Multi-Tenancy Model

**Row-level isolation** with `organization_id` on every table. Reasons:

- Simpler ops than schema-per-tenant at this stage
- Scales to hundreds of organizations
- RLS (Row-Level Security) in Postgres as a safety net
- Clear migration path to schema isolation if needed later

---

## 3. Phased Execution Plan

### Phase 0 — Project Scaffolding & Infrastructure
**Estimated effort: 1 session**

```
TASK 0.1: Initialize NestJS project
───────────────────────────────────
- nest new ai-hr-backend --strict --package-manager pnpm
- Configure TypeScript strict mode, path aliases
- Set up folder structure (see 3.1)
- Add .env.example, .env.local with all config keys
- Docker Compose: PostgreSQL 16 + Redis 7 + MinIO

TASK 0.2: Core infrastructure modules
──────────────────────────────────────
- ConfigModule (environment-based, validated with Joi)
- LoggerModule (Pino with request-id correlation)
- DatabaseModule (Prisma with connection pooling)
- CacheModule (Redis with ioredis)
- QueueModule (BullMQ setup)
- HealthModule (/health, /health/db, /health/redis)
- Prometheus metrics endpoint (/metrics)

TASK 0.3: Global middleware & interceptors
──────────────────────────────────────────
- RequestIdMiddleware (UUID per request)
- LoggingInterceptor (request/response logging)
- TransformInterceptor (standard response envelope)
- HttpExceptionFilter (consistent error format)
- TimeoutInterceptor (30s default)
- Response envelope: { success, data, error, meta: { requestId, timestamp } }

TASK 0.4: API documentation
────────────────────────────
- Swagger/OpenAPI setup via @nestjs/swagger
- Auto-generate from decorators
- Available at /api/docs in non-production
```

#### 3.1 Folder Structure

```
ai-hr-backend/
├── docker-compose.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/                    # Shared utilities
│   │   ├── decorators/            # @CurrentUser, @Roles, @ApiPaginated
│   │   ├── dto/                   # PaginationDto, SortDto, FilterDto
│   │   ├── enums/
│   │   ├── exceptions/
│   │   ├── filters/               # HttpExceptionFilter
│   │   ├── guards/                # JwtAuthGuard, RolesGuard, PermissionsGuard
│   │   ├── interceptors/          # Logging, Transform, Timeout
│   │   ├── interfaces/
│   │   ├── middleware/            # RequestId, RateLimit
│   │   ├── pipes/                 # ValidationPipe config
│   │   └── utils/                 # date helpers, crypto, pagination
│   ├── config/                    # Configuration module
│   ├── database/                  # Prisma module + service
│   ├── cache/                     # Redis module
│   ├── queue/                     # BullMQ module
│   ├── storage/                   # S3/MinIO file service
│   ├── mail/                      # Email service (templates + transport)
│   ├── modules/
│   │   ├── auth/
│   │   ├── organization/
│   │   ├── rbac/
│   │   ├── employee/
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── payroll/
│   │   ├── recruitment/
│   │   ├── meeting/
│   │   ├── grievance/
│   │   ├── ai-assistant/
│   │   ├── report/
│   │   └── settings/
│   └── jobs/                      # Background job processors
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── scripts/
    ├── seed-dev.ts
    └── migrate-prod.sh
```

---

### Phase 1 — Authentication & Authorization + Organization
**Estimated effort: 2 sessions**

```
TASK 1.1: Prisma schema — Auth & Org entities
──────────────────────────────────────────────
Tables:
  - Organization (id, name, domain, logo_url, settings JSONB, status, created_at)
  - User (id, org_id, email, password_hash, first_name, last_name, status, last_login)
  - RefreshToken (id, user_id, token_hash, expires_at, revoked)
  - Role (id, org_id, name, description, type [system|custom], is_active)
  - Permission (id, module, action, description)
  - RolePermission (role_id, permission_id)
  - UserRole (user_id, role_id)
  - LegalEntity (id, org_id, name, registration_no, gst_no, pan, address JSONB, status)
  - Location (id, org_id, legal_entity_id, name, type, address JSONB, coordinates, timezone)
  - Department (id, org_id, name, code, parent_id, head_employee_id, location_id, status)
  - AuditLog (id, org_id, user_id, entity_type, entity_id, action, changes JSONB, ip, timestamp)

Key indexes:
  - User: (org_id, email) UNIQUE
  - AuditLog: (org_id, entity_type, created_at)
  - All tables: org_id (for RLS)

TASK 1.2: Auth module
─────────────────────
Endpoints:
  POST   /api/v1/auth/register          # Org + first admin user creation
  POST   /api/v1/auth/login             # Returns JWT access + refresh token
  POST   /api/v1/auth/refresh           # Rotate refresh token
  POST   /api/v1/auth/logout            # Revoke refresh token
  POST   /api/v1/auth/forgot-password   # Send reset email
  POST   /api/v1/auth/reset-password    # Set new password
  GET    /api/v1/auth/me                # Current user profile

Security:
  - Argon2id for password hashing (NOT bcrypt — resistant to GPU attacks)
  - JWT access token: 15min TTL, includes { userId, orgId, roles }
  - Refresh token: 7-day TTL, stored hashed in DB, single-use rotation
  - Rate limit: 5 login attempts per minute per IP
  - Account lockout after 10 failed attempts

TASK 1.3: RBAC module
─────────────────────
Endpoints:
  GET    /api/v1/roles                  # List roles for org
  POST   /api/v1/roles                  # Create custom role
  PATCH  /api/v1/roles/:id              # Update role
  DELETE /api/v1/roles/:id              # Delete custom role (system roles protected)
  GET    /api/v1/roles/:id/permissions  # Get role's permissions
  PUT    /api/v1/roles/:id/permissions  # Set role's permissions (bulk)
  GET    /api/v1/permissions            # List all available permissions
  GET    /api/v1/permissions/matrix     # Full access matrix for UI

Guards:
  - @UseGuards(JwtAuthGuard, RolesGuard)
  - @RequirePermissions('employees.create', 'employees.update')
  - PermissionsGuard checks user's roles → aggregated permissions

Seed data:
  - 6 system roles: Super Admin, Org Admin, HR Admin, HR Executive, Manager, Employee
  - ~50 permissions across 12 modules (view, create, edit, delete, approve per module)

TASK 1.4: Organization module
─────────────────────────────
Endpoints:
  GET    /api/v1/organization               # Get current org profile
  PATCH  /api/v1/organization               # Update org profile
  CRUD   /api/v1/organization/entities      # Legal entities
  CRUD   /api/v1/organization/locations     # Locations & branches
  CRUD   /api/v1/organization/departments   # Department tree
  CRUD   /api/v1/organization/policies      # HR policy documents (upload to S3)
  GET    /api/v1/organization/setup-progress # Onboarding completion %

TASK 1.5: Audit logging
────────────────────────
- AuditService: automatically logs all CUD operations
- Decorator: @Auditable('entity_name') on controllers
- Interceptor captures before/after state diff
- Stored in audit_logs table with JSONB changes column
- GET /api/v1/audit-logs with filters (entity, user, date range)
```

**Tests for Phase 1:**
- Unit: Auth service (hash, token generation, validation)
- Unit: RBAC guard (permission checks)
- Integration: Full auth flow (register → login → access → refresh → logout)
- Integration: Role assignment and permission enforcement
- Integration: Org CRUD with audit log verification

---

### Phase 2 — Employee Management
**Estimated effort: 2 sessions**

```
TASK 2.1: Prisma schema — Employee entities
────────────────────────────────────────────
Tables:
  - Employee (
      id, org_id, employee_id [auto-gen], user_id [nullable],
      first_name, last_name, email, phone, date_of_birth, gender,
      designation, department_id, location_id, reporting_manager_id,
      date_of_joining, date_of_exit,
      employment_type [full_time|part_time|contract|intern],
      status [active|on_notice|on_leave|inactive|exited],
      personal_details JSONB, bank_details JSONB (encrypted),
      emergency_contacts JSONB,
      profile_image_url, created_at, updated_at
    )
  - EmployeeDocument (id, employee_id, type, name, file_url, expiry_date, verified, uploaded_by)
  - OnboardingChecklist (id, org_id, name, department_id, items JSONB)
  - OnboardingTask (id, employee_id, checklist_item, status, assigned_to, due_date, completed_at)
  - OffboardingTask (id, employee_id, task_type, status, assigned_to, due_date, completed_at)
  - EmployeeTransfer (id, employee_id, type [transfer|promotion], from_*, to_*, effective_date, status)

Key constraints:
  - Employee.employee_id: auto-generated per org (ORG_PREFIX + sequence)
  - Employee.email: unique per org
  - Employee.reporting_manager_id: self-referencing FK
  - Bank details: encrypted at rest (AES-256-GCM via application-level encryption)

TASK 2.2: Employee CRUD + directory
────────────────────────────────────
Endpoints:
  GET    /api/v1/employees                    # Paginated, filterable, searchable
  GET    /api/v1/employees/:id                # Full profile
  POST   /api/v1/employees                    # Create employee
  PATCH  /api/v1/employees/:id                # Update employee
  DELETE /api/v1/employees/:id                # Soft delete
  GET    /api/v1/employees/:id/org-chart      # Reporting hierarchy
  POST   /api/v1/employees/:id/documents      # Upload document
  GET    /api/v1/employees/:id/documents      # List documents
  POST   /api/v1/employees/import             # Bulk import via CSV/Excel
  GET    /api/v1/employees/export             # Export to CSV/Excel

Filters: department, location, status, employment_type, designation, manager
Search: first_name, last_name, email, employee_id (full-text)
Sort: name, date_of_joining, department

TASK 2.3: Onboarding pipeline
──────────────────────────────
Endpoints:
  GET    /api/v1/onboarding/pipeline          # All new joiners with status
  POST   /api/v1/onboarding/checklists        # Create checklist template
  GET    /api/v1/onboarding/:employee_id/tasks
  PATCH  /api/v1/onboarding/tasks/:id         # Complete/update task

Auto-triggers on employee creation with status = 'active' and DOJ within 30 days.

TASK 2.4: Offboarding
──────────────────────
Endpoints:
  POST   /api/v1/offboarding/:employee_id/initiate  # Start exit process
  GET    /api/v1/offboarding/active                   # All active exits
  PATCH  /api/v1/offboarding/tasks/:id                # Complete task

Auto-generates tasks: IT asset return, knowledge transfer, exit interview, final settlement.
```

**Tests for Phase 2:**
- Unit: Employee ID auto-generation logic
- Unit: Bank details encryption/decryption
- Integration: CRUD with RBAC enforcement (HR can create, employee can only view self)
- Integration: Onboarding pipeline auto-creation
- Integration: CSV import with validation errors

---

### Phase 3 — Attendance Management
**Estimated effort: 2 sessions**

```
TASK 3.1: Prisma schema — Attendance entities
──────────────────────────────────────────────
Tables:
  - Shift (id, org_id, name, start_time, end_time, work_hours, break_duration, type, color)
  - Roster (id, org_id, employee_id, shift_id, date, status)
  - AttendanceRecord (
      id, org_id, employee_id, date, 
      check_in, check_out, check_in_method, check_out_method,
      status [present|late|half_day|absent],
      work_hours_minutes, overtime_minutes,
      location_id, is_remote, geo_location JSONB,
      source [biometric|web|mobile|face_recognition|manual],
      created_at
    )
  - RegularizationRequest (id, org_id, employee_id, date, original_record_id, 
      requested_check_in, requested_check_out, reason, status, approved_by, approved_at)
  - AttendanceRule (id, org_id, name, type, config JSONB, is_active)

Indexes:
  - AttendanceRecord: (org_id, employee_id, date) UNIQUE
  - AttendanceRecord: (org_id, date) for daily dashboard
  - Roster: (org_id, employee_id, date)

TASK 3.2: Attendance endpoints
──────────────────────────────
Endpoints:
  POST   /api/v1/attendance/check-in          # Mark check-in (with geo)
  POST   /api/v1/attendance/check-out         # Mark check-out
  GET    /api/v1/attendance/live              # Today's live attendance dashboard
  GET    /api/v1/attendance/history           # Employee attendance history
  GET    /api/v1/attendance/dashboard/stats   # Aggregated stats
  GET    /api/v1/attendance/reports           # Filterable reports

  CRUD   /api/v1/shifts                      # Shift management
  CRUD   /api/v1/rosters                     # Roster assignment (bulk)
  
  POST   /api/v1/attendance/regularization           # Submit request
  GET    /api/v1/attendance/regularization/pending    # Pending approvals
  PATCH  /api/v1/attendance/regularization/:id        # Approve/reject

  CRUD   /api/v1/attendance/rules            # Attendance rules

Business logic:
  - Late = check_in > shift_start + grace_period
  - Half day = work_hours < threshold
  - Overtime = work_hours > shift_hours
  - Auto-absent marking via daily cron job at EOD
  - Redis cache for live attendance dashboard
```

**Tests for Phase 3:**
- Unit: Late/absent/overtime calculation logic
- Unit: Regularization approval workflow
- Integration: Check-in/out flow with geo validation
- Integration: Dashboard stats aggregation accuracy
- Integration: Auto-absent cron job

---

### Phase 4 — Leave Management
**Estimated effort: 2 sessions**

```
TASK 4.1: Prisma schema — Leave entities
─────────────────────────────────────────
Tables:
  - LeaveType (id, org_id, name, code, color, paid, max_days, carry_forward_max, 
      encashable, pro_rata, applicable_from_months, gender_restriction, description)
  - LeavePolicy (id, org_id, name, leave_types JSONB, applicable_departments, 
      applicable_employment_types, accrual_frequency, year_start_month)
  - LeaveBalance (id, org_id, employee_id, leave_type_id, year, 
      total, used, balance, carry_forwarded, pending)
  - LeaveApplication (id, org_id, employee_id, leave_type_id,
      from_date, to_date, days, half_day_type,
      reason, status [pending|approved|rejected|cancelled],
      applied_on, approver_id, approver_comments, approved_at,
      attachment_url, cancellation_reason)
  - LeaveEncashment (id, employee_id, leave_type_id, days, amount, status, processed_in_payroll_id)

TASK 4.2: Leave endpoints
─────────────────────────
Endpoints:
  CRUD   /api/v1/leave/types                  # Leave type management
  CRUD   /api/v1/leave/policies               # Leave policy management
  
  POST   /api/v1/leave/apply                  # Apply for leave
  GET    /api/v1/leave/applications            # My leave applications
  PATCH  /api/v1/leave/applications/:id/cancel # Cancel application
  
  GET    /api/v1/leave/approvals               # Pending approvals (for managers)
  PATCH  /api/v1/leave/approvals/:id           # Approve/reject
  
  GET    /api/v1/leave/balances                # My balances
  GET    /api/v1/leave/balances/team           # Team balances (for managers)
  
  GET    /api/v1/leave/calendar                # Team leave calendar
  GET    /api/v1/leave/dashboard/stats         # Leave dashboard stats
  GET    /api/v1/leave/reports                 # Leave reports

Business logic:
  - Balance validation before approval
  - Overlap detection (employee can't apply for already-applied dates)
  - Holiday & weekend exclusion from day count
  - Half-day support (first half / second half)
  - Auto-accrual via monthly cron (pro-rata for mid-year joiners)
  - Year-end carry-forward processing
  - Manager notification on apply, employee notification on approve/reject
```

**Tests for Phase 4:**
- Unit: Day count calculation (excluding weekends + holidays)
- Unit: Balance validation (insufficient balance, overlap detection)
- Unit: Accrual calculation (pro-rata)
- Integration: Full apply → approve → balance-deduction flow
- Integration: Leave calendar aggregation

---

### Phase 5 — Payroll & Salary
**Estimated effort: 3 sessions** ⚠️ *Most complex module*

```
TASK 5.1: Prisma schema — Payroll entities
───────────────────────────────────────────
Tables:
  - SalaryTemplate (id, org_id, name, ctc, components JSONB, status)
  - EmployeeSalary (id, employee_id, template_id, ctc, components JSONB, effective_from)
  - PayrollRun (id, org_id, month, year, status [draft|processing|computed|approved|paid|failed],
      total_gross, total_deductions, total_net, total_employees, 
      processed_by, approved_by, processed_at, approved_at)
  - PaySlip (id, payroll_run_id, employee_id, 
      earnings JSONB, deductions JSONB, 
      gross, total_deductions, net_pay, 
      days_worked, days_absent, loss_of_pay,
      pdf_url, status)
  - Reimbursement (id, org_id, employee_id, type, amount, description, 
      receipt_url, status, approved_by, processed_in_payroll_id)
  - Loan (id, org_id, employee_id, type, amount, emi, tenure_months, 
      disbursed_amount, outstanding, status, disbursed_at)
  - LoanRepayment (id, loan_id, payroll_run_id, amount, date)
  - StatutoryConfig (id, org_id, type [pf|esi|pt|tds], config JSONB, effective_from)

⚠️ India statutory specifics:
  - PF: 12% employer + 12% employee on basic (up to 15K ceiling)
  - ESI: 3.25% employer + 0.75% employee (if gross ≤ 21K)
  - PT: State-wise slabs (Maharashtra, Karnataka, etc.)
  - TDS: Based on regime (old/new), Section 80C/80D deductions

TASK 5.2: Payroll endpoints
───────────────────────────
Endpoints:
  CRUD   /api/v1/payroll/templates            # Salary structure templates
  GET    /api/v1/payroll/employees/:id/salary  # Employee salary details
  PUT    /api/v1/payroll/employees/:id/salary  # Assign/update salary

  POST   /api/v1/payroll/runs                 # Initiate payroll run
  GET    /api/v1/payroll/runs                 # List runs
  GET    /api/v1/payroll/runs/:id             # Run details with payslips
  POST   /api/v1/payroll/runs/:id/compute     # Compute payroll (async job)
  POST   /api/v1/payroll/runs/:id/approve     # Approve computed payroll
  POST   /api/v1/payroll/runs/:id/pay         # Mark as paid

  GET    /api/v1/payroll/payslips             # My payslips
  GET    /api/v1/payroll/payslips/:id/pdf     # Download payslip PDF

  CRUD   /api/v1/payroll/reimbursements       # Reimbursement claims
  CRUD   /api/v1/payroll/loans                # Loan management
  GET    /api/v1/payroll/statutory-config      # Statutory settings
  PUT    /api/v1/payroll/statutory-config      # Update statutory settings
  GET    /api/v1/payroll/reports               # Payroll reports

Payroll computation pipeline (BullMQ job):
  1. Fetch all active employees for the org
  2. For each employee: calculate earnings from salary components
  3. Apply attendance-based deductions (LOP)
  4. Apply reimbursements
  5. Apply loan EMI deductions
  6. Calculate statutory deductions (PF, ESI, PT, TDS)
  7. Generate payslip record
  8. Generate payslip PDF (async)
  9. Update payroll run totals
  10. Send notification to HR on completion

TASK 5.3: Payslip PDF generation
─────────────────────────────────
- Use @react-pdf/renderer or Puppeteer for PDF generation
- Template matching the PaySlips component design
- Store in S3, link in PaySlip record
- Bulk generation as BullMQ job (can take minutes for large orgs)
```

**Tests for Phase 5:**
- Unit: Salary computation (each component)
- Unit: PF, ESI, PT, TDS calculation with edge cases
- Unit: LOP calculation from attendance
- Integration: Full payroll run lifecycle (create → compute → approve → pay)
- Integration: Payslip PDF generation and download
- Load test: Payroll computation for 1000 employees

---

### Phase 6 — Recruitment (ATS)
**Estimated effort: 2 sessions**

```
TASK 6.1: Prisma schema — Recruitment entities
───────────────────────────────────────────────
Tables:
  - JobRequisition (id, org_id, title, department_id, location_id, 
      employment_type, experience_range, salary_range JSONB,
      description, requirements, openings, status [draft|open|on_hold|closed],
      hiring_manager_id, recruiter_id, closing_date, created_at)
  - Candidate (id, org_id, first_name, last_name, email, phone,
      resume_url, linkedin, github, portfolio,
      current_company, current_designation, experience_years,
      expected_ctc, notice_period, skills JSONB, source, tags JSONB)
  - Application (id, job_id, candidate_id, stage [applied|screening|interview|offer|hired|rejected],
      applied_at, source, rating, notes, rejected_reason)
  - Interview (id, application_id, round, type [technical|hr|cultural|managerial],
      interviewer_id, scheduled_at, duration_minutes, 
      status [scheduled|completed|cancelled|no_show],
      feedback, rating, decision [advance|hold|reject])
  - Offer (id, application_id, designation, ctc, joining_date,
      offer_letter_url, status [draft|sent|accepted|rejected|expired],
      sent_at, responded_at, expiry_date)

TASK 6.2: Recruitment endpoints
───────────────────────────────
Endpoints:
  CRUD   /api/v1/recruitment/jobs             # Job requisitions
  POST   /api/v1/recruitment/jobs/:id/publish # Publish job
  
  CRUD   /api/v1/recruitment/candidates       # Candidate pool
  POST   /api/v1/recruitment/candidates/import # Bulk import
  
  POST   /api/v1/recruitment/applications     # Apply candidate to job
  PATCH  /api/v1/recruitment/applications/:id/stage  # Move through pipeline
  
  CRUD   /api/v1/recruitment/interviews       # Schedule/manage interviews
  POST   /api/v1/recruitment/interviews/:id/feedback # Submit feedback
  
  CRUD   /api/v1/recruitment/offers           # Offer management
  POST   /api/v1/recruitment/offers/:id/send  # Send offer
  
  GET    /api/v1/recruitment/analytics        # Hiring funnel metrics
```

---

### Phase 7 — Meetings, Grievance, Reports
**Estimated effort: 2 sessions**

```
TASK 7.1: Meetings & Calendar
──────────────────────────────
Tables: Meeting, MeetingRoom, MeetingParticipant, RecurrenceRule
Endpoints:
  CRUD   /api/v1/meetings
  GET    /api/v1/meetings/my                  # My meetings
  GET    /api/v1/meetings/calendar            # Calendar view
  CRUD   /api/v1/meetings/rooms
  POST   /api/v1/meetings/:id/reschedule
  POST   /api/v1/meetings/:id/cancel
  GET    /api/v1/meetings/analytics

TASK 7.2: Grievance & Compliance
─────────────────────────────────
Tables: Grievance, Investigation, WhistleblowerReport, ComplianceItem, IncidentReport
Endpoints:
  CRUD   /api/v1/grievances
  PATCH  /api/v1/grievances/:id/assign
  PATCH  /api/v1/grievances/:id/escalate
  
  POST   /api/v1/whistleblower/report        # Anonymous submission
  GET    /api/v1/whistleblower/reports        # Admin view
  
  CRUD   /api/v1/compliance/items
  CRUD   /api/v1/compliance/incidents
  GET    /api/v1/compliance/reports

TASK 7.3: Reports & Analytics
──────────────────────────────
Tables: ReportDefinition, ScheduledReport, ExportJob
Endpoints:
  GET    /api/v1/reports/headcount            # Headcount analytics
  GET    /api/v1/reports/attrition            # Attrition metrics
  GET    /api/v1/reports/attendance-summary   # Attendance aggregates
  GET    /api/v1/reports/leave-summary        # Leave utilization
  GET    /api/v1/reports/payroll-summary      # Payroll cost analytics
  GET    /api/v1/reports/recruitment-funnel   # Hiring metrics
  POST   /api/v1/reports/export              # Async export (CSV/Excel/PDF)
  GET    /api/v1/reports/export/:id/download  # Download exported file

TASK 7.4: Settings
──────────────────
Tables: SystemSetting, NotificationPreference, Integration
Endpoints:
  GET    /api/v1/settings                     # All settings
  PATCH  /api/v1/settings/:key               # Update setting
  GET    /api/v1/settings/notifications       # Notification prefs
  PUT    /api/v1/settings/notifications       # Update prefs
  GET    /api/v1/settings/integrations        # Connected integrations
```

---

### Phase 8 — AI HR Assistant
**Estimated effort: 2 sessions**

```
TASK 8.1: AI infrastructure
────────────────────────────
Tables: ChatSession, ChatMessage, KBDocument, KBChunk, WorkflowTemplate
- KBDocument: uploaded policy docs, employee handbook, etc.
- KBChunk: chunked + embedded for RAG (pgvector extension)
- Vector similarity search for policy QA

TASK 8.2: AI endpoints
──────────────────────
Endpoints:
  POST   /api/v1/ai/chat                     # Send message, get AI response
  GET    /api/v1/ai/chat/sessions             # List chat sessions
  GET    /api/v1/ai/chat/sessions/:id         # Chat history
  
  POST   /api/v1/ai/documents/analyze        # Upload + analyze document
  GET    /api/v1/ai/documents                 # Knowledge base documents
  POST   /api/v1/ai/documents                 # Add to knowledge base
  DELETE /api/v1/ai/documents/:id             # Remove from KB
  
  POST   /api/v1/ai/policy-qa                # Ask policy question (RAG)
  GET    /api/v1/ai/insights                  # Generated HR insights
  POST   /api/v1/ai/insights/generate         # Trigger insight generation
  
  GET    /api/v1/ai/workflows                # Workflow templates
  POST   /api/v1/ai/workflows/:id/execute    # Execute workflow

Implementation:
  - Claude API integration via @anthropic-ai/sdk
  - RAG pipeline: chunk docs → embed → store in pgvector → query → augment prompt
  - Streaming responses via SSE for chat
  - System prompts scoped to HR domain with org context
  - Rate limiting per user (10 messages/min)
  - Token usage tracking and cost monitoring
```

---

### Phase 9 — Frontend Integration
**Estimated effort: 3 sessions**

```
TASK 9.1: API client layer
──────────────────────────
- Create /src/lib/api-client.ts (axios instance with interceptors)
- Auth token management (auto-refresh on 401)
- Request/response types matching backend DTOs
- Error handling with toast notifications

TASK 9.2: State management
──────────────────────────
- React Query (TanStack Query) for server state
- Custom hooks per module: useEmployees(), useLeaveBalance(), etc.
- Optimistic updates for mutations
- Cache invalidation strategy

TASK 9.3: Replace mock data module by module
─────────────────────────────────────────────
Priority order (matches user flow):
  1. Auth (login/register screens — currently missing, need to build)
  2. Organization setup (first-time setup flow)
  3. Employee directory + profiles
  4. Attendance (live dashboard → historical)
  5. Leave management
  6. Payroll
  7. Recruitment
  8. Meetings
  9. Grievance
  10. AI Assistant
  11. Reports
  12. Settings

Each module integration:
  - Remove mock data constants
  - Replace useState with useQuery/useMutation hooks
  - Add loading states (skeleton UI already exists in shadcn)
  - Add error states
  - Add empty states
  - Connect form submissions to API mutations
```

---

### Phase 10 — Production Hardening
**Estimated effort: 2 sessions**

```
TASK 10.1: Security
───────────────────
- Helmet.js for security headers
- CORS configuration (whitelist frontend origins)
- Rate limiting (express-rate-limit + Redis store)
- Input sanitization (xss-clean)
- SQL injection prevention (Prisma parameterized queries — built-in)
- CSRF protection for cookie-based auth
- Secrets in environment variables (never committed)
- Encrypt sensitive fields (bank details, PAN, Aadhaar) at application level
- API key rotation strategy for Claude API

TASK 10.2: Performance
──────────────────────
- Redis caching: attendance dashboard, employee count, leave balances
- Database query optimization: analyze slow queries, add missing indexes
- Connection pooling: PgBouncer or Prisma built-in
- Payload compression (gzip)
- Pagination on all list endpoints (cursor-based for large datasets)
- Lazy loading for reports (async generation)
- CDN for static assets (profile images, documents)

TASK 10.3: Observability
────────────────────────
- Structured logging (Pino) with correlation IDs
- Prometheus metrics: request rate, latency p50/p95/p99, error rate, DB pool usage
- Health check endpoints (liveness + readiness)
- BullMQ dashboard (bull-board) for queue monitoring
- Error tracking (Sentry integration)
- Uptime monitoring on critical endpoints

TASK 10.4: Deployment
─────────────────────
- Dockerfile (multi-stage build)
- Docker Compose for local dev (app + postgres + redis + minio)
- CI/CD pipeline (GitHub Actions):
  - Lint → Type check → Unit tests → Integration tests → Build → Deploy
- Database migrations in CI (prisma migrate deploy)
- Environment-specific configs (dev, staging, production)
- Zero-downtime deployment strategy
- Backup strategy: daily DB snapshots, S3 versioning for files

TASK 10.5: Documentation
────────────────────────
- API documentation via Swagger (auto-generated)
- README.md with setup instructions
- CONTRIBUTING.md with development workflow
- Architecture Decision Records (ADR) for key decisions
- Runbook for common operations (payroll rerun, data fixes)
```

---

## 4. Database ER Diagram (Key Relationships)

```
Organization ──┬── LegalEntity ──── Location
               ├── Department (tree)
               ├── Role ──── Permission (M:N)
               └── User ──── Employee
                              ├── AttendanceRecord
                              ├── LeaveApplication ── LeaveBalance
                              ├── EmployeeSalary ──── PaySlip
                              ├── OnboardingTask
                              ├── Grievance
                              ├── Meeting (M:N via Participant)
                              └── ChatSession ── ChatMessage

PayrollRun ──── PaySlip (1:N)
JobRequisition ── Application ── Candidate
                      └── Interview
                      └── Offer
```

---

## 5. Claude Code Execution Strategy

### Session-by-Session Breakdown

Each "session" below is a single Claude Code interaction. Keep sessions focused to avoid context overflow.

| Session | Phase | Deliverable | Depends On |
|---------|-------|-------------|------------|
| **S1** | 0 | Scaffolding: NestJS project + Docker + infra modules | — |
| **S2** | 1a | Prisma schema (auth + org) + Auth module | S1 |
| **S3** | 1b | RBAC module + Org module + Audit logging | S2 |
| **S4** | 2a | Employee schema + CRUD + Directory | S3 |
| **S5** | 2b | Onboarding + Offboarding + Document management | S4 |
| **S6** | 3 | Attendance: schema + check-in/out + dashboard + shifts | S4 |
| **S7** | 4 | Leave: schema + apply/approve + balances + calendar | S4 |
| **S8** | 5a | Payroll: schema + salary templates + payroll run engine | S4, S6, S7 |
| **S9** | 5b | Payroll: statutory, payslip PDF, reimbursements, loans | S8 |
| **S10** | 6 | Recruitment: ATS pipeline | S4 |
| **S11** | 7a | Meetings + Grievance modules | S4 |
| **S12** | 7b | Reports engine + Settings | All above |
| **S13** | 8 | AI Assistant: chat, RAG, insights | S4 |
| **S14** | 9a | Frontend: API client + auth + org + employee integration | S3, S4 |
| **S15** | 9b | Frontend: attendance + leave + payroll integration | S6, S7, S8 |
| **S16** | 9c | Frontend: recruitment + meetings + grievance + AI + reports | S10-S13 |
| **S17** | 10 | Production hardening + deployment | All above |

### Prompt Template for Each Session

Use this template when starting each Claude Code session:

```markdown
## Context
I'm building the backend for AI_HR, a full-featured HRMS.
- Read Plan.md for full architecture context.
- Tech: NestJS + Prisma + PostgreSQL + Redis + BullMQ
- Current phase: [PHASE NUMBER]
- Previous sessions completed: [LIST]

## Task
[SPECIFIC TASK FROM PLAN]

## Constraints
- Follow NestJS module pattern (controller → service → repository)
- Use Prisma for all DB operations
- All endpoints need: validation DTOs, Swagger decorators, auth guards
- Use response envelope: { success, data, error, meta }
- Include error handling for all edge cases
- Add unit test stubs for services
- Follow existing code patterns from previous sessions

## Files to reference
[LIST RELEVANT EXISTING FILES]
```

---

## 6. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payroll calculation errors | **Critical** — financial liability | Extensive unit tests, dual-computation verification, approval workflow before payment |
| Data breach (PII: Aadhaar, PAN, bank) | **Critical** — legal compliance | Application-level encryption, RLS, audit logging, access controls |
| AI hallucinations in policy QA | **High** — wrong HR advice to employees | RAG grounding with cited sources, disclaimer in UI, human review flag |
| Session context overflow in Claude Code | **Medium** — incomplete implementations | Focused sessions (see S1-S17), Plan.md as persistent context |
| Payroll run timeout for large orgs | **Medium** — delayed salary processing | BullMQ async processing, chunked computation, progress tracking |
| Multi-timezone attendance bugs | **Medium** — incorrect records | Store all times in UTC, convert at API boundary, use employee's location timezone |
| Leave balance race conditions | **Medium** — over-approval | Optimistic locking on balance rows, validation in transaction |

---

## 7. Tech Debt to Track

- [ ] **Search:** PostgreSQL full-text → Elasticsearch migration when >10K employees
- [ ] **Caching:** Manual invalidation → event-driven cache invalidation
- [ ] **File storage:** Direct S3 URLs → signed URLs with expiry
- [ ] **Notifications:** In-app only → email + push + Slack integration
- [ ] **Audit logs:** Single table → partitioned by month for query performance
- [ ] **AI embeddings:** pgvector → dedicated vector DB (Pinecone/Weaviate) at scale
- [ ] **Multi-tenancy:** Row-level → schema-level isolation if enterprise customers need it
- [ ] **API versioning:** v1 prefix in place, but no actual versioning strategy yet

---

## 8. Definition of Done (per module)

- [ ] All CRUD endpoints functional with proper DTOs
- [ ] Auth guards and permission checks enforced
- [ ] Input validation on all endpoints
- [ ] Swagger documentation complete
- [ ] Unit tests for business logic (>80% coverage on services)
- [ ] Integration tests for critical flows
- [ ] Audit logging for all mutations
- [ ] Error handling with meaningful messages
- [ ] Response follows standard envelope format
- [ ] No N+1 queries (verify with Prisma query logging)
- [ ] Frontend mock data replaced with API calls
