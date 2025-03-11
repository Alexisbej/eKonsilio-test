# Base image
FROM node:18-alpine AS base

# Install dependencies
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Turbo globally
RUN pnpm add -g turbo
COPY . .

# Prune the monorepo for only frontend dependencies
RUN turbo prune admin --docker

# Install dependencies separately to optimize caching
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the application
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=admin...

# Production image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs

# Copy the built application
COPY --from=installer --chown=nextjs:nextjs /app/apps/admin/.next/standalone ./
COPY --from=installer --chown=nextjs:nextjs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=installer --chown=nextjs:nextjs /app/apps/admin/public ./apps/admin/public

# Start the server
CMD node apps/admin/server.js
