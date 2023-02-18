import { cliffyPrompt } from "../../../../deeps.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export class TaskNewCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler(_args: string[]) {
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) {
      throw new Error("Not project selected");
    }
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );

    const taskGen = await projectWorkspace.createTask();

    const changes = await cliffyPrompt.prompt([
      {
        type: cliffyPrompt.Input,
        name: "title",
        message: "Title",
      },
    ]);
    if (changes.title) {
      taskGen.pushEvent("UpdateTitle", { title: changes.title });
    }
  }
}
