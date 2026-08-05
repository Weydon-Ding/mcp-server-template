# mcp-server-template

[English](README.md) | [简体中文](README_zh.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md) | **한국어**

재사용 가능한 TypeScript MCP server 템플릿입니다. 세 가지 진입점을 제공합니다.

- stdio 기반 MCP server
- Streamable HTTP 기반 MCP server
- 비즈니스 기능을 직접 호출하는 CLI

이 템플릿은 비즈니스 로직을 `src/domain/`에 두고, 얇은 MCP adapter와 CLI adapter를 통해 해당 기능을 노출합니다.

## 요구 사항

- Node.js 20+
- pnpm

## 설치

```bash
pnpm install
```

## stdio 방식으로 MCP server 실행

```bash
pnpm dev:stdio
```

로컬 MCP client 명령 예시:

```bash
mcp-server-template mcp stdio
```

프로젝트를 빌드한 뒤 사용할 수 있는 Claude Desktop 스타일 server 설정 예시:

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

## Streamable HTTP 방식으로 MCP server 실행

```bash
pnpm dev:http
```

기본 endpoint:

```text
POST http://127.0.0.1:3000/mcp
```

host와 port 재정의:

```bash
pnpm tsx src/cli.ts mcp http --host 127.0.0.1 --port 3001
```

## Docker로 실행

`Dockerfile`은 Streamable HTTP transport용입니다.

이미지 빌드:

```bash
docker build -t mcp-server-template .
```

HTTP server 실행:

```bash
docker run --rm -p 3000:3000 \
  -e MCP_HTTP_HOST=0.0.0.0 \
  -e MCP_HTTP_TOKEN=change-me \
  mcp-server-template
```

호스트 endpoint:

```text
POST http://127.0.0.1:3000/mcp
```

신뢰할 수 있는 로컬 개발 환경 밖으로 server를 노출하는 경우 `MCP_HTTP_TOKEN`을 설정하거나, 인증이 적용된 reverse proxy 뒤에 server를 배치하세요.

Docker는 stdio MCP 사용에 권장되는 방식이 아닙니다. stdio 시나리오에서는 직접 로컬 명령 또는 package-manager workflow를 사용하는 것을 권장합니다.

## HTTP 설정

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

설정 우선순위:

1. CLI flags
2. Environment variables
3. Defaults

`MCP_HTTP_TOKEN`이 설정된 경우 요청에는 다음이 포함되어야 합니다.

```http
Authorization: Bearer <token>
```

기본적으로 HTTP server는 `127.0.0.1`에 바인딩되며 token을 요구하지 않습니다. 로컬이 아닌 interface에 바인딩하는 경우 `MCP_HTTP_TOKEN`을 설정하거나, 인증이 적용된 reverse proxy 뒤에 server를 배치하세요.

## 비즈니스 CLI 사용

```bash
pnpm tsx src/cli.ts tools echo "hello"
pnpm tsx src/cli.ts tools echo "hello" --json

pnpm tsx src/cli.ts tools add 1 2
pnpm tsx src/cli.ts tools add 1 2 --json
```

기본 출력은 사람이 읽기 쉬운 형식입니다. `--json`은 스크립트에 적합한 안정적인 구조화 JSON을 반환합니다.

## 새 domain tool 추가

1. `src/domain/tools/my-tool.ts`를 만들고 다음을 포함합니다.
   - Zod input schema
   - input/output types
   - metadata
   - 순수 비즈니스 함수
2. `src/domain/tools/index.ts`에서 export하고 `domainTools`에 추가합니다.
3. 이 tool을 터미널에서 사용할 수 있어야 한다면 `src/adapters/cli/commands/tools.ts`에 CLI command를 추가합니다.
4. MCP adapter는 `domainTools`에서 tools를 등록하므로, tool이 registry에 추가되면 MCP를 통해 자동으로 노출됩니다.
5. 새로운 동작에 대한 domain, CLI, smoke tests를 추가합니다.

## 품질 검사

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:smoke
```

## 템플릿에서 새 MCP 프로젝트 만들기

1. 이 Gitea template에서 새 저장소를 만듭니다.
2. `package.json`의 package 이름을 변경합니다.
3. `echo`와 `add`를 실제 domain tools로 교체합니다.
4. `README.md`를 업데이트하여 새 tools 문서를 추가합니다.
5. 게시하기 전에 모든 품질 검사를 실행합니다.
