# Claude 模板配置基线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现公开模板的 Claude Code 配置基线，让模板可被 Claude 正确理解、可通过 MCP stdio 启动，并默认避开 secrets、依赖、缓存和构建产物。

**Architecture:** 采用仓库级、最小化配置：`CLAUDE.md` 提供项目指导，`.mcp.json` 提供 MCP server 发现入口，`.env.example` 记录安全环境变量示例，`.claude/settings.json` 只做 deny-only 访问保护，`.gitignore` 保证本地敏感文件不被提交。所有执行入口仍以 `package.json` scripts 为准，不新增 `.claude/commands/`、`.claude/skills/` 或 hooks。

**Tech Stack:** Node.js 20+、pnpm、TypeScript、Claude Code repository settings、MCP stdio、Git ignore rules。

## Global Constraints

- 使用 Node.js 20 或更新版本。
- 使用 `pnpm` 作为 package manager。
- `CLAUDE.md`、`.mcp.json`、`.env.example`、`.claude/settings.json` 是应提交的公开模板配置。
- `.claude/settings.json` 必须是 deny-only；不得包含 hooks、allowlists、statusline、keybindings、model preference、environment secrets 或本机路径。
- `.gitignore` 必须忽略 `.env`、`.env.*` 和 `.claude/settings.local.json`，同时保留 `.env.example`。
- 不添加 `.claude/commands/`、`.claude/skills/`、hooks、permissions allowlist、statusline、keybindings 或 model preference。
- `.mcp.json` 不得包含 secrets、私有 URLs、绝对路径、用户名或本机假设。
- 代码、命令、路径、配置项、API 名称保持英文原文；说明文档默认中文。

---

## File Structure

- Modify/Create: `CLAUDE.md`
  - 仓库级 Claude Code 指导文件，说明 Node/pnpm 要求、常用命令、MCP entry points、HTTP 安全规则和架构边界。
- Modify/Create: `.mcp.json`
  - Claude Code MCP server 发现配置，仅使用 `pnpm dev:stdio`，不包含本机路径或 secrets。
- Modify/Create: `.env.example`
  - HTTP transport 的环境变量示例，只包含安全默认值和空 token。
- Create: `.claude/settings.json`
  - 仓库级保护性 Claude settings，只包含 `permissions.deny`。
- Modify: `.gitignore`
  - 忽略本地 secrets、依赖、构建产物、日志和 `.claude/settings.local.json`，并显式保留 `.env.example`。
- Do not create: `.claude/commands/`
  - 不需要；避免与 `package.json` scripts/DevOps 入口重复。
- Do not create: `.claude/skills/`
  - 不需要；避免公开模板引入项目外 workflow 假设。

---

### Task 1: 添加保护性的 Claude settings

**Files:**
- Create: `.claude/settings.json`

**Interfaces:**
- Consumes: spec 中的 deny-only 约束、`.gitignore` 中的构建/缓存/secret 候选项。
- Produces: `.claude/settings.json`，后续任务和 Claude Code 依赖它默认避开 `.env`、`node_modules/**`、`dist/**`、`coverage/**`、`.pnpm-store/**`、`*.tsbuildinfo` 和 `*.log`。

- [ ] **Step 1: 写一个会失败的配置存在性检查**

Run:

```bash
test -f .claude/settings.json
```

Expected before implementation:

```text
FAIL: command exits with status 1 because .claude/settings.json does not exist yet
```

- [ ] **Step 2: 创建 `.claude/settings.json`**

Run:

```bash
mkdir -p .claude
cat > .claude/settings.json <<'JSON'
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
JSON
```

- [ ] **Step 3: 验证 JSON 可解析且是 deny-only**

Run:

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs';
const settings = JSON.parse(fs.readFileSync('.claude/settings.json', 'utf8'));
const deny = settings.permissions?.deny;
if (!Array.isArray(deny)) throw new Error('permissions.deny must be an array');
if ('allow' in (settings.permissions || {})) throw new Error('permissions.allow must not be present');
for (const forbidden of ['hooks', 'statusLine', 'statusline', 'model', 'env']) {
  if (forbidden in settings) throw new Error(`${forbidden} must not be present`);
}
const expected = [
  'Read(.env)',
  'Read(.env.local)',
  'Read(.env.*.local)',
  'Read(node_modules/**)',
  'Read(dist/**)',
  'Read(coverage/**)',
  'Read(.pnpm-store/**)',
  'Read(**/*.tsbuildinfo)',
  'Read(**/*.log)',
];
for (const rule of expected) {
  if (!deny.includes(rule)) throw new Error(`missing deny rule: ${rule}`);
}
if (deny.includes('Read(.env.*)')) throw new Error('Read(.env.*) would block .env.example and must not be used');
console.log('settings.json is valid deny-only config');
NODE
```

Expected:

```text
settings.json is valid deny-only config
```

- [ ] **Step 4: 确认没有创建 commands 或 skills**

Run:

```bash
test ! -d .claude/commands && test ! -d .claude/skills
```

Expected:

```text
PASS: command exits with status 0
```

- [ ] **Step 5: 提交 Task 1**

Run:

```bash
git add .claude/settings.json
git commit -m "chore: add Claude deny settings" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

Expected:

```text
[main <sha>] chore: add Claude deny settings
```

---

### Task 2: 更新 Git ignore 规则以保护本地文件

**Files:**
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 1 的 `.claude/settings.json` deny 规则和 spec 中的本地文件忽略要求。
- Produces: `.gitignore`，保证 `.env`、`.env.*`、`.claude/settings.local.json` 不会误提交，并保证 `.env.example` 保持可提交。

- [ ] **Step 1: 写会失败的 ignore 检查**

Run:

```bash
git check-ignore --no-index .env.local .claude/settings.local.json
```

Expected before implementation:

```text
FAIL: at least .env.local or .claude/settings.local.json is not ignored yet
```

- [ ] **Step 2: 将 `.gitignore` 更新为完整规则**

Replace `.gitignore` with exactly:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
.DS_Store
*.log
.worktrees/
.claude/settings.local.json
```

- [ ] **Step 3: 验证 secrets 和本地 Claude settings 被忽略**

Run:

```bash
git check-ignore --no-index .env .env.local .claude/settings.local.json
```

Expected:

```text
.env
.env.local
.claude/settings.local.json
```

- [ ] **Step 4: 验证 `.env.example` 没有被忽略**

Run:

```bash
if git check-ignore --no-index .env.example >/tmp/env-example-ignore.txt 2>&1; then
  cat /tmp/env-example-ignore.txt
  exit 1
fi
echo '.env.example is not ignored'
```

Expected:

```text
.env.example is not ignored
```

- [ ] **Step 5: 提交 Task 2**

Run:

```bash
git add .gitignore
git commit -m "chore: ignore local Claude and env files" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

Expected:

```text
[main <sha>] chore: ignore local Claude and env files
```

---

### Task 3: 对齐公开模板配置文件内容

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.mcp.json`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `package.json` scripts、spec 中的 MCP/HTTP 配置要求、Task 1/2 的安全边界。
- Produces: 三个公开模板配置文件，后续验证依赖它们提供准确命令、安全默认值和 MCP server discovery。

- [ ] **Step 1: 运行基线一致性检查**

Run:

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs';
const claude = fs.readFileSync('CLAUDE.md', 'utf8');
for (const text of [
  'Use Node.js 20 or newer.',
  'Use pnpm as the package manager.',
  'pnpm typecheck',
  'pnpm lint',
  'pnpm test',
  'pnpm test:smoke',
  'pnpm build',
  'pnpm dev:stdio',
  'pnpm dev:http',
  'Keep domain/business logic in `src/domain/`.',
]) {
  if (!claude.includes(text)) throw new Error(`CLAUDE.md missing: ${text}`);
}
const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
const server = mcp.mcpServers?.['mcp-server-template'];
if (server?.command !== 'pnpm') throw new Error('.mcp.json command must be pnpm');
if (JSON.stringify(server?.args) !== JSON.stringify(['dev:stdio'])) throw new Error('.mcp.json args must be ["dev:stdio"]');
const envExample = fs.readFileSync('.env.example', 'utf8');
if (envExample !== 'MCP_HTTP_HOST=127.0.0.1\nMCP_HTTP_PORT=3000\nMCP_HTTP_TOKEN=\n') {
  throw new Error('.env.example content mismatch');
}
console.log('public Claude template config files are aligned');
NODE
```

Expected before implementation if files are already aligned:

```text
public Claude template config files are aligned
```

Expected before implementation if a file drifted:

```text
FAIL with a message naming the missing or mismatched item
```

- [ ] **Step 2: 如果 Step 1 失败，写入准确的 `CLAUDE.md`**

Replace `CLAUDE.md` with exactly:

```markdown
# CLAUDE.md

This file gives Claude Code concise guidance for working in this repository.

## Environment setup

- Use Node.js 20 or newer.
- Use pnpm as the package manager.
- Install dependencies with:

```bash
pnpm install
```

## Common commands

```bash
pnpm typecheck      # TypeScript type checking
pnpm lint           # ESLint
pnpm format:check   # Prettier check
pnpm test           # Unit tests, excluding MCP smoke tests
pnpm test:smoke     # MCP smoke tests
pnpm build          # Compile to dist/
```

## Development entry points

```bash
pnpm dev:stdio      # Run MCP server over stdio
pnpm dev:http       # Run MCP server over Streamable HTTP
```

The HTTP server defaults to `127.0.0.1:3000` with endpoint `POST /mcp`.

Optional HTTP environment variables:

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

If binding HTTP to a non-local interface, set `MCP_HTTP_TOKEN` or use an authenticated reverse proxy.

## Repository notes

- Keep domain/business logic in `src/domain/`.
- Keep MCP and CLI layers as thin adapters over the domain tools.
- Before completing code changes, prefer running at least `pnpm typecheck`, `pnpm lint`, and the relevant tests.
```

- [ ] **Step 3: 如果 Step 1 失败，写入准确的 `.mcp.json`**

Replace `.mcp.json` with exactly:

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

- [ ] **Step 4: 如果 Step 1 失败，写入准确的 `.env.example`**

Replace `.env.example` with exactly:

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

- [ ] **Step 5: 重新运行基线一致性检查**

Run the same command from Step 1.

Expected:

```text
public Claude template config files are aligned
```

- [ ] **Step 6: 如果 Task 3 产生了文件改动，提交它们**

Run:

```bash
if git diff --quiet -- CLAUDE.md .mcp.json .env.example; then
  echo 'no baseline config changes to commit'
else
  git add CLAUDE.md .mcp.json .env.example
  git commit -m "chore: align Claude template config" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
fi
```

Expected when files were already aligned:

```text
no baseline config changes to commit
```

Expected when files were corrected:

```text
[main <sha>] chore: align Claude template config
```

---

### Task 4: 最终验证并推送 main

**Files:**
- Verify: `CLAUDE.md`
- Verify: `.mcp.json`
- Verify: `.env.example`
- Verify: `.claude/settings.json`
- Verify: `.gitignore`
- Verify absent: `.claude/commands/`
- Verify absent: `.claude/skills/`

**Interfaces:**
- Consumes: Task 1、Task 2、Task 3 的配置结果。
- Produces: 已验证并推送的 `main` 分支。

- [ ] **Step 1: 验证没有禁止项被创建或提交**

Run:

```bash
test ! -d .claude/commands
test ! -d .claude/skills
if git ls-files --error-unmatch .claude/settings.local.json >/dev/null 2>&1; then
  echo '.claude/settings.local.json must not be tracked'
  exit 1
fi
echo 'no commands, skills, or tracked local settings'
```

Expected:

```text
no commands, skills, or tracked local settings
```

- [ ] **Step 2: 验证 `.mcp.json` 没有本机路径或 secret-like 字段**

Run:

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs';
const raw = fs.readFileSync('.mcp.json', 'utf8');
const forbidden = [/\/Users\//, /[A-Za-z]:\\/, /token/i, /secret/i, /api[_-]?key/i, /password/i, /http:\/\//, /https:\/\//];
for (const pattern of forbidden) {
  if (pattern.test(raw)) throw new Error(`.mcp.json contains forbidden pattern: ${pattern}`);
}
const parsed = JSON.parse(raw);
if (parsed.mcpServers['mcp-server-template'].command !== 'pnpm') throw new Error('unexpected MCP command');
console.log('.mcp.json is portable and secret-free');
NODE
```

Expected:

```text
.mcp.json is portable and secret-free
```

- [ ] **Step 3: 运行格式检查**

Run:

```bash
pnpm format:check
```

Expected:

```text
PASS: Prettier reports all matched files use correct formatting
```

- [ ] **Step 4: 运行 TypeScript 检查**

Run:

```bash
pnpm typecheck
```

Expected:

```text
PASS: TypeScript exits with status 0
```

- [ ] **Step 5: 运行 lint**

Run:

```bash
pnpm lint
```

Expected:

```text
PASS: ESLint exits with status 0
```

- [ ] **Step 6: 运行测试**

Run:

```bash
pnpm test
```

Expected:

```text
PASS: Vitest exits with status 0 for unit tests excluding MCP smoke tests
```

- [ ] **Step 7: 运行 MCP smoke tests**

Run:

```bash
pnpm test:smoke
```

Expected:

```text
PASS: Vitest exits with status 0 for tests/mcp
```

- [ ] **Step 8: 检查工作区和提交历史**

Run:

```bash
git status --short
git log --oneline -5
```

Expected:

```text
git status --short prints no output
recent commits include the Task 1 and Task 2 commits, plus Task 3 if it changed files
```

- [ ] **Step 9: 推送 main**

Run:

```bash
git push origin main
```

Expected:

```text
main -> main
```

---

## Self-Review

- Spec coverage: `CLAUDE.md`、`.mcp.json`、`.env.example`、`.claude/settings.json`、`.gitignore`、不添加 commands/skills/hooks/allowlist/statusline/keybindings/model preference 均有对应任务。
- Placeholder scan: 本计划已检查常见占位符、延后实现措辞、跨任务省略引用和未展开的笼统处理要求。
- Type/config consistency: `.mcp.json` server name、`pnpm dev:stdio`、`.env.example` 三个变量、`.claude/settings.json` deny rules、`.gitignore` 保留 `.env.example` 的规则在所有任务中保持一致。
