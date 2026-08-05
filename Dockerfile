# ============================================================
# RentHub Backend - Production Dockerfile
# Multi-stage build: deps -> build -> runtime
# ============================================================

# ---------- Stage 1: Install dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package manifests first for layer caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# ---------- Stage 2: Build (dev deps needed for tsc) ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript -> dist
RUN npm run build

# ---------- Stage 3: Production runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -S renthub && adduser -S renthub -G renthub

# Copy production dependencies
COPY --from=deps --chown=renthub:renthub /app/node_modules ./node_modules
# Copy built output
COPY --from=build --chown=renthub:renthub /app/dist ./dist
COPY --from=build --chown=renthub:renthub /app/package.json ./package.json

# Uploads directory (mounted volume in docker-compose)
RUN mkdir -p /app/uploads /app/logs && chown -R renthub:renthub /app/uploads /app/logs

# Switch to non-root user
USER renthub

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
</content>
