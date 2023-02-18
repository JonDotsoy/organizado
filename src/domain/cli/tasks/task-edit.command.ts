import { CommandType } from "../command/command.data-type.ts";

export class TaskEditCommand implements CommandType {
  async handler(_args: string[]) {
    console.log(_args);
  }
}
