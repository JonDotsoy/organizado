import { cliffy_prompt } from "../../../../deeps.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class ProjectEditCommand implements CommandType {
  constructor(readonly workspace: WorkspaceModule) {}

  async handler([projectId]: string[]) {
    const { projectGen } = await this.workspace.selectProject(projectId);
    const project = projectGen.getSnap();
    const changes = await cliffy_prompt.prompt([
      {
        type: cliffy_prompt.Input,
        name: "title",
        message: "Title",
        default: project.title ?? undefined,
      },
    ]);

    if (changes.title) {
      projectGen.pushEvent("UpdateTitle", { title: changes.title });
    }
  }
}
