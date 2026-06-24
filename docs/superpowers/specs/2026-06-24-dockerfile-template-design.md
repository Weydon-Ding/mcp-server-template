# Dockerfile Template Design

## Purpose

Add Docker support to the MCP server template for the primary container use case: deploying the Streamable HTTP transport. The template should make HTTP deployment straightforward without presenting Docker as the recommended path for stdio MCP usage.

## Scope

This change adds:

- A root-level `Dockerfile` for building a production image.
- A root-level `.dockerignore` to keep the build context small and safe.
- README documentation for building and running the HTTP server container.

This change does not add Docker Compose, registry publishing, or a first-class Docker stdio workflow.

## Default Container Behavior

The image defaults to running the HTTP MCP transport:

```bash
node dist/cli.js mcp http
```

The container should set HTTP-friendly defaults:

```env
NODE_ENV=production
MCP_HTTP_HOST=0.0.0.0
MCP_HTTP_PORT=3000
```

The application source defaults remain unchanged. Local non-container runs continue to bind to `127.0.0.1` unless the user overrides the host.

The Dockerfile exposes port `3000` and uses the existing CLI entrypoint rather than introducing a separate server script.

## Dockerfile Strategy

Use a multi-stage Dockerfile based on Node 20 slim images:

1. Install all dependencies with pnpm using the lockfile.
2. Copy source and TypeScript configuration.
3. Run the existing `pnpm build` script to produce `dist/`.
4. Create a runtime image containing only production dependencies, `package.json`, and `dist/`.

For clarity in a template repository, the runtime stage should install production dependencies with pnpm from `package.json` and `pnpm-lock.yaml`, then copy `dist/` from the build stage. This may install dependencies twice during the image build, but the Dockerfile remains easy for users to understand and customize.

## Docker Ignore Rules

Add `.dockerignore` entries for local and generated content that should not be sent to Docker builds:

```text
.git
node_modules
dist
coverage
.env
.env.*
```

Do not ignore `.env.example`; it is part of the template documentation.

## README Updates

Add a Docker section near the HTTP transport documentation. It should show:

```bash
docker build -t mcp-server-template .

docker run --rm -p 3000:3000 \
  -e MCP_HTTP_HOST=0.0.0.0 \
  -e MCP_HTTP_TOKEN=change-me \
  mcp-server-template
```

The section should mention:

- The default endpoint remains `POST http://127.0.0.1:3000/mcp` from the host.
- `MCP_HTTP_TOKEN` should be set when exposing the server beyond trusted local development.
- Docker support is aimed at the HTTP transport. Stdio MCP is still best documented through the direct local command/package-manager path.

## Error Handling and Security

No new runtime error-handling behavior is required. The container uses the existing HTTP configuration and validation.

The documentation should preserve the existing security posture: if the HTTP server is bound to a non-local interface or made reachable outside the host, users should set `MCP_HTTP_TOKEN` or place the server behind an authenticated reverse proxy.

## Testing and Verification

After implementation, run the existing project checks:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:smoke
```

Also verify the Docker path:

```bash
docker build -t mcp-server-template .
docker run --rm -d \
  --name mcp-server-template-smoke \
  -p 3000:3000 \
  -e MCP_HTTP_HOST=0.0.0.0 \
  -e MCP_HTTP_TOKEN=test-token \
  mcp-server-template
```

Then confirm the HTTP MCP endpoint is reachable with the configured bearer token, and remove the smoke-test container.
