# Tests Knowledge Base

**Scope:** `tests/` subtree only  
**Test runner:** Vitest (Node environment)  
**Timeout:** 15 seconds per test

## OVERVIEW

分层测试套件：domain/config 使用直接单测，CLI/MCP 使用真实进程、服务器和 SDK transport 验证外部行为。

## STRUCTURE

```
tests/
├── domain/     # Pure function tests for domain tools
├── config/     # Config parsing and validation
├── cli/        # CLI subprocess integration
└── mcp/        # MCP transport smoke tests
```

## WHERE TO LOOK

| Layer                | Location                  | Pattern                            |
| -------------------- | ------------------------- | ---------------------------------- |
| Domain tool behavior | `domain/*.test.ts`        | Direct import, test exports        |
| Config validation    | `config/*.test.ts`        | Parse function, assert DomainError |
| CLI end-to-end       | `cli/*.test.ts`           | spawn(), assert stdout/stderr/exit |
| MCP stdio transport  | `mcp/stdio-smoke.test.ts` | StdioClientTransport               |
| MCP HTTP transport   | `mcp/http-smoke.test.ts`  | StreamableHTTPClientTransport      |

## CONVENTIONS

**Imports:** Use `.js` extension for relative imports (TypeScript module resolution).

**Domain tests:** Import and call exported functions directly. Test happy path and schema validation via `safeParse()`.

**Config tests:** Assert `DomainError` thrown with specific message for invalid input.

**CLI tests:** Spawn real subprocess with `node --import tsx src/cli.ts`. Assert:

- `code` exit code (0 success, 2 validation error)
- `stdout` trimmed output (human or JSON)
- `stderr` empty on success

**MCP smoke tests:** Use real SDK `Client` + transport. Pattern:

- Create transport pointing to `src/cli.ts` or HTTP server
- `afterEach` closes all transports and servers
- Call tool via `client.callTool()`, assert `result.content`

**Test discovery:** `*.test.ts` files only.

## ANTI-PATTERNS

- 不把 MCP 协议 smoke 测试放到 `domain/`、`config/` 或 `cli/`。
- 不用 mock 替代现有 CLI 子进程或 MCP transport 的端到端路径。
- 不在 smoke 测试中遗留未关闭的 server、client 或 transport。
- 不只断言进程成功；CLI 错误场景同时检查退出码和输出通道。

## COMMANDS

```bash
pnpm test           # Run domain/config/cli tests (excludes mcp/)
pnpm test:smoke     # Run MCP smoke tests only
```

## NOTES

New domain tool: add `domain/<tool>.test.ts` for behavior, `cli/tools.test.ts` if CLI-exposed, and update MCP smoke if tool should be MCP-accessible.
