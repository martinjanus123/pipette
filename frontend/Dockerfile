FROM node:22-alpine

WORKDIR /app

COPY --chown=root:root --chmod=755 package.json package-lock.json ./
RUN npm ci

COPY --chown=root:root --chmod=755 index.html ./
COPY --chown=root:root --chmod=755 tsconfig.json ./
COPY --chown=root:root --chmod=755 tsconfig.node.json ./
COPY --chown=root:root --chmod=755 vite.config.mjs ./
COPY --chown=root:root --chmod=755 src ./src
ENV VITE_CACHE_DIR=/app/.vite-config/cache

RUN mkdir /app/.vite-config \
    && cp vite.config.mjs /app/.vite-config/vite.config.mjs \
    && chown -R node:node /app/.vite-config

USER node

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--config", "/app/.vite-config/vite.config.mjs"]
