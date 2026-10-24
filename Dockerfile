# ==============================================================================
# Multi-Stage Production Dockerfile for Apex Dental Clinic ERP
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm ci

# Copy client source code and build production bundle
COPY client/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Server Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Install server production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server code
COPY server/ /app/server/

# Copy built frontend assets from builder stage
COPY --from=client-builder /app/client/dist /app/client/dist

# Switch back to app root
WORKDIR /app

# Ensure data directory exists with write permissions
RUN mkdir -p /app/server/data/tenants /app/server/data/vault

# Persistent data volume for clinic records and encrypted medical scans
VOLUME ["/app/server/data"]

# Expose HTTP port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/health || exit 1

# Start the application
CMD ["node", "server/server.js"]
