import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class TaskArchiveCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler([taskId]: string[]): Promise<void> {
    if (typeof taskId !== "string") {
      throw new Error("Missing <task_id> argument");
    }
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) {
      throw new Error("Not project selected");
    }
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );
    const taskGen = await projectWorkspace.selectTask(taskId);
    const task = taskGen.getSnap();

    if (task.currentTimer) {
      taskGen.pushEvent("StopTimer", { stopTimer: Date.now() });
    }
    taskGen.pushEvent("Archived", true);
  }
}
