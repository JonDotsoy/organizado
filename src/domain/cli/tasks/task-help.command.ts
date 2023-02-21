import { CommandType } from "../command/command.data-type.ts";

const EOL = "\n";
const template = (...lines: string[]) => lines.join(EOL);

export default class TaskHelpCommand implements CommandType {
  async handler(_args: string[]): Promise<void> {
    console.log(
      template(
        `Usage: organizado task [command]`,
        `       organizado t [command]`,
        ``,
        `Command:`,
        `  list               List the tasks`,
        `  new                Create a new task`,
        `  edit <task_id>     Edit task`,
        `  info <task_id>     Info task`,
        `  archive <task_id>  Archive task`,
        `  delete <task_id>   Delete archived task`,
        `  focus <task_id>    Start mode focus task`,
      ),
    );
  }
}
