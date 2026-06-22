Status: DONE
Summary of changes
- Fixed the CLI HTTP command in `src/cli.ts` so it now builds the transport options object by conditionally adding only defined properties, which satisfies `exactOptionalPropertyTypes`.
- Kept the existing CLI business command implementation and transport entry wiring intact.

Tests/commands run with outputs summarized
- `pnpm test tests/cli/tools.test.ts` passed: 5 tests passed.
- `pnpm typecheck` failed only at `src/index.ts` with the expected missing future MCP adapter import (`./adapters/mcp/create-server.js`). No Task 3 code errors remained.

Commits created
- `991c39a` — `feat: add business CLI commands`
- `a0c6d8f` — `fix: satisfy exact optional cli http options`

Self-review notes
- The HTTP command no longer passes `host: undefined` or `port: undefined` into `startHttpTransport`.

Concerns if any
- None beyond the pre-existing Task 4 typecheck failure in `src/index.ts`.