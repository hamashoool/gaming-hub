# Multi-stage build for Gaming Hub Server

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /build

# Copy root package files
COPY package*.json ./

# Copy shared and server packages
COPY shared ./shared
COPY server ./server

# Install all dependencies
RUN npm ci

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

# Copy root package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy Prisma schema and client from builder
COPY --from=builder /build/server/prisma ./prisma
COPY --from=builder /build/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /build/server/node_modules/@prisma ./node_modules/@prisma

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
