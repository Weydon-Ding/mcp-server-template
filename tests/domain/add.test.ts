import { describe, expect, it } from "vitest";
import { addInputSchema, runAdd } from "../../src/domain/tools/add.js";

describe("add tool", () => {
  it("returns the sum of two numbers", async () => {
    await expect(runAdd({ a: 1, b: 2 })).resolves.toEqual({ result: 3 });
  });

  it("accepts negative numbers", async () => {
    await expect(runAdd({ a: -2, b: 5 })).resolves.toEqual({ result: 3 });
  });

  it("rejects non-finite numbers", () => {
    const result = addInputSchema.safeParse({ a: Number.NaN, b: 1 });

    expect(result.success).toBe(false);
  });
});
