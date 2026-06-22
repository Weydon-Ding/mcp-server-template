### Task 1: Bootstrap TypeScript project configuration

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `prettier.config.js`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/index.ts`

**Interfaces:**

- Consumes: none.
- Produces: package scripts used by all later tasks: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:smoke`, `pnpm build`, `pnpm dev:stdio`, `pnpm dev:http`.

- [x] **Step 1: Write baseline package/config files**

Create `package.json`:

```json
{
  "name": "mcp-server-template",
  "version": "0.1.0",
  "description": "Reusable TypeScript MCP server template with stdio, Streamable HTTP, and CLI entry points.",
  "type": "module",
  "private": false,
  "bin": {
    "mcp-server-template": "./dist/cli.js"
  },
  "files": ["dist", "README.md", ".env.example"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint .",
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "test": "vitest run --exclude 'tests/mcp/**/*.test.ts'",
    "test:smoke": "vitest run tests/mcp",
    "dev:stdio": "tsx src/cli.ts mcp stdio",
    "dev:http": "tsx src/cli.ts mcp http"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "commander": "latest",
    "express": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@eslint/js": "latest",
    "@types/express": "latest",
    "@types/node": "latest",
    "eslint": "latest",
    "prettier": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "typescript-eslint": "latest",
    "vitest": "latest"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - .
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node"],
    "rootDir": ".",
    "outDir": "dist",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": [
    "src/**/*.ts",
    "tests/**/*.ts",
    "vitest.config.ts",
    "eslint.config.js",
    "prettier.config.js"
  ],
  "exclude": ["dist", "node_modules"]
}
```

Create `eslint.config.js`:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
);
```

Create `prettier.config.js`:

```js
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
};
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15_000,
  },
});
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.env
.DS_Store
*.log
.worktrees/
```

Create `.env.example`:

```env
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=
```

Create `src/index.ts`:

```ts
export * from "./domain/tools/index.js";
export * from "./adapters/mcp/create-server.js";
```

- [x] **Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected:

- `pnpm-lock.yaml` is created.
- Command exits with code 0.

- [x] **Step 3: Run baseline checks**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
```

Expected:

- `pnpm typecheck` fails because `src/adapters/mcp/create-server.ts` is not created yet and `src/index.ts` imports it.
- `pnpm lint` may fail for the same missing import.
- `pnpm format:check` passes or reports only files that need formatting.

This expected failure proves the bootstrap is wired to future files.

- [ ] **Step 4: Commit bootstrap**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json eslint.config.js prettier.config.js vitest.config.ts .gitignore .env.example src/index.ts
git commit -m "chore: bootstrap TypeScript project"
```

Expected: commit succeeds.

---

## Fix section

### Review findings addressed

- Restored `src/index.ts` to the exact brief-required re-exports instead of the temporary `export {};` placeholder.
- Changed the lint script in `package.json` from `eslint src` to `eslint .`.
- Removed the unresolved `allowBuilds` placeholder from `pnpm-workspace.yaml` so it now matches the brief exactly.
- Preserved `.worktrees/` in `.gitignore` for the project-local worktree directory.

### Verification run

- `pnpm format:check` failed because `.superpowers/sdd/task-1-report.md` needs formatting.
- `pnpm typecheck` failed as expected because `src/index.ts` imports future files that do not exist yet:
  - `src/domain/tools/index.js`
  - `src/adapters/mcp/create-server.js`
- `pnpm lint` failed, but not because of the missing `src/index.ts` imports; it failed on typed ESLint parsing for config files not included in `tsconfig.json`:
  - `eslint.config.js`
  - `prettier.config.js`

### Commits

- None yet.

### Notes

- The typecheck failure is the expected Task 1 behavior required by the brief.
- The lint failure appears unrelated to the review findings and is a separate config issue already present in the baseline setup.

### Fix report update

- Scoped the type-aware ESLint parser options to TypeScript files only so `eslint .` no longer tries to parse root JavaScript config files with the TypeScript project.
- Ignored `.superpowers/**` in ESLint and Prettier-adjacent project checks so workflow scratch reports are excluded from source formatting/linting.

### Verification

- `pnpm format:check` now passes.
- `pnpm lint` now passes.
- `pnpm typecheck` still fails only because `src/index.ts` imports future files that do not exist yet:
  - `src/domain/tools/index.js`
  - `src/adapters/mcp/create-server.js`
