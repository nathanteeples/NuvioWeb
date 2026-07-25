# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime

ENV HOST=0.0.0.0 \
    PORT=4173 \
    NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache ffmpeg \
    && mkdir -p /home/node/.nuvio-media-server \
    && chown node:node /home/node/.nuvio-media-server

COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/local.example.properties ./local.example.properties
COPY --from=build --chown=node:node /app/scripts/envProperties.mjs ./scripts/envProperties.mjs
COPY --from=build --chown=node:node /app/scripts/serve.mjs ./scripts/serve.mjs
COPY --from=build --chown=node:node /app/services/webos/runtime/media-http.cjs ./services/webos/runtime/media-http.cjs

USER node

EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 4173}/`).then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["node", "./scripts/serve.mjs"]
