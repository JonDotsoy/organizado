import { colors } from "../../../../deeps.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class TaskSelectCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler([taskId]: string[]): Promise<void> {
    if (!taskId) throw new Error("Missing <task_id> argument");
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) {
      throw new Error("Project not selected");
    }
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );
    const taskGen = await projectWorkspace.selectTask(taskId);
    const task = taskGen.getSnap();
    configuration.task_selected = task.id;
    await this.workspace.putConfiguration(configuration);
    console.log(
      `Task ${colors.yellow(task.id)} ${
        colors.blue(task.title ?? "")
      } selected`,
    );
  }
}
