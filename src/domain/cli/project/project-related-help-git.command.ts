import { template } from "../../../../utils/template.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class ProjectRelatedHelpGitCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler(_args: string[]): Promise<void> {
    console.log(template(
      `Usage: organizado project related <command>`,
      ``,
      `Command:`,
      `  link <url>         Related the project with a url`,
      `  git [git-url]      Related the project with a git project o self directory`,
    ));
  }
}
