FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev && npm cache clean --force

COPY . .

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

USER node

CMD ["npm", "start"]
