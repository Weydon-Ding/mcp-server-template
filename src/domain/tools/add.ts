import { z } from "zod";

export const addInputSchema = z.object({
  a: z.number().finite().describe("First number"),
  b: z.number().finite().describe("Second number"),
});

export type AddInput = z.infer<typeof addInputSchema>;

export type AddOutput = {
  result: number;
};

export const addTool = {
  name: "add",
  title: "Add",
  description: "Add two numbers and return their sum.",
  inputSchema: addInputSchema,
} as const;

export async function runAdd(input: AddInput): Promise<AddOutput> {
  const parsed = addInputSchema.parse(input);
  return { result: parsed.a + parsed.b };
}
