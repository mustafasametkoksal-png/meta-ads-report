# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# ── Stage 2: Production (Puppeteer's official image with Chrome) ───────────
FROM ghcr.io/puppeteer/puppeteer:24.2.0 AS production

USER root

RUN npm install -g pnpm@10.4.1

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

COPY drizzle ./drizzle
COPY drizzle.config.ts ./

# Switch back to non-root user for security
USER pptruser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

CMD ["node", "dist/index.js"]
