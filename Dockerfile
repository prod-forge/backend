# -------- Build Stage --------
FROM node:24.21.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json prisma.config.ts ./
COPY database-manager ./database-manager
COPY src ./src

RUN npm run db:generate
RUN npm run build
# -------- Production Stage --------
FROM node:24.21.0-alpine AS production

# Create an unprivileged user
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

COPY prisma.config.ts ./
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database-manager ./database-manager

# Changing file ownership
RUN chown -R nodeuser:nodegroup /app

USER nodeuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
