# TaskFlow API

NestJS backend for TaskFlow. See the [root README](../../README.md) for full architecture notes and setup instructions.

## Scripts

```bash
npm run start:dev          # watch mode
npm run build               # production build
npm run prisma:migrate      # run a new migration
npm run prisma:studio       # browse the database in Prisma Studio
npm run test                 # unit tests
```

## Project structure

```
src/
├── auth/             register, login, refresh, logout
├── organizations/     list/create organizations for the current user
├── projects/          boards, org-scoped
├── tasks/              cards within a board, org-scoped, broadcasts via WS
├── websockets/         Socket.io gateway, one room per organization
└── common/
    ├── guards/         JwtAuthGuard, TenantGuard, RolesGuard
    ├── decorators/      @CurrentUser(), @CurrentTenant(), @Roles()
    ├── prisma/          PrismaService (global module)
    └── types/           shared request/JWT type shapes
```

## Request lifecycle for a protected route

1. `JwtAuthGuard` verifies the bearer token, attaches `req.user`
2. `TenantGuard` reads `x-organization-id`, confirms a `Membership` exists, attaches `req.tenant`
3. `RolesGuard` (only on routes with `@Roles()`) checks `req.tenant.role` against the allowed list
4. The controller method runs, scoped entirely to `req.tenant.organizationId`
