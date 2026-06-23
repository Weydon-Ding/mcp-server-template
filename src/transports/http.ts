import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Express, type Request, type Response } from "express";
import { createMcpServer } from "../adapters/mcp/create-server.js";
import { parseHttpConfig, type HttpConfig, type HttpConfigOptions } from "../config/http.js";

export type HttpCliOptions = HttpConfigOptions;

function isAuthorized(req: Request, token: string | undefined): boolean {
  if (!token) {
    return true;
  }
  return req.header("authorization") === `Bearer ${token}`;
}

export function createHttpApp(config: HttpConfig): Express {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.post("/mcp", async (req: Request, res: Response) => {
    if (!isAuthorized(req, config.token)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport();

    try {
      await server.connect(transport as Transport);
      await transport.handleRequest(req, res, req.body);
    } finally {
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    }
  });

  return app;
}

export async function startHttpTransport(options: HttpCliOptions = {}): Promise<void> {
  const config = parseHttpConfig(options);

  if (config.host === "0.0.0.0" && !config.token) {
    process.stderr.write(
      "WARNING: MCP HTTP server is binding to 0.0.0.0 without MCP_HTTP_TOKEN. Use only on trusted networks.\n",
    );
  }

  const app = createHttpApp(config);
  await new Promise<void>((resolve) => {
    app.listen(config.port, config.host, () => {
      process.stderr.write(
        `MCP HTTP server listening on http://${config.host}:${config.port}/mcp\n`,
      );
      resolve();
    });
  });
}
