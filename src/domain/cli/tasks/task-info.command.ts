import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";
import { flags, yaml as YAML } from "../../../../deeps.ts";
const { parse } = flags;

export default class TaskInfoCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler(args: string[]): Promise<void> {
    const { _: [taskId], format = "json" } = parse(args, {
      string: ["format"],
      alias: { format: "f" },
    });
    if (typeof taskId !== "string") {
      throw new Error("Missing <task_id> argument");
    }

    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) {
      throw new Error("Project is not selected");
    }
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );
    const taskGen = await projectWorkspace.selectTask(taskId);

    switch (format.toLowerCase()) {
      case "json":
        return console.log(JSON.stringify(taskGen.getSnap(), null, 2));
      case "yaml":
        return console.log(YAML.stringify(taskGen.getSnap()));
    }
  }
}
