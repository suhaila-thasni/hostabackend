# -------- BUILD STAGE --------
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# -------- PRODUCTION STAGE --------
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/.sequelizerc ./.sequelizerc
COPY --from=builder /app/config ./config

# SECURITY: run as non-root user
# Note: we temporarily need root to run migrations or we ensure permissions are correct
# USER node 

EXPOSE 3014

CMD ["sh", "-c", "npx sequelize-cli db:migrate && node dist/server.js"]
