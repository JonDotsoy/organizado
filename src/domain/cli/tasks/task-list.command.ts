import { YAML } from "../../../../deeps.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class TaskListCommand implements CommandType {
  constructor(readonly workspace: WorkspaceModule) {}

  async handler(_args: string[]) {
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) {
      throw new Error(
        "No project selected. Please select with `t p s <project_id>`",
      );
    }
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );

    for await (const taskGen of projectWorkspace.listTasks()) {
      const task = taskGen.getSnap();

      console.log("---");
      console.log(
        YAML.stringify({
          ID: task.id,
          Title: task.title,
          CreatedAt: task.createdAt?.toLocaleString(undefined, {
            dateStyle: "full",
            timeStyle: "full",
          }),
          UpdateAt: task.updatedAt?.toLocaleString(undefined, {
            dateStyle: "full",
            timeStyle: "full",
          }),
        }),
      );
    }
  }
}
