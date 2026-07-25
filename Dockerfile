# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=24.14.0

FROM oven/bun:${BUN_VERSION}-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN NITRO_PRESET=node-server bun run build

FROM node:${NODE_VERSION}-alpine AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    NITRO_HOST=0.0.0.0 \
    PORT=3000

WORKDIR /app

COPY --from=build --chown=node:node /app/.output ./.output

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["node", ".output/server/index.mjs"]
