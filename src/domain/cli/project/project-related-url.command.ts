import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class ProjectRelatedUrlCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler([urlString]: string[]): Promise<void> {
    const url = new URL(urlString);
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) throw new Error("No project selected");
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );
    const projectGen = projectWorkspace.projectGen;
    projectGen.pushEvent("RelatedLink", { url });
  }
}
