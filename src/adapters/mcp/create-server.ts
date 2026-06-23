import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDomainTools } from "./register-tools.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "mcp-server-template",
    version: "0.1.0",
  });

  registerDomainTools(server);
  return server;
}
