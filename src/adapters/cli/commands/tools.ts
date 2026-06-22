import { Command } from "commander";
import { ZodError } from "zod";
import { runAdd } from "../../../domain/tools/add.js";
import { runEcho } from "../../../domain/tools/echo.js";
import { toCliError } from "../errors.js";
import { formatJsonError, formatJsonSuccess } from "../format.js";

export type Output = {
  writeStdout(text: string): void;
  writeStderr(text: string): void;
  exit(code: number): never;
};

function parseCliNumber(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ZodError([
      {
        code: "custom",
        path: [name],
        message: `${name} must be a finite number`,
      },
    ]);
  }
  return parsed;
}

function handleError(error: unknown, json: boolean, output: Output): never {
  const cliError = toCliError(error);

  if (json) {
    output.writeStdout(formatJsonError(cliError.code, cliError.message));
  } else {
    output.writeStderr(`${cliError.code}: ${cliError.message}`);
  }

  return output.exit(cliError.exitCode);
}

export function createToolsCommand(output: Output): Command {
  const tools = new Command("tools").description("Run business tools directly from the CLI");

  tools
    .command("echo")
    .description("Return the provided text unchanged")
    .argument("<text>", "Text to echo")
    .option("--json", "Print structured JSON output")
    .action(async (text: string, options: { json?: boolean }) => {
      const json = options.json === true;
      try {
        const result = await runEcho({ text });
        output.writeStdout(json ? formatJsonSuccess(result) : result.text);
      } catch (error) {
        handleError(error, json, output);
      }
    });

  tools
    .command("add")
    .description("Add two numbers")
    .argument("<a>", "First number")
    .argument("<b>", "Second number")
    .option("--json", "Print structured JSON output")
    .action(async (a: string, b: string, options: { json?: boolean }) => {
      const json = options.json === true;
      try {
        const result = await runAdd({ a: parseCliNumber(a, "a"), b: parseCliNumber(b, "b") });
        output.writeStdout(json ? formatJsonSuccess(result) : String(result.result));
      } catch (error) {
        handleError(error, json, output);
      }
    });

  return tools;
}
