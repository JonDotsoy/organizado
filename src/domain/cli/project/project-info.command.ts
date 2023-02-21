import { colors } from "../../../../deeps.ts";
import { consoleInteractive } from "../../../../utils/console-interactive.ts";
import { template } from "../../../../utils/template.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class ProjectInfoCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler(_args: string[]): Promise<void> {
    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) throw new Error("No project selected");
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );
    const projectGen = projectWorkspace.projectGen;
    const project = projectGen.getSnap();

    // console.log(JSON.stringify(project, null, 2))

    const { blue, yellow, gray } = colors;
    console.log(template(
      `ID: ${yellow(project.id)} ${project.title}`,
      project.cratedAt
        ? `Created at: ${
          project.cratedAt.toLocaleString(undefined, {
            dateStyle: "full",
            timeStyle: "full",
          })
        }`
        : null,
      project.updatedAt
        ? `Created at: ${
          project.updatedAt.toLocaleString(undefined, {
            dateStyle: "full",
            timeStyle: "full",
          })
        }`
        : null,
      `${gray(`Location: ${project.location}`)}`,
      `Related:`,
      ...Array.from(project.related).map((url) =>
        ` ${gray(`-`)} ${blue(url.toString())}`
      ),
      `Tasks:`,
      ...Array.from(project.tasks.keys()).map((key) =>
        ` ${gray(`-`)} ${blue(key)}`
      ),
    ));
  }
}
