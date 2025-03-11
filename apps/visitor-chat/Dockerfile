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
RUN turbo prune visitor-chat --docker

# Install dependencies separately to optimize caching
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the application
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=visitor-chat...

# Production image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs

# Copy the built application
COPY --from=installer --chown=nextjs:nextjs /app/apps/visitor-chat/.next/standalone ./
COPY --from=installer --chown=nextjs:nextjs /app/apps/visitor-chat/.next/static ./apps/visitor-chat/.next/static
COPY --from=installer --chown=nextjs:nextjs /app/apps/visitor-chat/public ./apps/visitor-chat/public

# Start the server
CMD node apps/visitor-chat/server.js
