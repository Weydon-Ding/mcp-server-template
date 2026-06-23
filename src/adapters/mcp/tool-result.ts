export type McpTextResult = {
  content: [{ type: "text"; text: string }];
  isError?: boolean;
};

export function toMcpTextResult(text: string): McpTextResult {
  return { content: [{ type: "text", text }] };
}

export function toMcpJsonTextResult(value: unknown): McpTextResult {
  return toMcpTextResult(JSON.stringify(value));
}

export function toMcpErrorResult(message: string): McpTextResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
