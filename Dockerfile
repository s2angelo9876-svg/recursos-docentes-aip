# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN --mount=type=secret,id=proxy_ca,target=/run/secrets/proxy-ca.pem \
    if [ -f /run/secrets/proxy-ca.pem ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy-ca.pem; fi && \
    npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN --mount=type=secret,id=proxy_ca,target=/run/secrets/proxy-ca.pem \
    if [ -f /run/secrets/proxy-ca.pem ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy-ca.pem; fi && \
    npm ci --omit=dev

COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server.js db.json ./
COPY --chown=node:node server ./server
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node shared ./shared

RUN mkdir -p logs && chown node:node logs
USER node

ENV NODE_ENV=production

EXPOSE 10000

CMD ["node", "server.js"]
