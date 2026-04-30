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
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations

# SECURITY: run as non-root user
USER node

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e 'require("http").get("http://localhost:3004/health", (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }).on("error", (e) => process.exit(1))'

CMD ["sh", "-c", "npx sequelize-cli db:migrate && node dist/server.js"]

