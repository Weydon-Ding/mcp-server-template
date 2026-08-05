# PROJECT KNOWLEDGE BASE

**Generated:** 2026-08-05
**Commit:** dbc9a28
**Branch:** main

## OVERVIEW

可复用的 TypeScript MCP 服务器模板，提供三个入口：stdio 传输、Streamable HTTP 传输、直接业务 CLI。业务逻辑位于 `src/domain/`，adapters 层保持轻薄。

## STRUCTURE

```
mcp-server-template/
├── src/
│   ├── cli.ts              # CLI 程序入口，装配 mcp/tools 子命令
│   ├── transports/         # stdio.ts / http.ts 传输层
│   ├── adapters/           # mcp/ 与 cli/ 薄适配器
│   ├── domain/             # 纯业务逻辑与工具定义（见 src/domain/AGENTS.md）
│   └── config/             # http.ts HTTP 配置解析
├── tests/                  # 单元测试与 smoke 测试（见 tests/AGENTS.md）
└── dist/                   # TypeScript 编译输出
```

## WHERE TO LOOK

| 任务            | 位置                                            | 说明                                                 |
| --------------- | ----------------------------------------------- | ---------------------------------------------------- |
| 新增 MCP 工具   | `src/domain/tools/*.ts` + `index.ts`            | 定义 Zod schema 与 run 函数，加入 `domainTools` 数组 |
| 新增 CLI 命令   | `src/adapters/cli/commands/tools.ts`            | 显式注册 commander 子命令                            |
| 修改 HTTP 行为  | `src/transports/http.ts` + `src/config/http.ts` | 创建 Express 应用与配置解析                          |
| 修改 MCP 服务器 | `src/adapters/mcp/create-server.ts`             | 服务器实例化与工具注册                               |

## CODE MAP

| Symbol                | Type           | Location                                | Role                                               |
| --------------------- | -------------- | --------------------------------------- | -------------------------------------------------- |
| `createMcpServer`     | function       | `src/adapters/mcp/create-server.ts:4`   | 创建 McpServer 实例并调用 `registerDomainTools`    |
| `registerDomainTools` | function       | `src/adapters/mcp/register-tools.ts:16` | 遍历 `domainTools` 数组，向 MCP 服务器注册每个工具 |
| `domainTools`         | const array    | `src/domain/tools/index.ts:7`           | 导出所有业务工具的集中注册点                       |
| `createToolsCommand`  | function       | `src/adapters/cli/commands/tools.ts:40` | 创建 CLI `tools` 子命令，暴露 echo/add 命令        |
| `startStdioTransport` | async function | `src/transports/stdio.ts:5`             | 启动 stdio 传输，连接 MCP 服务器                   |
| `startHttpTransport`  | async function | `src/transports/http.ts:54`             | 启动 HTTP 服务器，监听 `/mcp` 端点                 |
| `createHttpApp`       | function       | `src/transports/http.ts:16`             | 创建 Express 应用，配置认证中间件与 MCP 路由       |
| `parseHttpConfig`     | function       | `src/config/http.ts:22`                 | 解析 CLI 选项与环境变量，返回 `HttpConfig`         |
| `buildCliProgram`     | function       | `src/cli.ts:19`                         | 装配 commander 程序，添加 `mcp` 与 `tools` 命令    |

**调用流**：

- **stdio**: `cli.ts` → `startStdioTransport()` → `createMcpServer()` → `registerDomainTools()` → `domainTools`
- **HTTP**: `cli.ts` → `startHttpTransport()` → `createHttpApp()` → `createMcpServer()` → `registerDomainTools()`
- **CLI tools**: `cli.ts` → `createToolsCommand()` → `runEcho` / `runAdd` → domain 工具

**引用说明**: TypeScript LSP 未安装，引用计数基于 CodeGraph 已知证据与代码结构定性描述。

## CONVENTIONS

**NodeNext 模块**: `tsconfig.json` 使用 `module: "NodeNext"` + `moduleResolution: "NodeNext"`，所有导入必须带 `.js` 扩展名。

**严格 TypeScript**: `strict: true` + `noUncheckedIndexedAccess: true` + `exactOptionalPropertyTypes: true`。

**ESM 纯函数**: domain 工具不触碰 `console`/`process`/`fetch`；业务或配置错误使用 `DomainError`，schema 校验保留 Zod 语义。

**Thin Adapters**: MCP 与 CLI 层仅做协议转换，不嵌入业务逻辑。

**Zod 二次校验**: 即使 MCP 层已 parse，domain 的 `run*` 函数内部必须再次 `schema.parse(input)`。

## ANTI-PATTERNS (THIS PROJECT)

- 在 `src/domain/` 内使用 `console.log`、`process.stdin`、`fetch` 等外部 I/O。
- 新增工具后忘记加入 `domainTools` 数组。
- 在 run 函数内跳过二次 `parse()`。
- 导入路径省略 `.js` 扩展名（TypeScript 编译会失败）。
- HTTP 绑定 `0.0.0.0` 时未设置 `MCP_HTTP_TOKEN`。
- 使用裸 `Error` 表达已有 `ErrorCode` 可覆盖的业务或配置错误。

## UNIQUE STYLES

**三入口设计**: 同一套 domain 工具同时暴露为 MCP(stdio)、MCP(HTTP)、CLI 命令，通过 `src/cli.ts` 统一装配。

**测试分层**: `pnpm test` 排除 `tests/mcp/` smoke 测试，后者需 `pnpm test:smoke` 显式运行。

**Docker 面向 HTTP**: `Dockerfile` 仅用于 Streamable HTTP 传输，stdio 场景推荐本地直接运行。

**配置优先级**: CLI 选项 > 环境变量 > 默认值（`parseHttpConfig` 实现）。

## COMMANDS

```bash
pnpm install          # 安装依赖
pnpm typecheck        # TypeScript 类型检查（无输出）
pnpm lint             # ESLint
pnpm format:check     # Prettier 格式检查
pnpm format           # Prettier 格式修复
pnpm test             # 单元测试（排除 MCP smoke）
pnpm test:smoke       # MCP smoke 测试
pnpm build            # 编译到 dist/
pnpm dev:stdio        # 运行 MCP stdio 服务器
pnpm dev:http         # 运行 MCP HTTP 服务器（127.0.0.1:3000）
```

**直接 CLI**:

```bash
pnpm tsx src/cli.ts tools echo "hello"
pnpm tsx src/cli.ts tools add 1 2
pnpm tsx src/cli.ts tools add 1 2 --json   # 结构化 JSON 输出
```

**Docker**:

```bash
docker build -t mcp-server-template .
docker run --rm -p 3000:3000 -e MCP_HTTP_TOKEN=change-me mcp-server-template
```

## NOTES

**子级 AGENTS.md 职责**:

- `src/domain/AGENTS.md`: 业务层工具定义模式、错误语义、返回类型约定。
- `tests/AGENTS.md`: 测试目录结构、单元测试与 smoke 测试分层规则。

**HTTP 安全**: 默认绑定 `127.0.0.1` 无需 token；非本地绑定必须设置 `MCP_HTTP_TOKEN` 或使用认证反向代理。

**环境要求**: Node.js >= 20.0.0，包管理器 pnpm。

**入口文件**: `src/index.ts` 导出库入口（如有外部引用），`src/cli.ts` 为可执行入口。
