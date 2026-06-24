# TaskFlow Web

Next.js (App Router) frontend for TaskFlow. See the [root README](../../README.md) for full architecture notes and setup instructions.

## Scripts

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start    # serve the production build
```

## Project structure

```
src/
├── app/
│   ├── login/, register/        auth pages
│   ├── orgs/                     pick or create a workspace
│   └── org/[orgId]/
│       ├── page.tsx               list of boards in this workspace
│       └── project/[projectId]/   the Kanban board
├── components/    TaskCard, BoardColumn
├── lib/            API clients (axios), the board WebSocket hook
├── store/          Zustand auth store
└── types/          shapes mirroring the API's DTOs
```

## How real-time sync works

`useBoardSocket` (in `lib/use-board-socket.ts`) opens a Socket.io connection scoped to the active organization. Incoming `task:created` / `task:updated` / `task:moved` / `task:deleted` events are merged directly into the React Query cache for `['tasks', projectId]` — there's no separate "real-time state," the same cache that powers the initial render is what the socket updates, so the UI doesn't care whether a change came from this tab, another tab, or a teammate.

Drag-and-drop writes optimistically to that same cache before the API call resolves, so the card moves instantly; the server response (and the socket broadcast that follows it) reconciles afterward.
