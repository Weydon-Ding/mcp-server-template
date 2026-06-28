# Claude 模板配置设计

## 背景

这个仓库是公开的 TypeScript MCP server 模板。模板应该包含足够的 Claude Code 配置，让 agent 能理解项目并安全地工作；同时避免写入用户专属 workflow、凭据、本机路径或令人意外的自动化行为。

## 目标

为模板提供一套最小、安全、适合开源场景的 Claude 配置基线。

这套基线应该：

- 向 Claude Code 说明项目结构和常用命令。
- 让 Claude Code 能发现并通过 stdio 运行模板内的 MCP server。
- 避免 Claude 默认读取真实 secrets 和高噪音生成文件。
- 避免编码个人偏好、团队内部 workflow 或宽松的命令 allowlist。

## 非目标

模板不会预配置：

- 个人 Claude Code 偏好。
- permission allowlist。
- hooks 或隐藏自动化。
- statusline、keybindings、theme 或默认 model preference。
- 个人或私有 MCP servers。
- 真实 token、API keys、私有 endpoints 或本机特定路径。
- 与 `package.json` scripts 重复的项目 slash commands。

## 应提交的文件

公开模板应该提交这些 Claude 相关文件：

```text
CLAUDE.md
.mcp.json
.env.example
.claude/settings.json
```

### `CLAUDE.md`

职责：为 Claude Code 提供仓库级指导。

它应该记录：

- Node.js 20 或更新版本。
- 使用 `pnpm` 作为 package manager。
- 常用命令：
  - `pnpm install`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `pnpm test`
  - `pnpm test:smoke`
  - `pnpm build`
  - `pnpm dev:stdio`
  - `pnpm dev:http`
- MCP development entry points。
- HTTP 环境变量：
  - `MCP_HTTP_HOST`
  - `MCP_HTTP_PORT`
  - `MCP_HTTP_TOKEN`
- HTTP 安全规则：如果绑定到非本地 interface，必须设置 `MCP_HTTP_TOKEN`，或放在带认证的 reverse proxy 后面。
- 架构规则：domain 和 business logic 放在 `src/domain/`；MCP 和 CLI 层保持 thin adapters。
- 完成代码变更前，优先运行 `pnpm typecheck`、`pnpm lint` 和相关 tests。

### `.mcp.json`

职责：让 Claude Code 能发现并启动这个模板作为 MCP server。

推荐内容：

```json
{
  "mcpServers": {
    "mcp-server-template": {
      "command": "pnpm",
      "args": ["dev:stdio"]
    }
  }
}
```

规则：

- 只使用通用命令和相对项目上下文。
- 不包含 tokens、绝对路径、私有 URLs、用户名或本机假设。
- 仓库本地 MCP server entry point 优先使用 stdio。

### `.env.example`

职责：说明支持的环境变量，但不暴露 secrets。

推荐内容：

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

真实 `.env` 文件必须保持本地化，并被 Git 忽略。

### `.claude/settings.json`

职责：提供保护性的仓库级 Claude Code settings。

这个文件应该是 deny-only。它不应该授予权限，也不应该定义个人 workflow。它可以把 `.gitignore` 作为参考输入，但不能机械复制所有 `.gitignore` patterns。

允许放入 deny rules 的范围：

- 本地 secret 文件。
- 依赖目录。
- 构建产物。
- test 和 coverage 输出。
- TypeScript build info 文件。
- logs。

保守草案：

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.local)",
      "Read(.env.*.local)",
      "Read(node_modules/**)",
      "Read(dist/**)",
      "Read(coverage/**)",
      "Read(.pnpm-store/**)",
      "Read(**/*.tsbuildinfo)",
      "Read(**/*.log)"
    ]
  }
}
```

明确不应被 deny 的内容：

```text
.env.example
README.md
docs/**
examples/**
src/**
tests/**
```

deny list 刻意避免宽泛的 `.env.*` 规则，以确保 `.env.example` 仍然可读。

## 应忽略的文件

模板应该忽略本地文件和敏感文件：

```gitignore
.env
.env.*
!.env.example
.claude/settings.local.json
```

`.claude/settings.local.json` 用于每个用户本地的 Claude Code 状态、偏好和 overrides。它不能提交到公开模板。

## `.gitignore` 与 Claude deny 的关系

`.gitignore` 和 Claude deny rules 有重叠，但语义不同：

- `.gitignore` 表示 Git 不应该追踪某个文件。
- Claude deny rules 表示 Claude 默认不应该访问某个文件。

设计上不应该自动把每个 `.gitignore` entry 复制进 `.claude/settings.json`。相反，应该把 `.gitignore` 当作 review checklist，只 deny 明确属于以下类别的 entry：

- Secrets。
- Dependencies。
- Caches。
- Build outputs。
- Coverage/test outputs。
- Logs。

这样可以避免误挡有用文件，例如 `.env.example`、local fixtures、examples、属于模板契约的 generated files，或用户明确希望 Claude 检查的 debugging artifacts。

## Commands 和 skills

这个公开模板不预写 `.claude/commands/` 或 `.claude/skills/`。

原因：

- `package.json` scripts 才是真正的 DevOps 和 verification entry points。
- 在 Claude commands 中重复这些流程会制造第二套维护面。
- 公开模板应该避免隐藏的或 Claude-specific 的 workflow 假设。
- Claude 可以从 `CLAUDE.md` 和 `package.json` 学到应该运行哪些 scripts。

未来项目只有在确实存在无法用 package script 表达、且文档清晰的项目专属 Claude workflow 时，才考虑添加 Claude commands。

## 运行时流程

用户 clone 模板后：

1. Claude Code 读取 `CLAUDE.md`，理解仓库约定。
2. Claude Code 可以通过 `.mcp.json` 使用 `pnpm dev:stdio` 启动 MCP server。
3. Claude Code 避免读取 `.claude/settings.json` 中 deny 的文件。
4. 用户把本地偏好或 overrides 放入 `.claude/settings.local.json`，该文件保持 untracked。
5. 用户把真实环境变量值放入 `.env`，该文件保持 untracked。

## 错误处理和边界情况

### 用户需要 Claude 检查 `dist/`

`dist/**` 默认被 deny，因为它是 generated build output。如果用户正在调试 package publishing 或 compiled output，可以临时调整本地 settings，或明确提供相关文件内容。

### `.env.example` 必须保持可读

deny list 不能包含宽泛的 `.env.*` pattern。应使用更窄的 local-secret patterns，例如 `.env.local` 和 `.env.*.local`。

### `.gitignore` 后续变化

当 `.gitignore` 变化时，只把明确属于 secrets、dependencies、caches、build outputs、test outputs 或 logs 的新增 entry 加入 `.claude/settings.json`。

### 团队需要更强自动化

团队专属 permission allowlists、hooks 或 workflow commands 应放在内部模板或本地 settings 中，不应放入这个公开模板。

## 验证

实现这个设计后，验证：

- `CLAUDE.md` 包含准确的项目命令和架构指导。
- `.mcp.json` 不包含 secrets、私有 URLs、绝对路径或本机特定值。
- `.env.example` 只记录变量名和安全默认值。
- `.gitignore` 忽略 `.env`、`.env.*` 和 `.claude/settings.local.json`，同时保留 `.env.example`。
- `.claude/settings.json` 是 deny-only，不包含 hooks、allowlists、statusline、keybindings、model preference、environment secrets 或本机路径。
- `.env.example` 没有被 Claude settings deny。

建议实现后运行的项目检查：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:smoke
```
