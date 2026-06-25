# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspace=apps/api

COPY apps/api/prisma ./apps/api/prisma
RUN npm run prisma:generate --workspace=apps/api

COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json apps/api/nest-cli.json ./apps/api/
RUN npm run build --workspace=apps/api

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspace=apps/api --omit=dev

# Copy Prisma CLI from builder (devDep, not in prod install)
COPY --from=builder /app/node_modules/prisma        ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma   ./node_modules/.bin/prisma

# Copy schema and generate engine for this exact Alpine runtime
COPY apps/api/prisma ./apps/api/prisma
RUN node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/main"]
