export interface CommandType {
  handler: (args: string[]) => Promise<void>;
}
