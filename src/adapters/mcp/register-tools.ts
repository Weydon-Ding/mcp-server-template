import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZodError } from "zod";
import { domainTools } from "../../domain/tools/index.js";
import { toMcpErrorResult, toMcpJsonTextResult } from "./tool-result.js";

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export function registerDomainTools(server: McpServer): void {
  for (const tool of domainTools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema.shape,
      },
      async (input: unknown) => {
        try {
          const parsed = tool.inputSchema.parse(input);
          const result = await tool.run(parsed as never);
          return toMcpJsonTextResult(result);
        } catch (error) {
          return toMcpErrorResult(errorMessage(error));
        }
      },
    );
  }
}
