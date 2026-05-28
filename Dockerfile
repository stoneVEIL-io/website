# ==========================================
# Stage 1: Build & Compile
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package metadata files
COPY package*.json ./

# Install all dependencies (dev + prod)
RUN npm install

# Copy all source files
COPY . .

# Build the project (creates dist/ and compiles server.ts)
RUN npm run build

# Prune devDependencies to keep production image small
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Runtime Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose port (Cloud Run defaults to 3000 here)
EXPOSE 3000

# Run container as non-privileged node user
USER node

# Execute server directly to properly handle OS signals (SIGTERM)
CMD ["node", "dist/server.cjs"]
