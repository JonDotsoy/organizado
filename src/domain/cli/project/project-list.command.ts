import { YAML } from "../../../../deeps.ts"
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export class ProjectListCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule
  ) { }

  async handler(_args: string[]): Promise<void> {
    const configuration = await this.workspace.getConfiguration()
    for await (const projectWorkspace of this.workspace.listProjects()) {
      const project = projectWorkspace.projectGen.getSnap()
      console.log('---')
      console.log(
        YAML.stringify({
          Selected: project.id === configuration.project_selected ? true : undefined,
          ID: project.id,
          Title: project.title,
          CreatedAt: project.cratedAt?.toLocaleString(undefined, { dateStyle: "full", timeStyle: "full" }),
          UpdatedAt: project.updatedAt?.toLocaleString(undefined, { dateStyle: "full", timeStyle: "full" }),
        })
      )
    }
  }
}
