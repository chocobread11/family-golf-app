FROM oven/bun:1.1-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN bunx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["bun", "server.js"]