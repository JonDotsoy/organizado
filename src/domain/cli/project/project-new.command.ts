import { cliffy_prompt } from "../../../../deeps.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

export default class ProjectNewCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}
  async handler(_args: string[]) {
    const res = await cliffy_prompt.prompt([
      {
        type: cliffy_prompt.Input,
        message: "Choice a title",
        name: "title",
      },
    ]);

    const project = await this.workspace.createProject();

    if (res.title) {
      project.pushEvent("UpdateTitle", { title: res.title });
    }
  }
}
