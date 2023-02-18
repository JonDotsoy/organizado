import { Configuration } from "../../../../dto/configuration.dto.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export class ProjectSelectCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule
  ) { }

  async handler([projectId]: string[]) {
    const project = await this.workspace.selectProject(projectId)
    const configuration = await this.workspace.getConfiguration()
    configuration.project_selected = projectId
    await this.workspace.putConfiguration(configuration)
  }
}
