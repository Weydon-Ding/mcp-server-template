import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transports: StdioClientTransport[] = [];

afterEach(async () => {
  await Promise.all(transports.map(async (transport) => transport.close()));
  transports.length = 0;
});

describe("stdio MCP transport", () => {
  it("calls the add tool over stdio", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/cli.ts", "mcp", "stdio"],
    });
    transports.push(transport);

    const client = new Client({ name: "stdio-smoke-test", version: "0.1.0" });
    await client.connect(transport);

    const result = await client.callTool({ name: "add", arguments: { a: 2, b: 3 } });

    expect(result.content).toEqual([{ type: "text", text: JSON.stringify({ result: 5 }) }]);
    await client.close();
  });
});
