# Multi-stage build for Gaming Hub Client

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /build

# Copy root package files
COPY ../package*.json ./

# Copy shared and client packages
COPY ../shared ./shared
COPY . ./client

# Install all dependencies
RUN npm ci

# Build shared package first
WORKDIR /build/shared
RUN npm run build

# Build client with environment variable
WORKDIR /build/client
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage 2: Production - serve with nginx
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /build/client/dist /usr/share/nginx/html

# Create nginx user
RUN addgroup -g 101 -S nginx || true && \
    adduser -S nginx -u 101 || true

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
