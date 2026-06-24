ARG PNPM_VERSION=10.26.0

FROM node:20-slim AS deps
ARG PNPM_VERSION

WORKDIR /app

RUN corepack enable && corepack prepare "pnpm@${PNPM_VERSION}" --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY tsconfig.json tsconfig.eslint.json ./
COPY src ./src
RUN pnpm build

FROM node:20-slim AS runtime
ARG PNPM_VERSION

WORKDIR /app

ENV NODE_ENV=production
ENV MCP_HTTP_HOST=0.0.0.0
ENV MCP_HTTP_PORT=3000

RUN corepack enable && corepack prepare "pnpm@${PNPM_VERSION}" --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/cli.js", "mcp", "http"]
