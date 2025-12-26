# =========================
# Stage 1: Dependencies
# =========================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm install

# =========================
# Stage 2: Build
# =========================
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Tailwind CSS
RUN npx tailwindcss \
  -i ./src/public/css/input.css \
  -o ./src/public/css/style.css \
  --minify

# =========================
# Stage 3: Production
# =========================
FROM node:20-alpine AS production

WORKDIR /app

# Install required system packages
RUN apk add --no-cache netcat-openbsd

# Copy package files and install prod deps
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built app
COPY --from=build /app/src ./src
COPY --from=build /app/.sequelizerc ./.sequelizerc

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# App directories
RUN mkdir -p uploads logs && chown -R nodejs:nodejs /app

# Entrypoint
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/app.js"]
