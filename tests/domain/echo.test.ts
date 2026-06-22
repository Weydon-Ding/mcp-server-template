import { describe, expect, it } from "vitest";
import { echoInputSchema, runEcho } from "../../src/domain/tools/echo.js";

describe("echo tool", () => {
  it("returns the provided text", async () => {
    await expect(runEcho({ text: "hello" })).resolves.toEqual({ text: "hello" });
  });

  it("rejects empty text", () => {
    const result = echoInputSchema.safeParse({ text: "" });

    expect(result.success).toBe(false);
  });
});
