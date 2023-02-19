import { parse } from "flags";
import { blue } from "colors";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class TaskDeleteCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler([taskId, ...args]: string[]): Promise<void> {
    const { force } = parse(args, { boolean: ["force"] });
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

    if (!task.archivedAt) throw new Error(`The task ${taskId} is not archived`);

    if (force || confirm(`Confirm delete task ${blue(taskId)}?`)) {
      await Deno.remove(task.location);
    }
  }
}
