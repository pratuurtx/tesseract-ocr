FROM node:20.18-alpine AS BUILD_IMAGE

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20.18-alpine AS PRODUCTION_IMAGE

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY --from=BUILD_IMAGE /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]
