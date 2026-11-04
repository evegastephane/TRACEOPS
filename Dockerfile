# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY . .
# Optional CA for managed environments; ordinary local builds use system trust.
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --no-audit --no-fund && \
    npm run build && npm run build:web && \
    npm prune --omit=dev --ignore-scripts --no-audit --no-fund && \
    mkdir /runtime && cp -r package.json node_modules dist web-dist /runtime/

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build --chown=node:node /runtime/ ./
USER node
EXPOSE 3000
CMD ["sh", "-c", "node dist/src/migrate.js && exec node dist/src/main.js"]
