# -------- BUILD STAGE --------
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# -------- PRODUCTION STAGE --------
FROM node:18-slim
WORKDIR /app
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations

# SECURITY: run as non-root user
USER node

EXPOSE 3004

# Auto-Migration Check then Start
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node dist/server.js"]
