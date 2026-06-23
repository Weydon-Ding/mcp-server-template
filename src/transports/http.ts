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

  app.post(
    "/mcp",
    (req: Request, res: Response, next) => {
      if (!isAuthorized(req, config.token)) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }

      next();
    },
    express.json({ limit: "1mb" }),
    async (req: Request, res: Response) => {
      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport();
      const closeTransport = (): void => {
        void transport.close();
        void server.close();
      };

      res.once("close", closeTransport);

      try {
        await server.connect(transport as Transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        res.off("close", closeTransport);
        closeTransport();
        throw error;
      }
    },
  );

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
