# CLAUDE.md

This file gives Claude Code concise guidance for working in this repository.

## Environment setup

- Use Node.js 20 or newer.
- Use pnpm as the package manager.
- Install dependencies with:

```bash
pnpm install
```

## Common commands

```bash
pnpm typecheck      # TypeScript type checking
pnpm lint           # ESLint
pnpm format:check   # Prettier check
pnpm test           # Unit tests, excluding MCP smoke tests
pnpm test:smoke     # MCP smoke tests
pnpm build          # Compile to dist/
```

## Development entry points

```bash
pnpm dev:stdio      # Run MCP server over stdio
pnpm dev:http       # Run MCP server over Streamable HTTP
```

The HTTP server defaults to `127.0.0.1:3000` with endpoint `POST /mcp`.

Optional HTTP environment variables:

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

If binding HTTP to a non-local interface, set `MCP_HTTP_TOKEN` or use an authenticated reverse proxy.

## Repository notes

- Keep domain/business logic in `src/domain/`.
- Keep MCP and CLI layers as thin adapters over the domain tools.
- Before completing code changes, prefer running at least `pnpm typecheck`, `pnpm lint`, and the relevant tests.
