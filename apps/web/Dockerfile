# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_ENV=production
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT=production
ARG VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
ARG VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
ARG VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
ARG VITE_APP_VERSION

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENV=$VITE_ENV
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT
ENV VITE_SENTRY_TRACES_SAMPLE_RATE=$VITE_SENTRY_TRACES_SAMPLE_RATE
ENV VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=$VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE
ENV VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=$VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
