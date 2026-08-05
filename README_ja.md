# mcp-server-template

[English](README.md) | [简体中文](README_zh.md) | [繁體中文](README_zh-TW.md) | **日本語** | [한국어](README_ko.md)

再利用可能な TypeScript MCP server テンプレートです。次の 3 つのエントリーポイントを提供します。

- stdio ベースの MCP server
- Streamable HTTP ベースの MCP server
- ビジネス機能を直接呼び出す CLI

このテンプレートはビジネスロジックを `src/domain/` に置き、薄い MCP adapter と CLI adapter を通じて公開します。

## 要件

- Node.js 20+
- pnpm

## インストール

```bash
pnpm install
```

## stdio で MCP server を実行する

```bash
pnpm dev:stdio
```

ローカル MCP client コマンド例：

```bash
mcp-server-template mcp stdio
```

プロジェクトをビルドした後の Claude Desktop 形式の server 設定例：

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

## Streamable HTTP で MCP server を実行する

```bash
pnpm dev:http
```

デフォルト endpoint：

```text
POST http://127.0.0.1:3000/mcp
```

host と port を上書きする場合：

```bash
pnpm tsx src/cli.ts mcp http --host 127.0.0.1 --port 3001
```

## Docker で実行する

`Dockerfile` は Streamable HTTP transport 向けです。

イメージをビルドします。

```bash
docker build -t mcp-server-template .
```

HTTP server を実行します。

```bash
docker run --rm -p 3000:3000 \
  -e MCP_HTTP_HOST=0.0.0.0 \
  -e MCP_HTTP_TOKEN=change-me \
  mcp-server-template
```

ホスト側 endpoint：

```text
POST http://127.0.0.1:3000/mcp
```

信頼できるローカル開発環境の外へ server を公開する場合は、`MCP_HTTP_TOKEN` を設定するか、認証付き reverse proxy の背後に server を配置してください。

Docker は stdio MCP 用途では推奨される方法ではありません。stdio では、直接のローカルコマンドまたは package-manager workflow を使うことを推奨します。

## HTTP 設定

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

設定の優先順位：

1. CLI flags
2. Environment variables
3. Defaults

`MCP_HTTP_TOKEN` が設定されている場合、リクエストには次を含める必要があります。

```http
Authorization: Bearer <token>
```

デフォルトでは、HTTP server は `127.0.0.1` にバインドされ、token は不要です。非ローカル interface にバインドする場合は、`MCP_HTTP_TOKEN` を設定するか、認証付き reverse proxy の背後に server を配置してください。

## ビジネス CLI を使う

```bash
pnpm tsx src/cli.ts tools echo "hello"
pnpm tsx src/cli.ts tools echo "hello" --json

pnpm tsx src/cli.ts tools add 1 2
pnpm tsx src/cli.ts tools add 1 2 --json
```

デフォルト出力は人間が読みやすい形式です。`--json` はスクリプト向けの安定した構造化 JSON を返します。

## 新しい domain tool を追加する

1. `src/domain/tools/my-tool.ts` を作成し、次を含めます。
   - Zod input schema
   - input/output types
   - metadata
   - 純粋なビジネス関数
2. `src/domain/tools/index.ts` からエクスポートし、`domainTools` に追加します。
3. その tool をターミナルから使えるようにする場合は、`src/adapters/cli/commands/tools.ts` に CLI command を追加します。
4. MCP adapter は `domainTools` から tools を登録するため、tool を registry に追加すると MCP 経由で自動的に公開されます。
5. 新しい動作に対して domain、CLI、smoke tests を追加します。

## 品質チェック

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:smoke
```

## テンプレートから新しい MCP プロジェクトを作成する

1. この Gitea template から新しいリポジトリを作成します。
2. `package.json` の package 名を変更します。
3. `echo` と `add` を実際の domain tools に置き換えます。
4. `README.md` を更新し、新しい tools のドキュメントを追加します。
5. 公開前にすべての品質チェックを実行します。
