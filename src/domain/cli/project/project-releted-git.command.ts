import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class ProjectReletedGitCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler(_args: string[]): Promise<void> {
    throw new Error(`Not implemented yet`);
  }
}
