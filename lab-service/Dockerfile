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
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

# SECURITY: run as non-root user
USER node

EXPOSE 3014

CMD ["node", "dist/server.js"]
