#!/usr/bin/env node
import { Command } from "commander";
import { createToolsCommand, type Output } from "./adapters/cli/commands/tools.ts";
import { startHttpTransport } from "./transports/http.ts";
import { startStdioTransport } from "./transports/stdio.ts";

const output: Output = {
  writeStdout(text: string): void {
    process.stdout.write(`${text}\n`);
  },
  writeStderr(text: string): void {
    process.stderr.write(`${text}\n`);
  },
  exit(code: number): never {
    process.exit(code);
  },
};

export function buildCliProgram(): Command {
  const program = new Command();

  program.name("mcp-server-template").description("Reusable TypeScript MCP server template").version("0.1.0");

  const mcp = new Command("mcp").description("Start MCP transports");

  mcp
    .command("stdio")
    .description("Start MCP server over stdio")
    .action(async () => {
      await startStdioTransport();
    });

  mcp
    .command("http")
    .description("Start MCP server over Streamable HTTP")
    .option("--host <host>", "Host to bind")
    .option("--port <port>", "Port to bind")
    .action(async (options: { host?: string; port?: string }) => {
      await startHttpTransport({ host: options.host, port: options.port });
    });

  program.addCommand(mcp);
  program.addCommand(createToolsCommand(output), { isDefault: true });

  return program;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildCliProgram().parseAsync(process.argv);
}
