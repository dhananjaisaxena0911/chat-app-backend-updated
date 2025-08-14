FROM node:20-alpine

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies without triggering migrations
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 3001

# Run migrations + start app
CMD npx prisma migrate deploy && npm run start:prod
