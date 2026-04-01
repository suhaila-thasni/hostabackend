FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the project
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
