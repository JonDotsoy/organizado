import { CommandType } from "../command/command.data-type.ts";

export class HelpCommand implements CommandType {
  async handler(_args: string[]): Promise<void> {
    console.error(
      "Usage: <CLI>\n",
    );
  }
}
