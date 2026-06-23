import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createHttpApp } from "../../src/transports/http.js";

const servers: Server[] = [];

async function listen(token?: string): Promise<{ url: URL; close: () => Promise<void> }> {
  const config =
    token === undefined ? { host: "127.0.0.1", port: 0 } : { host: "127.0.0.1", port: 0, token };
  const app = createHttpApp(config);
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return {
    url: new URL(`http://127.0.0.1:${address.port}/mcp`),
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
});

describe("Streamable HTTP MCP transport", () => {
  it("calls the echo tool over HTTP", async () => {
    const server = await listen();
    const transport = new StreamableHTTPClientTransport(server.url);
    const client = new Client({ name: "http-smoke-test", version: "0.1.0" });

    await client.connect(transport as Transport);
    const result = await client.callTool({ name: "echo", arguments: { text: "hello" } });

    expect(result.content).toEqual([{ type: "text", text: JSON.stringify({ text: "hello" }) }]);
    await client.close();
    await server.close();
  });

  it("rejects requests without a configured bearer token", async () => {
    const server = await listen("secret-token");

    const response = await fetch(server.url, { method: "POST", body: "{}" });

    expect(response.status).toBe(401);
    await server.close();
  });

  it("rejects unauthenticated malformed JSON before parsing the body", async () => {
    const server = await listen("secret-token");

    const response = await fetch(server.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(401);
    await server.close();
  });

  it("allows requests with the configured bearer token", async () => {
    const server = await listen("secret-token");
    const transport = new StreamableHTTPClientTransport(server.url, {
      requestInit: { headers: { Authorization: "Bearer secret-token" } },
    });
    const client = new Client({ name: "http-auth-smoke-test", version: "0.1.0" });

    await client.connect(transport as Transport);
    const result = await client.callTool({ name: "add", arguments: { a: 4, b: 6 } });

    expect(result.content).toEqual([{ type: "text", text: JSON.stringify({ result: 10 }) }]);
    await client.close();
    await server.close();
  });
});
