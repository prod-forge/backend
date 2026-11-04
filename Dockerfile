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

# RDS enforces TLS and the app verifies the server certificate (the connection string sets verify-full explicitly).
# The RDS CA is not in Node's built-in store, so the AWS global bundle (all regions) is trusted on top of it.
# Placed before the code layers so code changes do not re-download the bundle.
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/certs/rds-global-bundle.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/rds-global-bundle.pem

WORKDIR /app

COPY prisma.config.ts ./
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Nothing runs through npm at runtime: the app starts with node and the migration task calls the Prisma CLI directly.
# The npm bundled with the base image carries its own dependency tree that image scans keep flagging, so it is removed.
RUN npm cache clean --force \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database-manager ./database-manager

# Changing file ownership
RUN chown -R nodeuser:nodegroup /app

USER nodeuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.APP_PORT||3000)+'/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
