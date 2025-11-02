# Multi-stage build for Gaming Hub Server

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /build

# Copy root package files (needed for npm workspaces)
COPY package*.json ./

# Copy all workspace package.json files first (npm needs these before install)
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# Install all dependencies (this must happen before copying source code)
RUN npm ci

# Copy shared and server source code
COPY shared ./shared
COPY server ./server

# Build shared package first
WORKDIR /build/shared
RUN npm run build

# Build server
WORKDIR /build/server

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy root package files (needed for npm workspaces)
COPY package*.json ./

# Copy all workspace package.json files (npm needs these before install)
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# Install only production dependencies for all workspaces
RUN npm ci --only=production

# Copy Prisma schema and client from builder
COPY --from=builder /build/server/prisma ./prisma
COPY --from=builder /build/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /build/node_modules/@prisma ./node_modules/@prisma

# Copy built shared package
COPY --from=builder /build/shared/dist ./node_modules/@gaming-hub/shared/dist
COPY --from=builder /build/shared/package.json ./node_modules/@gaming-hub/shared/

# Copy built server application
COPY --from=builder /build/server/dist ./dist

# Create data directory for SQLite database
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app

# Note: .env files should be managed via environment variables in production
# Uncomment below if you need to copy .env files
# COPY --chown=nodejs:nodejs server/.env* ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/index.js"]
