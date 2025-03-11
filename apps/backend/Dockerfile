FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install specific pnpm version and dependencies
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Copy the rest of the application code
COPY . .

# Fix the prisma generate command - use relative path
RUN pnpx prisma generate --schema=./prisma/schema.prisma

# Build the application
RUN pnpm run build

# Copy Prisma schema to dist folder to ensure it's available at runtime
RUN mkdir -p dist/prisma && cp prisma/schema.prisma dist/prisma/

# Production image
FROM node:20-alpine

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Set proper permissions
RUN chown -R appuser:appgroup /app

# Use the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "dist/main.js"]