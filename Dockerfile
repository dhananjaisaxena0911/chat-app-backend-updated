# Stage 1 — Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including dev) so Nest CLI works
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS app
RUN npm run build


# Stage 2 — Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled app from builder stage
COPY --from=builder /app/dist ./dist

# Expose backend port
EXPOSE 3001

# Run DB migrations & start
CMD npx prisma migrate deploy && npm run start:prod
