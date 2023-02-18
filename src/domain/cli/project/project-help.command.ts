import { CommandType } from "../command/command.data-type.ts";

export default class ProjectHelpCommand implements CommandType {
  async handler(_args: string[]): Promise<void> {
    throw new Error(`Not implemented yet`)
  }
}
