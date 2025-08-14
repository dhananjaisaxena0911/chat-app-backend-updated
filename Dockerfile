FROM node:20-alpine

WORKDIR /app

# Copy package files and prisma first for caching
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the source code
COPY . .

# Build the NestJS app
RUN npm run build

# Expose backend port
EXPOSE 3001

# Run migrations and start in production mode
CMD npx prisma migrate deploy && npm run start:prod
