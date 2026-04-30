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

# SECURITY: run as non-root user
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e 'require("http").get("http://localhost:3000/health", (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))'

CMD ["node", "dist/server.js"]

