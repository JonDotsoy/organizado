import { fileURLtoKeyName } from "../../utils/fileURLtoKeyName.ts";
import { relativeURL } from "./relativeURL.ts";

const EOL = "\n";
const template = (...lines: string[]) => lines.join(EOL);

interface Props {
  out: URL;
}

export default (props: Props) => {
  const workspaceModule = new URL(
    "../../src/domain/workspace/workspace.module.ts",
    import.meta.url,
  );
  const commandDataTypeModule = new URL(
    "../../src/domain/cli/command/command.data-type.ts",
    import.meta.url,
  );

  const workspaceModuleRelativePath = relativeURL(
    new URL("./", props.out),
    workspaceModule,
  );
  const commandDataTypeModuleRelativePath = relativeURL(
    new URL("./", props.out),
    commandDataTypeModule,
  );

  const className = fileURLtoKeyName(props.out);

  return template(
    `import { WorkspaceModule } from ${
      Deno.inspect(workspaceModuleRelativePath)
    };`,
    `import { CommandType } from ${
      Deno.inspect(commandDataTypeModuleRelativePath)
    };`,
    ``,
    `export default class ${className} implements CommandType {`,
    `  constructor(`,
    `    readonly workspace: WorkspaceModule,`,
    `  ) {}`,
    ``,
    `  async handler(_args: string[]): Promise<void> {`,
    `    throw new Error(\`Not implemented yet\`);`,
    `  }`,
    `}`,
    ``,
  );
};
