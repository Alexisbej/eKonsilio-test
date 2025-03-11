# Base image
FROM node:18-alpine AS base

# Enable corepack and install PNPM globally
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install dependencies
FROM base AS builder
WORKDIR /app

# Install Turbo globally
RUN pnpm add -g turbo

# Copy necessary files for pruning
COPY . .
RUN turbo prune backend --docker

# Install dependencies separately
FROM base AS installer
WORKDIR /app

# Ensure PNPM is available in this stage too
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

COPY --from=builder /app/out/json/ .
RUN pnpm install --no-frozen-lockfile

# Build the backend
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=backend...

# Production image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
USER nestjs

# Copy only the built backend files
COPY --from=installer /app/apps/backend/dist ./dist

# Expose API port
EXPOSE 3001

# Start the server
CMD ["node", "dist/main.js"]
