import { colors, flags, yaml as YAML } from "../../../deeps.ts";
import { WorkspaceModule } from "../workspace/workspace.module.ts";
import { CommandType } from "./command/command.data-type.ts";

export default class ConfigCommand implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  async handler(args: string[]): Promise<void> {
    const { json, yaml } = flags.parse(args, {
      boolean: ["json", "yaml"],
      alias: { json: "j", yaml: "y" },
    });
    const configuration = await this.workspace.getConfiguration();

    if (json) return console.log(JSON.stringify(configuration, null, 2));
    if (yaml) return console.log(YAML.stringify(configuration));

    console.log(
      `${colors.blue("project_selected")} = ${
        colors.green(Deno.inspect(configuration.project_selected))
      }`,
    );
    console.log(
      `${colors.blue("task_selected")}    = ${
        colors.green(Deno.inspect(configuration.task_selected))
      }`,
    );
  }
}
