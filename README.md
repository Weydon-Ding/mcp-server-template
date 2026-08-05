# mcp-server-template

**English** | [简体中文](README_zh.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

Reusable TypeScript template for building MCP servers with three entry points:

- MCP over stdio
- MCP over Streamable HTTP
- Direct business CLI

The template keeps business logic in `src/domain/` and exposes it through thin MCP and CLI adapters.

## Requirements

- Node.js 20+
- pnpm

## Install

```bash
pnpm install
```

## Run as MCP over stdio

```bash
pnpm dev:stdio
```

Example local MCP client command:

```bash
mcp-server-template mcp stdio
```

Example Claude Desktop-style server config after building the project:

```json
{
  "mcpServers": {
    "mcp-server-template": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-template/dist/cli.js", "mcp", "stdio"]
    }
  }
}
```

## Run as MCP over Streamable HTTP

```bash
pnpm dev:http
```

Default endpoint:

```text
POST http://127.0.0.1:3000/mcp
```

Override host and port:

```bash
pnpm tsx src/cli.ts mcp http --host 127.0.0.1 --port 3001
```

## Run with Docker

The Dockerfile is intended for the Streamable HTTP transport.

Build the image:

```bash
docker build -t mcp-server-template .
```

Run the HTTP server:

```bash
docker run --rm -p 3000:3000 \
  -e MCP_HTTP_HOST=0.0.0.0 \
  -e MCP_HTTP_TOKEN=change-me \
  mcp-server-template
```

The host endpoint is:

```text
POST http://127.0.0.1:3000/mcp
```

Set `MCP_HTTP_TOKEN` when exposing the server beyond trusted local development, or put the server behind an authenticated reverse proxy.

Docker is not the recommended path for stdio MCP usage; use the direct local command or package-manager workflow for stdio.

## HTTP configuration

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

Configuration precedence:

1. CLI flags
2. Environment variables
3. Defaults

If `MCP_HTTP_TOKEN` is set, requests must include:

```http
Authorization: Bearer <token>
```

By default the HTTP server binds to `127.0.0.1` and does not require a token. If you bind to a non-local interface, set `MCP_HTTP_TOKEN` or put the server behind an authenticated reverse proxy.

## Use the business CLI

```bash
pnpm tsx src/cli.ts tools echo "hello"
pnpm tsx src/cli.ts tools echo "hello" --json

pnpm tsx src/cli.ts tools add 1 2
pnpm tsx src/cli.ts tools add 1 2 --json
```

Default output is human-readable. `--json` returns stable structured JSON for scripts.

## Add a new domain tool

1. Create `src/domain/tools/my-tool.ts` with:
   - a Zod input schema
   - input/output types
   - metadata
   - a pure business function
2. Export it from `src/domain/tools/index.ts` and add it to `domainTools`.
3. Add a CLI command in `src/adapters/cli/commands/tools.ts` if the tool should be available from the terminal.
4. The MCP adapter registers tools from `domainTools`, so MCP exposure is automatic once the tool is added to the registry.
5. Add domain, CLI, and smoke tests for the new behavior.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:smoke
```

## From template to a new MCP project

1. Create a new repository from this Gitea template.
2. Rename the package in `package.json`.
3. Replace `echo` and `add` with your real domain tools.
4. Update `README.md` with the new tool documentation.
5. Run all quality checks before publishing.
