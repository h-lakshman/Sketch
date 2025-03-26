FROM node:20-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package*.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY turbo.json .
COPY .npmrc .

# Copy all workspace package.json files
COPY packages/db/package*.json ./packages/db/
COPY packages/common/package*.json ./packages/common/
COPY packages/server-common/package*.json ./packages/server-common/
COPY packages/typescript-config/package*.json ./packages/typescript-config/
COPY apps/ws-server/package*.json ./apps/ws-server/

RUN npm install -g pnpm

RUN pnpm install

# Copy source files
COPY packages/db/ ./packages/db/
COPY packages/common/ ./packages/common/
COPY packages/server-common/ ./packages/server-common/
COPY packages/typescript-config/ ./packages/typescript-config/
COPY apps/ws-server/ ./apps/ws-server/

WORKDIR /app/packages/db
RUN pnpm install prisma --save-dev
RUN pnpm prisma generate

WORKDIR /app/apps/ws-server
RUN pnpm run build

EXPOSE 3002

CMD ["pnpm", "run", "start"] 