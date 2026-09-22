# syntax=docker/dockerfile:1

# ==========================================
# Stage 1: Install dependencies
# ==========================================
FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci


# ==========================================
# Stage 2: Run tests
# ==========================================
FROM dependencies AS test

COPY src ./src
COPY tests ./tests

RUN npm test


# ==========================================
# Stage 3: Production image
# ==========================================
FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=test --chown=node:node /app/src ./src

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
            CMD node -e "require('http').get('http://127.0.0.1:3000/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]