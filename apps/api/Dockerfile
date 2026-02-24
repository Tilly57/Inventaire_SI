# Stage 1: Build (install all deps + generate Prisma client)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema before npm install (required for Prisma postinstall scripts)
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for Prisma generation)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Production (only production deps)
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy application code
COPY . .

# Own uploads directory
RUN mkdir -p /app/uploads /app/logs && chown -R nodejs:nodejs /app/uploads /app/logs

# Switch to non-root user
USER nodejs

# Expose API port
EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
