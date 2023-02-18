import { cliffyPrompt } from "../../../../deeps.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class TaskEditCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}
  async handler([taskId]: string[]) {
    if (!taskId) throw new Error("Missing the <task_id> argument");
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) {
      throw new Error("Not found a project selected");
    }
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );
    const taskGen = await projectWorkspace.selectTask(taskId);
    const task = taskGen.getSnap();

    const changes = await cliffyPrompt.prompt([
      {
        type: cliffyPrompt.Input,
        name: "title",
        message: "Title",
        default: task.title ?? undefined,
      },
    ]);

    if (changes.title) {
      taskGen.pushEvent("UpdateTitle", { title: changes.title });
    }
  }
}
