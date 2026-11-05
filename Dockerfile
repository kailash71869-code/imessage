FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY Backend/package*.json ./
RUN npm ci --omit=dev

COPY Backend/src ./src

EXPOSE 5000

CMD ["node", "src/index.js"]
