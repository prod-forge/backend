# -------- Build Stage --------
FROM node:24-alpine AS builder

WORKDIR /app

COPY . .
RUN npm ci

RUN npm run db:generate
RUN npm run build
# -------- Production Stage --------
FROM node:24-alpine AS production

# Create an unprivileged user
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

# Can be useful for debugging
RUN apk add nano
RUN apk add --no-cache curl

COPY .env ./
COPY .env.common ./
COPY prisma.config.ts ./
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database-manager ./database-manager

# Changing file ownership
RUN chown -R nodeuser:nodegroup /app

USER nodeuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
