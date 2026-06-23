import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

async function runCli(
  args: string[],
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return await new Promise((resolve) => {
    const child = spawn(process.execPath, ["--import", "tsx", "src/cli.ts", ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("exit", (code) => {
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

describe("tools CLI", () => {
  it("prints human-readable echo output by default", async () => {
    const result = await runCli(["tools", "echo", "hello"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toBe("hello");
    expect(result.stderr).toBe("");
  });

  it("prints JSON echo output with --json", async () => {
    const result = await runCli(["tools", "echo", "hello", "--json"]);

    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ ok: true, data: { text: "hello" } });
  });

  it("prints human-readable add output by default", async () => {
    const result = await runCli(["tools", "add", "1", "2"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toBe("3");
    expect(result.stderr).toBe("");
  });

  it("prints JSON add output with --json", async () => {
    const result = await runCli(["tools", "add", "1", "2", "--json"]);

    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ ok: true, data: { result: 3 } });
  });

  it("returns validation error and exit code 2 for invalid add input", async () => {
    const result = await runCli(["tools", "add", "one", "2", "--json"]);

    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR" },
    });
  });
});
