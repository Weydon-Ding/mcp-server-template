import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/domain/errors.js";
import { parseHttpConfig } from "../../src/config/http.js";

describe("parseHttpConfig", () => {
  it("uses defaults when options and environment are absent", () => {
    const config = parseHttpConfig({}, {});

    expect(config).toEqual({ host: "127.0.0.1", port: 3000 });
  });

  it("prefers CLI host and port over environment values", () => {
    const config = parseHttpConfig(
      { host: "0.0.0.0", port: "8080" },
      { MCP_HTTP_HOST: "127.0.0.1", MCP_HTTP_PORT: "3000", MCP_HTTP_TOKEN: "secret" },
    );

    expect(config).toEqual({ host: "0.0.0.0", port: 8080, token: "secret" });
  });

  it("rejects invalid ports", () => {
    expect(() => parseHttpConfig({ port: "65536" }, {})).toThrow(DomainError);
    expect(() => parseHttpConfig({ port: "65536" }, {})).toThrow("Invalid MCP HTTP port: 65536");
  });
});
