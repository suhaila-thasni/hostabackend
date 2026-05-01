FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Compile TypeScript
RUN npm run build

EXPOSE 3002

CMD ["sh", "-c", "npm run migrate && node dist/server.js"]
