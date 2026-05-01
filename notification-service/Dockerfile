FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Compile TypeScript
RUN npm run build

EXPOSE 3002

CMD ["node", "dist/server.js"]
