FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema before npm install (required for Prisma postinstall scripts)
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for Prisma generation)
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose API port
EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
