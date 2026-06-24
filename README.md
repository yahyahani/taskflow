# TaskFlow

A multi-tenant project management tool — think a lightweight Trello/Asana clone, built to demonstrate a production-style SaaS architecture rather than to compete with either.

Teams (organizations) get their own boards, projects, and tasks, fully isolated from every other team in the same database. Moving a card updates everyone's screen in real time, no refresh required.

## Why this project exists

This is a portfolio project. The goal wasn't to build the most features — it was to build a smaller set of features *correctly*: real auth (not a tutorial's `if (password === "admin")`), real tenant isolation that's actually enforced server-side, and real-time sync that's broadcast-scoped so one tenant's updates never leak into another's browser tab.

## Architecture

```
taskflow/
├── apps/
│   ├── api/          NestJS backend (REST + WebSocket)
│   └── web/           Next.js frontend (App Router)
├── docker-compose.yml  Local Postgres
└── package.json        npm workspaces root
```

**Backend — NestJS + Prisma + PostgreSQL**

- **Auth**: JWT access tokens (15 min) + rotating refresh tokens (30 days, hashed at rest, single-use). Passwords hashed with bcrypt.
- **Multi-tenancy**: shared database, shared schema. Every tenant-scoped table carries an `organizationId`. A `TenantGuard` reads the `x-organization-id` header, verifies the caller actually has a `Membership` row for that org, and attaches the verified tenant context to the request — every query downstream reads from that verified context, never from a client-supplied ID in the body.
- **Authorization**: a `RolesGuard` + `@Roles()` decorator restrict specific actions (e.g. deleting a project) to `OWNER`/`ADMIN`.
- **Real-time**: a Socket.io gateway puts each connected client into a room scoped to their active organization. Task moves, creates, updates, and deletes are broadcast only to that room.

**Frontend — Next.js (App Router) + React Query + Zustand**

- Drag-and-drop Kanban board (`@dnd-kit`) with optimistic updates
- React Query as the source of truth for server data; WebSocket events merge directly into its cache so the UI updates the same way whether a change came from this tab, another tab, or a teammate
- Zustand for session/auth state, persisted to `localStorage`

## Data model

```
User ──< Membership >── Organization
                            │
                            └──< Project ──< BoardColumn ──< Task >── User (assignee)
                                                                │
                                                                ├──< Comment
                                                                └──< Activity
```

A `Membership` is the join row between a user and an organization, carrying that user's role (`OWNER` / `ADMIN` / `MEMBER`) *for that organization* — the same person can be an owner of one workspace and a regular member of another.

## Getting started

### Prerequisites
- Node.js 20+
- Docker (for local Postgres) — or your own Postgres instance

### 1. Install dependencies
```bash
npm install
```

### 2. Start the database
```bash
docker compose up -d
```

### 3. Configure environment variables
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
Edit `apps/api/.env` and set a real `JWT_SECRET` (any long random string works for local dev).

### 4. Run the database migration
```bash
cd apps/api
npx prisma migrate dev --name init
```

### 5. Start both apps
From the repo root, in two terminals:
```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

Open `http://localhost:3000`, register an account (this also creates your first organization), and create a board.

## Notable implementation details

- **Tenant isolation has two layers**: the `TenantGuard` blocks requests without a verified membership, and every service method *also* re-checks that the resource being mutated belongs to the caller's organization before touching it. Belt and suspenders — a guard misconfiguration on one route shouldn't be enough to leak data.
- **Refresh tokens rotate on every use**: presenting a refresh token immediately revokes it and issues a new one. A revoked token being replayed is a signal worth treating as token theft in a production system.
- **404 over 403 for cross-tenant lookups**: requesting a resource that exists but belongs to another organization returns `404 Not Found`, not `403 Forbidden` — this avoids confirming to an attacker that a given ID exists at all.

## Possible next steps

- Project invitations (invite a teammate by email into an existing org)
- File attachments on tasks
- Tests (Jest for the API's guards/services, Playwright for the board's drag-and-drop flow)
- CI pipeline (GitHub Actions: lint, type-check, test on every PR)
- Deploy: API → Railway/Render, Web → Vercel

## Tech stack

| Layer | Choice |
|---|---|
| Backend framework | NestJS |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + Passport |
| Real-time | Socket.io |
| Frontend framework | Next.js (App Router) |
| Data fetching | React Query |
| Client state | Zustand |
| Drag and drop | @dnd-kit |
| Styling | Tailwind CSS |
