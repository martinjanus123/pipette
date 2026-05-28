FROM node:22-alpine

WORKDIR /app

RUN chown node:node /app

COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci

COPY --chown=node:node index.html ./
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node tsconfig.node.json ./
COPY --chown=node:node vite.config.ts ./
COPY --chown=node:node src ./src

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
