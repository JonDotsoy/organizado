import { loggedTask } from "../../../../utils/logged-task.ts";
import { consoleInteractive } from "../../../../utils/console-interactive.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";
import { keypress } from "cliffy_keypress";
import * as colors from "colors";
import { loggedTaskInprogress } from "../../../../utils/logged-task-inprogress.ts";
import { durationString } from "../../../../utils/duration-string.ts";

const EOL = "\n";
const template = (...lines: string[]) => lines.join(EOL);

export default class TaskFocusCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler([taskId]: string[]) {
    if (!taskId) throw new Error("Missing the <task_id> argument");
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) throw new Error("No project selected");
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );

    const taskGen = await projectWorkspace.selectTask(taskId);
    let timerStart = Date.now();
    let getTimmerStatus = () => {
      const ms = Date.now() - timerStart;
      return durationString(ms);
    };

    const interf = consoleInteractive(() =>
      template(
        colors.gray(`Focus Timer: ${getTimmerStatus()}`),
        `${loggedTask(null, taskGen.getSnap())}`,
        `${loggedTaskInprogress(taskGen.getSnap())}`,
        ``,
        `Usage:`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} K ${
          colors.gray(`to start timer or stop the timer`)
        }`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} ctrl + C ${
          colors.gray(`to close this window`)
        }`,
      )
    );

    keypress().addEventListener("keydown", ({ ctrlKey, key }) => {
      if (key === "k") {
        if (taskGen.getSnap().withTimer) {
          taskGen.pushEvent("StopTimer", { stopTimer: Date.now() });
        } else {
          taskGen.pushEvent("StartTimer", { startTimer: Date.now() });
        }
      }
      if (ctrlKey && key === "c") {
        keypress().dispose();
        interf.stop();
      }
    });

    // while (true) {
    //   console.clear()
    //   console.log(loggedTask(null, taskGen.getSnap()));
    //   const { ctrlKey, key } = await keypress()
    //   if (key === "q" || (ctrlKey && key === "c")) {
    //     console.log(colors.gray("exit"))
    //     break
    //   }
    // }
  }
}
