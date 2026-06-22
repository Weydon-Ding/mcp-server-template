import { z } from "zod";

export const echoInputSchema = z.object({
  text: z.string().min(1, "text must not be empty").describe("Text to echo back"),
});

export type EchoInput = z.infer<typeof echoInputSchema>;

export type EchoOutput = {
  text: string;
};

export const echoTool = {
  name: "echo",
  title: "Echo",
  description: "Return the provided text unchanged.",
  inputSchema: echoInputSchema,
} as const;

export async function runEcho(input: EchoInput): Promise<EchoOutput> {
  const parsed = echoInputSchema.parse(input);
  return { text: parsed.text };
}
