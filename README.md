# <img src="apps/web/public/logo-icon.svg" width="28" align="center" alt=""> TaskFlow

![TaskFlow](./screenshot.png)

A multi-tenant project management tool — a lightweight Trello-style Kanban board built to demonstrate
a production-grade SaaS architecture. Every organization runs in its own isolated workspace; drag a
card and every teammate's screen updates in real time.

Built as a portfolio project to showcase full-stack TypeScript, WebSocket-driven UI sync, and
layered security in a monorepo setup.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | NestJS 10 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh) · Passport |
| Real-time | Socket.io 4 |
| Frontend framework | Next.js 14 (App Router) |
| Data fetching | TanStack React Query |
| Client state | Zustand |
| Drag and drop | @dnd-kit |
| Styling | Tailwind CSS |
| Containerization | Docker · Docker Compose |
| CI | GitHub Actions |

---

## Features

- **Multi-tenant auth** — JWT access tokens (15 min) with rotating refresh tokens (30 days, hashed
  at rest). Presenting a refresh token immediately invalidates it and issues a fresh one; replaying a
  revoked token is treated as a theft signal.
- **Rich task detail** — each task has an editable description and an assignee picker that lists
  all org members with avatar preview. Changes to description, assignee, priority, due date, and
  labels are all saved in a single action from the task detail modal.
- **Task priority** — each task carries a priority level (`Low` / `Medium` / `High` / `Urgent`).
  Color-coded badges appear on cards (grey → sky → amber → coral); Medium is hidden to keep the
  board uncluttered. Priority is editable inline from the task detail modal.
- **Real-time Kanban board** — drag-and-drop task cards via `@dnd-kit`. Moves are broadcast
  instantly over Socket.io to every connected teammate in the same organization — and only that
  organization.
- **Column management** — add new columns, rename them inline (click the pencil icon on the
  column header), and delete them. Deleting a column atomically reassigns all its tasks to the
  first remaining column; deleting the last column is blocked. All column mutations require
  `OWNER` or `ADMIN` role.
- **Column reordering** — board columns are themselves drag-and-drop sortable. Positions are
  persisted atomically in a single database transaction; the new order is broadcast over WebSocket so
  every connected client updates without a page refresh.
- **Board filters** — filter tasks by assignee (including an "Unassigned" option), label, and
  priority. Filters are applied client-side from the React Query cache with no extra requests,
  compose with full-text search, and can be combined freely. A badge on the Filter button shows
  how many filters are active; a single "Clear filters" click resets all three dimensions.
- **Full-text task search** — a debounced search bar in the board header queries task titles and
  descriptions via a dedicated API endpoint, scoped to the active organization. Matches are
  highlighted inline on the cards.
- **Activity log** — every task creation, update, and move is recorded in an audit trail. An
  "Activity" panel slides in from the board header and shows the last 50 events with actor avatar,
  human-readable description (*"Sara moved Fix login bug → Done"*), and relative timestamp.
  The feed refreshes automatically every 15 seconds.
- **Task comments** — each task carries a live comment thread. Comments are posted and deleted
  instantly via optimistic React Query cache updates; only the author can delete their own comments.
- **Member management** — invite any existing account to your organization by email address. Members
  are listed with role badges (`OWNER` / `ADMIN` / `MEMBER`). `OWNER` and `ADMIN` can change member
  roles and remove members; privilege escalation is blocked server-side (ADMINs cannot assign the
  OWNER role or remove other ADMINs).
- **Labels** — create color-coded labels scoped to your organization and attach them to any task
  across all your projects.
- **Light / dark theme** — follows the system default with a manual toggle, persisted per user.
- **Docker support** — a single `docker compose up --build` starts Postgres, the API, and the web
  app; migrations run automatically on container start.

---

## Architecture

```
taskflow/
├── apps/
│   ├── api/       NestJS REST + WebSocket API
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── organizations/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── labels/
│   │   │   ├── common/guards/   ← TenantGuard · RolesGuard
│   │   │   └── websockets/
│   │   └── prisma/
│   └── web/       Next.js 14 frontend
│       └── src/
│           ├── app/
│           ├── components/
│           ├── lib/
│           └── store/
├── docker-compose.yml
└── package.json   (npm workspaces root)
```

### Tenant isolation

Every HTTP request passes through two guards before reaching a service method:

1. **`TenantGuard`** — extracts the `orgId` from the route, verifies the authenticated user holds an
   active membership in that organization, and injects the membership into the request context.
   A route that is missing the guard cannot accidentally expose another tenant's data.

2. **`RolesGuard`** — checks the membership's `Role` (`OWNER` / `ADMIN` / `MEMBER`) against the
   `@Roles()` decorator on the handler. Destructive operations (deleting projects, managing members)
   are restricted to `OWNER` and `ADMIN`.

Cross-tenant lookups return `404 Not Found` rather than `403 Forbidden` to avoid confirming that a
given resource ID exists at all.

WebSocket events are broadcast into per-organization Socket.io rooms, so real-time updates never
cross tenant boundaries.

---

## Setup

### With Docker

The fastest way to run the full stack.

**1. Configure secrets**

Create a `.env` file in the repo root:

```env
JWT_SECRET=change-this-to-a-long-random-string-in-production
WEB_ORIGIN=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**2. Build and start**

```bash
docker compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Web      | http://localhost:3001  |
| API      | http://localhost:4000  |
| Postgres | localhost:5432         |

Database migrations run automatically when the API container starts.

```bash
# Run in the background
docker compose up --build -d

# Follow API logs
docker compose logs -f api

# Stop everything
docker compose down

# Stop and wipe the database volume
docker compose down -v
```

---

### Local Development

**Prerequisites:** Node.js 20+, Docker (for Postgres)

**1. Install dependencies**

```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
npm install
```

**2. Start Postgres**

```bash
docker compose up -d postgres
```

**3. Configure environment variables**

```bash
cp apps/api/.env.example apps/api/.env
```

The defaults work for local dev. Set a strong `JWT_SECRET` before exposing the API publicly.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskflow?schema=public"
JWT_SECRET="change-this-to-a-long-random-string-in-production"
WEB_ORIGIN="http://localhost:3001"
PORT=4000
```

**4. Run migrations**

```bash
cd apps/api && npx prisma migrate dev
```

**5. Start both apps**

Run each in a separate terminal from the repo root:

```bash
npm run dev:api   # → http://localhost:4000
npm run dev:web   # → http://localhost:3001
```

Open `http://localhost:3001`, register an account (this also creates your first organization), and
start building boards.

---

## CI

GitHub Actions runs on every push and pull request to `main`.

| Job | Steps |
|-----|-------|
| **API** | lint → type-check → unit tests → build (against a real Postgres service container) |
| **Web** | lint → type-check → build |

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
