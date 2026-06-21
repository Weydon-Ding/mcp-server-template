# MCP Server Template Design

## Summary

Build a reusable TypeScript/Node.js template project for quickly creating MCP servers. The template will support three first-class entry points over one shared business core:

1. MCP over stdio for local clients such as Claude Code and Claude Desktop.
2. MCP over Streamable HTTP for HTTP-capable MCP clients and service-style usage.
3. A business CLI for direct terminal and script usage of the same underlying tool logic.

The repository will be named `mcp-server-template`, use `pnpm`, include minimal example tools (`echo` and `add`), include basic quality checks, and be pushed to a new private Gitea repository under the user's personal account.

## Goals

- Provide a high-quality TypeScript MCP template that can be reused through Gitea template repositories.
- Keep business logic independent from MCP protocol and CLI adapter code.
- Support both MCP transports as first-class modes: stdio and Streamable HTTP.
- Support a real CLI interface so business capabilities can be used without an MCP client.
- Make the first run easy to verify through simple example tools.
- Keep the first version lightweight and understandable for someone new to JavaScript/TypeScript.

## Non-goals

- Do not build a full project generator or `create-*` scaffolding CLI in the first version.
- Do not implement legacy SSE MCP transport in the first version.
- Do not include real external API integrations in the template examples.
- Do not force HTTP authentication by default for localhost development.
- Do not add release automation, Docker, or CI beyond the local quality scripts in the first version.

## Technology choices

- Runtime: Node.js
- Language: TypeScript
- Package manager: pnpm
- MCP SDK: official TypeScript MCP SDK
- CLI framework: commander
- Runtime schema validation: Zod
- Tests: Vitest
- Formatting/linting: Prettier and ESLint

## Architecture

The template uses a business-core-plus-adapters architecture:

```text
src/domain/
  Pure business logic, schemas, input/output types
        |
        |-- src/adapters/mcp/
        |     Maps domain tools to MCP tools
        |
        |-- src/adapters/cli/
        |     Maps domain tools to CLI commands
        |
        `-- src/transports/
              Starts MCP over stdio or Streamable HTTP
```

Business functions are not implemented inside MCP tool handlers or CLI commands. They live under `src/domain/` and are called by both adapters. This keeps the template easy to test and makes future MCP projects usable from both MCP clients and shell scripts.

## Project structure

```text
mcp-server-template/
  package.json
  pnpm-lock.yaml
  tsconfig.json
  eslint.config.js
  prettier.config.js
  vitest.config.ts
  README.md
  .env.example
  .gitignore

  src/
    index.ts
    cli.ts

    domain/
      tools/
        add.ts
        echo.ts
        index.ts
      errors.ts
      result.ts

    adapters/
      cli/
        commands/
          tools.ts
        format.ts
        errors.ts
      mcp/
        create-server.ts
        register-tools.ts
        tool-result.ts

    transports/
      stdio.ts
      http.ts

    config/
      http.ts

  tests/
    domain/
      add.test.ts
      echo.test.ts
    cli/
      tools.test.ts
    mcp/
      stdio-smoke.test.ts
      http-smoke.test.ts
```

## Domain tool design

Each business tool module exports:

- A Zod input schema.
- TypeScript input/output types inferred from the schema.
- A tool description.
- The business function.

Initial example tools:

- `echo`: accepts a text string and returns the same text.
- `add`: accepts two numbers and returns their sum.

These examples exist to prove the template wiring works. Future projects should replace or extend the domain tools rather than duplicating MCP or CLI adapter logic.

## CLI design

The package exposes a formal bin command. During template implementation the binary name can default to `mcp-server-template`; downstream projects can rename it in `package.json`.

Command shape:

```bash
mcp-server-template --help

mcp-server-template mcp stdio
mcp-server-template mcp http --host 127.0.0.1 --port 3000

mcp-server-template tools echo "hello"
mcp-server-template tools echo "hello" --json

mcp-server-template tools add 1 2
mcp-server-template tools add 1 2 --json
```

Default CLI output is human-readable:

```text
hello
3
```

`--json` returns stable structured JSON:

```json
{
  "ok": true,
  "data": {
    "result": 3
  }
}
```

Errors use a consistent JSON shape when `--json` is set:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Expected number, received string"
  }
}
```

CLI error codes and exit codes:

| Error code | Meaning | Exit code |
| --- | --- | --- |
| `VALIDATION_ERROR` | CLI or domain input validation failed | 2 |
| `CONFIG_ERROR` | Configuration is invalid | 2 |
| `RUNTIME_ERROR` | Business logic failed at runtime | 1 |
| `UNKNOWN_ERROR` | Unexpected error | 1 |

Commander handles command routing and arguments. Zod handles runtime validation. The CLI adapter must not contain business logic.

## MCP server design

MCP server creation is centralized in `src/adapters/mcp/create-server.ts`.

Responsibilities:

- Create the MCP server with name and version metadata.
- Register example domain tools as MCP tools.
- Provide extension points for future resources and prompts.
- Stay independent from transport details.

`stdio` and HTTP both call the same server factory.

### stdio transport

Command:

```bash
mcp-server-template mcp stdio
```

Requirements:

- Use stdio transport from the MCP TypeScript SDK.
- Do not write logs to stdout because stdout is reserved for the MCP protocol.
- Send diagnostic logs to stderr if needed.
- Document example Claude Code / Claude Desktop configuration in README.

### Streamable HTTP transport

Command:

```bash
mcp-server-template mcp http
mcp-server-template mcp http --host 127.0.0.1 --port 3000
```

Required endpoint:

```text
POST /mcp
```

Default configuration:

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

Configuration precedence:

1. CLI flags.
2. Environment variables.
3. Defaults.

Authentication behavior:

- If `MCP_HTTP_TOKEN` is empty, HTTP auth is disabled.
- If `MCP_HTTP_TOKEN` is set, requests must include `Authorization: Bearer <token>`.
- The token must never be logged.
- If the server binds to `0.0.0.0` without a token, startup should emit a clear warning but not fail.

A future `GET /healthz` endpoint is acceptable, but not required for the first version.

## Error handling

Domain errors should be explicit and mappable to adapters. Validation failures should be distinguishable from runtime failures.

MCP adapter behavior:

- Zod validation failures become clear tool argument errors.
- Expected business failures become MCP tool error results.
- Unexpected failures return a generic error message and do not expose stack traces to the MCP client.

CLI adapter behavior:

- Validation failures return `VALIDATION_ERROR` and exit code 2.
- Config failures return `CONFIG_ERROR` and exit code 2.
- Runtime failures return `RUNTIME_ERROR` and exit code 1.
- Unknown failures return `UNKNOWN_ERROR` and exit code 1.

## Testing and quality checks

Local scripts:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:smoke
```

Test layers:

### Domain tests

- `echo` returns input text.
- `add` returns the sum of two numbers.
- Invalid inputs are rejected by Zod schemas.

### CLI tests

- Human-readable output works for example tools.
- `--json` output is stable and parseable.
- Invalid arguments map to the expected error code and exit code.

### MCP smoke tests

- stdio transport starts and can complete an example tool call.
- Streamable HTTP transport starts and can complete an example tool call through `POST /mcp`.
- HTTP token behavior is covered: no token or wrong token is rejected when configured; correct token succeeds.

## README requirements

README should include:

- Project purpose.
- Installation and quick start with pnpm.
- MCP stdio usage and client configuration example.
- MCP Streamable HTTP usage.
- CLI usage examples.
- Configuration reference.
- HTTP security notes.
- Test and quality commands.
- How to add a new domain tool.
- How to create a new MCP project from this Gitea template.

## Gitea publication plan

After implementation and verification:

1. Create `/Users/kumachan/Downloads/mcp-server-template`.
2. Initialize git in that directory.
3. Commit the completed template.
4. Use the Gitea MCP tools to create a new private repository under the user's personal account:
   - name: `mcp-server-template`
   - private: `true`
   - template: `true` if supported by the Gitea API/tooling
5. Add the remote and push the local repository.
6. If template mode cannot be enabled via API/tooling, document the need to enable it from the Gitea UI.

The user explicitly said this project is not in an iCloud-synced directory, so the implementation plan should not require running `xattr -w com.apple.clouddocs.not-sync 1 .git` for this repository.

## Open decisions

None. All design choices needed for the first implementation are settled.
