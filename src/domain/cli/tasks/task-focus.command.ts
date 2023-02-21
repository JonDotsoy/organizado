import { loggedTask } from "../../../../utils/logged-task.ts";
import { consoleInteractive } from "../../../../utils/console-interactive.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";
import {
  cliffy_keypress,
  cliffy_prompt,
  colors,
  ulid,
} from "../../../../deeps.ts";
import { loggedTaskInprogress } from "../../../../utils/logged-task-inprogress.ts";
import { loggedTaskComments } from "../../../../utils/logged-task-comments.ts";
import { template } from "../../../../utils/template.ts";
import { tmpdir } from "../../../../.tmp/index.ts";

const { Confirm, Input, prompt } = cliffy_prompt;
const keypress = cliffy_keypress.keypress;

export default class TaskFocusCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler([taskIdArg]: string[]) {
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) throw new Error("No project selected");
    const taskId = taskIdArg ?? configuration.task_selected;
    if (!taskId) throw new Error("Missing the <task_id> argument");
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );

    const taskGen = await projectWorkspace.selectTask(taskId);
    const task = taskGen.getSnap();
    if (task.archivedAt) throw new Error("Cant focus on a task archived");

    let commentSelected: number = task.comments.size - 1;

    const interf = consoleInteractive(() =>
      template(
        `${loggedTask(null, taskGen.getSnap())}`,
        `${loggedTaskInprogress(taskGen.getSnap())}`,
        loggedTaskComments(taskGen.getSnap(), { commentSelected }),
        ``,
        `Usage:`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} K ${
          colors.gray(`to start timer or stop the timer`)
        }`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} M ${
          colors.gray(`to create a new commnet`)
        }`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} J ${
          colors.gray(`to select prev comment`)
        }`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} L ${
          colors.gray(`to select next comment`)
        }`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} D ${
          colors.gray(`to delete comment selected`)
        }`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} E ${
          colors.gray(`to edit comment selected`)
        }`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} A ${
          colors.gray(`to edit task on editor`)
        }`,
        `  ${colors.cyan(">")} ${colors.gray(`Press`)} ctrl + C ${
          colors.gray(`to close this window`)
        }`,
      )
    );

    for await (const { ctrlKey, key } of keypress()) {
      interf.pause();

      const task = taskGen.getSnap();

      if (key === "a") {
        const tmpfile = new URL(`${task.id}.md`, tmpdir);
        await Deno.writeFile(
          tmpfile,
          new TextEncoder().encode(task.title ?? ""),
        );
        const p = await Deno.run({ cmd: ["code", "-w", tmpfile.pathname] });
        interf.resumen();
        await p.status();
        taskGen.pushEvent("UpdateTitle", {
          title: new TextDecoder().decode(await Deno.readFile(tmpfile)),
        });
        await Deno.remove(tmpfile);
      }

      if (key === "j") commentSelected = Math.max(commentSelected - 1, 0);
      if (key === "l") {
        commentSelected = Math.min(commentSelected + 1, task.comments.size - 1);
      }
      if (key === "d") {
        const { confirm } = await prompt([
          {
            type: Confirm,
            name: "confirm",
            message: "are you sure to remove it comment?",
            default: false,
          },
        ]);
        if (confirm) {
          taskGen.pushEvent("DeleteComment", {
            id: Array.from(task.comments.keys())[commentSelected],
          });
          commentSelected = Math.max(
            0,
            Math.min(commentSelected, task.comments.size - 1),
          );
        }
      }
      if (key === "e") {
        const { newComment } = await prompt([{
          type: Input,
          name: "newComment",
          message: "Write new comment:",
          default: Array.from(task.comments.values())[commentSelected].comment,
        }]);
        if (newComment) {
          taskGen.pushEvent("EditComment", {
            id: Array.from(task.comments.keys())[commentSelected],
            comment: newComment,
          });
        }
      }

      if (key === "k") {
        if (taskGen.getSnap().withTimer) {
          taskGen.pushEvent("StopTimer", { stopTimer: Date.now() });
        } else {
          taskGen.pushEvent("StartTimer", { startTimer: Date.now() });
        }
      }
      if (key === "m") {
        const { newComment } = await prompt([{
          type: Input,
          name: "newComment",
          message: "Write new comment:",
        }]);
        if (newComment) {
          taskGen.pushEvent("CreateComment", {
            id: ulid(),
            comment: newComment,
          });
          commentSelected = task.comments.size - 1;
        }
      }
      if (ctrlKey && key === "c") {
        interf.stop();
        break;
      }

      interf.resumen();
    }
  }
}
