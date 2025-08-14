FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Install all deps (including dev) to allow building
RUN npm install

COPY . .

# Build the app (Nest CLI is available now)
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

EXPOSE 3001

CMD npx prisma migrate deploy && npm run start:prod
