# Claude Code — Session 1 Kickoff Prompt

Copy-paste the prompt below into Claude Code. After Session 1 is done, use the follow-up prompts for subsequent sessions.

---

## SESSION 1 PROMPT (Scaffolding + Infrastructure)

```
Read the file Plan.md in this repo thoroughly — it's the complete architecture and execution plan for an HRMS backend.

You are starting Session S1 (Phase 0 — Project Scaffolding & Infrastructure).

## What to build

1. Initialize a NestJS project in a folder called `ai-hr-backend/` with:
   - TypeScript strict mode
   - pnpm as package manager
   - Path aliases (@common/*, @modules/*, @config/*, etc.)

2. Create the folder structure exactly as defined in Section 3.1 of Plan.md.

3. Set up Docker Compose with:
   - PostgreSQL 16 (port 5432, db: ai_hr_dev, user: postgres, password: postgres)
   - Redis 7 (port 6379)
   - MinIO (ports 9000/9001, root user: minioadmin/minioadmin)
   - A volume for each service so data persists

4. Install and configure these core dependencies:
   - Prisma 5 (init with postgresql datasource)
   - @nestjs/config with Joi validation
   - ioredis for cache
   - bullmq for job queues
   - pino + nestjs-pino for structured logging
   - @nestjs/swagger for OpenAPI docs
   - class-validator + class-transformer
   - helmet, compression, express-rate-limit
   - @nestjs/terminus for health checks
   - uuid

5. Build these infrastructure modules (with actual working code, not stubs):
   - **ConfigModule**: .env-based config with Joi schema validation. Create .env.example with all keys.
   - **DatabaseModule**: Prisma service with onModuleInit connect, onModuleDestroy disconnect, and enableShutdownHooks.
   - **CacheModule**: Redis service wrapping ioredis with get/set/del/flush methods and TTL support.
   - **QueueModule**: BullMQ connection config, reusable across modules.
   - **HealthModule**: /health endpoint checking DB and Redis connectivity.
   - **StorageModule**: S3-compatible file service (upload, download, getSignedUrl, delete) using @aws-sdk/client-s3 pointed at MinIO for local dev.

6. Build these global cross-cutting concerns:
   - **RequestIdMiddleware**: Attaches UUID to every request, sets X-Request-Id header.
   - **LoggingInterceptor**: Logs method, url, status, duration on every request.
   - **TransformInterceptor**: Wraps all responses in { success: true, data: <response>, meta: { requestId, timestamp } }.
   - **HttpExceptionFilter**: Catches all exceptions, returns { success: false, error: { code, message, details }, meta: { requestId, timestamp } }.
   - **TimeoutInterceptor**: 30s default timeout.
   - **ValidationPipe**: Global, with whitelist and transform enabled.

7. Wire everything in app.module.ts and main.ts:
   - Global prefix: /api/v1
   - Swagger at /api/docs (disabled in production)
   - CORS enabled for http://localhost:5173 (Vite default)
   - Helmet, compression enabled
   - Global validation pipe, exception filter, interceptors

8. Create a simple smoke-test endpoint:
   - GET /api/v1/health → returns DB and Redis status
   - GET /api/v1 → returns { name: "AI HR API", version: "1.0.0" }

9. Add scripts to package.json:
   - dev, build, start:prod, lint, test, test:e2e
   - db:generate, db:migrate, db:push, db:seed, db:studio
   - docker:up, docker:down

10. Create a README.md with:
    - Prerequisites (Node 20, pnpm, Docker)
    - Quick start steps (clone → docker:up → db:push → dev)
    - Available scripts
    - Environment variables reference

## Constraints
- Every file must have actual working code, not TODO comments.
- Use NestJS best practices: modules, providers, dependency injection.
- Type everything — no `any` types.
- All config values come from environment variables, never hardcoded.
- The app must start successfully with `pnpm dev` after `docker compose up -d`.
```

---

## SESSION 2 PROMPT (Auth + Org Schema)

```
Read Plan.md for full context. You are on Session S2 (Phase 1a — Prisma Schema + Auth Module).

Session S1 is complete — the NestJS scaffold, Docker, Prisma, Redis, and infrastructure modules are all working.

## What to build

### Part 1: Prisma Schema
Create the complete Prisma schema for auth and organization entities as defined in Plan.md TASK 1.1:
- Organization, User, RefreshToken
- Role, Permission, RolePermission, UserRole
- LegalEntity, Location, Department
- AuditLog

Include all indexes, unique constraints, relations, enums, and JSONB fields. Add sensible defaults and timestamps (created_at, updated_at) on every table. Use @map for snake_case table/column names.

Run `prisma migrate dev --name init` to create the migration.

### Part 2: Auth Module
Build the complete auth module as defined in TASK 1.2:
- AuthController with all 7 endpoints (register, login, refresh, logout, forgot-password, reset-password, me)
- AuthService with full business logic
- JwtStrategy and JwtAuthGuard
- RefreshTokenService (hashed storage, single-use rotation)
- DTOs with class-validator decorators and Swagger decorators
- Use Argon2id for password hashing
- JWT access token: 15min TTL, payload: { sub: userId, orgId, roles: string[] }
- Refresh token: 7-day TTL, stored as argon2 hash
- Rate limiting on login: 5/min per IP

### Part 3: Seed Script
Create prisma/seed.ts that:
- Creates a default organization "TechCorp Global"
- Creates 6 system roles with permissions (Super Admin, Org Admin, HR Admin, HR Executive, Manager, Employee)
- Creates ~50 permissions across all 12 modules (module.action format)
- Creates a super admin user (admin@techcorp.com / Admin@123)
- Assigns Super Admin role to the admin user

Wire the seed command in package.json.

## Constraints
- Registration creates both an Organization AND the first admin User in a transaction.
- All auth endpoints must have Swagger decorators with proper response types.
- Passwords must be validated: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special.
- Login returns both accessToken and refreshToken.
- The /me endpoint requires JWT auth and returns user + roles + permissions.
- Write unit tests for AuthService (password hashing, token generation, validation).
```

---

## SESSION 3 PROMPT (RBAC + Organization + Audit)

```
Read Plan.md for full context. Session S3 (Phase 1b — RBAC + Organization + Audit).

S1-S2 are done: scaffold, Prisma schema, auth module with JWT, seed data — all working.

## What to build

### 1. RBAC Module (TASK 1.3)
- RolesController: full CRUD for roles + permission assignment
- PermissionsController: list permissions, get access matrix
- RolesGuard: checks user's roles against @Roles() decorator
- PermissionsGuard: checks aggregated permissions against @RequirePermissions() decorator
- Custom decorators: @Roles(), @RequirePermissions(), @CurrentUser()
- System roles (seeded) cannot be deleted or renamed
- Access matrix endpoint returns the full role×permission grid for the frontend RolesAccess component

### 2. Organization Module (TASK 1.4)
- OrganizationController: get/update org profile
- LegalEntitiesController: full CRUD
- LocationsController: full CRUD with legal_entity relation
- DepartmentsController: full CRUD with parent-child tree support (return as nested tree)
- PoliciesController: CRUD + file upload to S3 for policy documents
- SetupProgressService: calculates onboarding completion % (has org profile? has departments? has locations? etc.)

### 3. Audit Logging (TASK 1.5)
- AuditService with log() method: captures entity_type, entity_id, action, before/after diff (JSONB)
- AuditInterceptor: auto-captures mutations (POST/PATCH/PUT/DELETE)
- @Auditable('entity_name') decorator for controllers
- AuditLogController: GET /audit-logs with filters (entity_type, user_id, date range, paginated)

### 4. Wire guards globally
- JwtAuthGuard as global guard (with @Public() decorator to skip for login/register)
- Apply PermissionsGuard on all org/rbac endpoints

## Constraints
- Department tree: support unlimited nesting, return flat list with parent_id AND a nested tree structure endpoint
- Policy upload: validate file type (pdf, doc, docx only), max 10MB
- Audit log: must capture the requesting user's IP address
- All endpoints: paginated responses with { data, meta: { total, page, pageSize, totalPages } }
- Write integration tests for: role CRUD with guard enforcement, org update with audit log creation
```

---

## SESSIONS 4–17: PROMPT PATTERN

For all remaining sessions, follow this pattern:

```
Read Plan.md for full context. You are on Session S[N] (Phase [X] — [NAME]).

Previous sessions completed: S1 through S[N-1] — [brief summary of what's working].

## What to build
[Copy the relevant TASK blocks from Plan.md for this session]

## Existing code to reference
- Check prisma/schema.prisma for current schema
- Check src/modules/ for existing module patterns
- Check src/common/ for shared DTOs, guards, interceptors

## Constraints
- Follow the exact same patterns used in previous modules (controller → service → DTOs → tests)
- All endpoints need: auth guard, permission guard, validation, Swagger docs, audit logging
- Reuse common DTOs (PaginationDto, SortDto) from src/common/dto/
- Add relations to existing Prisma models where needed (add migration)
- Write unit tests for service-layer business logic
- Write at least 1 integration test for the critical happy path
```

---

## TIPS FOR BEST RESULTS WITH CLAUDE CODE

1. **One session = one phase.** Don't try to combine phases — context overflow kills quality.

2. **Always start with "Read Plan.md"** — this anchors Claude Code with full architecture context.

3. **If a session gets too long**, split it. Say: "Stop here. We'll continue the remaining tasks in the next session."

4. **After each session, verify:**
   ```bash
   pnpm build          # Must compile clean
   pnpm test           # Tests must pass
   docker compose up -d && pnpm dev  # Must start
   ```

5. **If Claude Code makes a mistake**, don't re-explain the whole plan. Just say:
   ```
   The [X] endpoint is returning [wrong thing]. 
   Expected behavior per Plan.md: [correct behavior]. 
   Fix it.
   ```

6. **For debugging**, give Claude Code the error:
   ```
   Running `pnpm dev` gives this error:
   [paste error]
   Fix it.
   ```

7. **Keep Plan.md in the repo root** — Claude Code can always re-read it for context.
