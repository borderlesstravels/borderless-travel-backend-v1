FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=2023
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/db ./db
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/app ./app
COPY --from=builder /app/cloudinary.js ./
COPY --from=builder /app/multer.js ./
COPY --from=builder /app/next.config.js ./
EXPOSE 2023
CMD ["npm", "run", "start"]
