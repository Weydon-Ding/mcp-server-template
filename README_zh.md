# mcp-server-template

[English](README.md) | **简体中文** | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

可复用的 TypeScript MCP server 模板，提供三个入口：

- 基于 stdio 的 MCP server
- 基于 Streamable HTTP 的 MCP server
- 直接调用业务能力的 CLI

模板将业务逻辑放在 `src/domain/`，并通过轻量 MCP 与 CLI adapter 暴露这些能力。

## 环境要求

- Node.js 20+
- pnpm

## 安装

```bash
pnpm install
```

## 以 stdio 方式运行 MCP server

```bash
pnpm dev:stdio
```

本地 MCP client 命令示例：

```bash
mcp-server-template mcp stdio
```

项目构建后的 Claude Desktop 风格 server 配置示例：

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

## 以 Streamable HTTP 方式运行 MCP server

```bash
pnpm dev:http
```

默认 endpoint：

```text
POST http://127.0.0.1:3000/mcp
```

覆盖 host 和 port：

```bash
pnpm tsx src/cli.ts mcp http --host 127.0.0.1 --port 3001
```

## 使用 Docker 运行

`Dockerfile` 面向 Streamable HTTP transport。

构建镜像：

```bash
docker build -t mcp-server-template .
```

运行 HTTP server：

```bash
docker run --rm -p 3000:3000 \
  -e MCP_HTTP_HOST=0.0.0.0 \
  -e MCP_HTTP_TOKEN=change-me \
  mcp-server-template
```

宿主机 endpoint：

```text
POST http://127.0.0.1:3000/mcp
```

如果把 server 暴露到受信任本地开发环境之外，请设置 `MCP_HTTP_TOKEN`，或把 server 放在带认证的 reverse proxy 后面。

Docker 不是 stdio MCP 的推荐使用方式；stdio 场景建议使用直接本地命令或 package-manager workflow。

## HTTP 配置

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

配置优先级：

1. CLI flags
2. Environment variables
3. Defaults

如果设置了 `MCP_HTTP_TOKEN`，请求必须包含：

```http
Authorization: Bearer <token>
```

默认情况下，HTTP server 绑定到 `127.0.0.1`，且不要求 token。如果绑定到非本地 interface，请设置 `MCP_HTTP_TOKEN`，或将 server 放在带认证的 reverse proxy 后面。

## 使用业务 CLI

```bash
pnpm tsx src/cli.ts tools echo "hello"
pnpm tsx src/cli.ts tools echo "hello" --json

pnpm tsx src/cli.ts tools add 1 2
pnpm tsx src/cli.ts tools add 1 2 --json
```

默认输出是适合人阅读的格式。`--json` 会返回适合脚本使用的稳定结构化 JSON。

## 添加新的 domain tool

1. 创建 `src/domain/tools/my-tool.ts`，包含：
   - Zod input schema
   - input/output types
   - metadata
   - 纯业务函数
2. 从 `src/domain/tools/index.ts` 导出它，并加入 `domainTools`。
3. 如果这个 tool 需要从终端使用，在 `src/adapters/cli/commands/tools.ts` 中添加 CLI command。
4. MCP adapter 会从 `domainTools` 注册 tools；一旦 tool 加入 registry，就会自动通过 MCP 暴露。
5. 为新行为添加 domain、CLI 和 smoke tests。

## 质量检查

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:smoke
```

## 从模板创建新的 MCP 项目

1. 从这个 Gitea template 创建新仓库。
2. 修改 `package.json` 中的 package 名称。
3. 用真实 domain tools 替换 `echo` 和 `add`。
4. 更新 `README.md`，加入新 tools 的文档。
5. 发布前运行所有质量检查。
