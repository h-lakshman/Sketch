FROM node:20-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package*.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY turbo.json .
COPY .npmrc .

# Copy all workspace package.json files
COPY packages/common/package*.json ./packages/common/
COPY packages/typescript-config/package*.json ./packages/typescript-config/
COPY apps/web/package*.json ./apps/web/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies at root
RUN pnpm install

# Copy source files
COPY packages/common/ ./packages/common/
COPY packages/typescript-config/ ./packages/typescript-config/
COPY apps/web/ ./apps/web/

# Build the application
WORKDIR /app/apps/web
# Install dependencies in the web directory
RUN pnpm install
RUN pnpm exec next telemetry disable
RUN pnpm run build

# Expose the port
EXPOSE 3000

# Start the server
CMD ["pnpm", "run", "start"] 