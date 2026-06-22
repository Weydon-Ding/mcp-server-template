export type HttpCliOptions = {
  host?: string;
  port?: string;
};

export async function startHttpTransport(_options: HttpCliOptions = {}): Promise<void> {
  throw new Error("http transport is not implemented yet");
}
