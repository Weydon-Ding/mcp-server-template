# mcp-server-template

[English](README.md) | [简体中文](README_zh.md) | **繁體中文** | [日本語](README_ja.md) | [한국어](README_ko.md)

可重複使用的 TypeScript MCP server 範本，提供三個入口：

- 基於 stdio 的 MCP server
- 基於 Streamable HTTP 的 MCP server
- 直接呼叫業務能力的 CLI

此範本將業務邏輯放在 `src/domain/`，並透過輕量的 MCP 與 CLI adapter 暴露這些能力。

## 環境需求

- Node.js 20+
- pnpm

## 安裝

```bash
pnpm install
```

## 以 stdio 方式執行 MCP server

```bash
pnpm dev:stdio
```

本機 MCP client 命令範例：

```bash
mcp-server-template mcp stdio
```

專案建置後的 Claude Desktop 風格 server 設定範例：

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

## 以 Streamable HTTP 方式執行 MCP server

```bash
pnpm dev:http
```

預設 endpoint：

```text
POST http://127.0.0.1:3000/mcp
```

覆寫 host 與 port：

```bash
pnpm tsx src/cli.ts mcp http --host 127.0.0.1 --port 3001
```

## 使用 Docker 執行

`Dockerfile` 面向 Streamable HTTP transport。

建置映像：

```bash
docker build -t mcp-server-template .
```

執行 HTTP server：

```bash
docker run --rm -p 3000:3000 \
  -e MCP_HTTP_HOST=0.0.0.0 \
  -e MCP_HTTP_TOKEN=change-me \
  mcp-server-template
```

主機 endpoint：

```text
POST http://127.0.0.1:3000/mcp
```

如果要將 server 暴露到受信任的本機開發環境之外，請設定 `MCP_HTTP_TOKEN`，或將 server 放在具備認證的 reverse proxy 後方。

Docker 不是 stdio MCP 的建議使用方式；stdio 場景建議使用直接本機命令或 package-manager workflow。

## HTTP 設定

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

設定優先順序：

1. CLI flags
2. Environment variables
3. Defaults

如果設定了 `MCP_HTTP_TOKEN`，請求必須包含：

```http
Authorization: Bearer <token>
```

預設情況下，HTTP server 會綁定到 `127.0.0.1`，且不要求 token。如果綁定到非本機 interface，請設定 `MCP_HTTP_TOKEN`，或將 server 放在具備認證的 reverse proxy 後方。

## 使用業務 CLI

```bash
pnpm tsx src/cli.ts tools echo "hello"
pnpm tsx src/cli.ts tools echo "hello" --json

pnpm tsx src/cli.ts tools add 1 2
pnpm tsx src/cli.ts tools add 1 2 --json
```

預設輸出是適合人類閱讀的格式。`--json` 會回傳適合腳本使用的穩定結構化 JSON。

## 新增 domain tool

1. 建立 `src/domain/tools/my-tool.ts`，包含：
   - Zod input schema
   - input/output types
   - metadata
   - 純業務函式
2. 從 `src/domain/tools/index.ts` 匯出它，並加入 `domainTools`。
3. 如果這個 tool 需要從終端機使用，請在 `src/adapters/cli/commands/tools.ts` 中新增 CLI command。
4. MCP adapter 會從 `domainTools` 註冊 tools；tool 加入 registry 後，就會自動透過 MCP 暴露。
5. 為新行為新增 domain、CLI 和 smoke tests。

## 品質檢查

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:smoke
```

## 從範本建立新的 MCP 專案

1. 從這個 Gitea template 建立新儲存庫。
2. 修改 `package.json` 中的 package 名稱。
3. 用真實 domain tools 取代 `echo` 和 `add`。
4. 更新 `README.md`，加入新 tools 的文件。
5. 發布前執行所有品質檢查。
