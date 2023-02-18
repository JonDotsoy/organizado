import { cliffyPrompt } from "../../../../deeps.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export class ProjectEditCommand implements CommandType {
  constructor(readonly workspace: WorkspaceModule) { }

  async handler([projectId]: string[]) {
    const { projectGen } = await this.workspace.selectProject(projectId)
    const project = projectGen.getSnap()
    const changes = await cliffyPrompt.prompt([
      {
        type: cliffyPrompt.Input,
        name: "title",
        message: "Title",
        default: project.title ?? undefined,
      }
    ])

    if (changes.title) projectGen.pushEvent("UpdateTitle", { title: changes.title })
  }
}
