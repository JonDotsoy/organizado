import { CommandType } from "../command/command.data-type.ts";

export default class TaskFocusCommand implements CommandType {
  async handler(_args: string[]) {
    console.log(_args);
  }
}
