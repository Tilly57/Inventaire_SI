FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose API port
EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
