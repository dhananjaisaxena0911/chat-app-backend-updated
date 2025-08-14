# Stage 1 — Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json + package-lock.json
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including dev) so Nest CLI is available
RUN npm install

# Copy all source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN npm run build


# Stage 2 — Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package.json + prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Copy any assets if needed (optional)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD npx prisma migrate deploy && npm run start:prod
