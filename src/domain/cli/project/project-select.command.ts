import { Configuration } from "../../../../dto/configuration.dto.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class ProjectSelectCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler([projectId]: string[]) {
    const project = await this.workspace.selectProject(projectId);
    const configuration = await this.workspace.getConfiguration();
    configuration.project_selected = project.projectGen.getSnap().id;
    configuration.task_selected = undefined;
    await this.workspace.putConfiguration(configuration);
  }
}
