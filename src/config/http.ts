import { DomainError, ErrorCode } from "../domain/errors.js";

export type HttpConfig = {
  host: string;
  port: number;
  token?: string;
};

export type HttpConfigOptions = {
  host?: string;
  port?: string;
};

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new DomainError(ErrorCode.CONFIG_ERROR, `Invalid MCP HTTP port: ${value}`);
  }
  return port;
}

export function parseHttpConfig(
  options: HttpConfigOptions = {},
  env: NodeJS.ProcessEnv = process.env,
): HttpConfig {
  const host = options.host ?? env.MCP_HTTP_HOST ?? "127.0.0.1";
  const port = parsePort(options.port ?? env.MCP_HTTP_PORT ?? "3000");
  const token =
    env.MCP_HTTP_TOKEN && env.MCP_HTTP_TOKEN.length > 0 ? env.MCP_HTTP_TOKEN : undefined;

  return token === undefined ? { host, port } : { host, port, token };
}
