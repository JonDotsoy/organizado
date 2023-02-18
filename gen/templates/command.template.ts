import { fileURLtoKeyName } from "../../utils/fileURLtoKeyName.ts";
import { relativeURL } from "./relativeURL.ts";

const EOL = "\n";
const template = (...lines: string[]) => lines.join(EOL);

interface Props {
  out: URL;
}

export default (props: Props) => {
  const commandDataTypeModule = new URL(
    "../../src/domain/cli/command/command.data-type.ts",
    import.meta.url,
  );
  const commandDataTypeModuleRelativePath = relativeURL(
    new URL("./", props.out),
    commandDataTypeModule,
  );

  const className = fileURLtoKeyName(props.out);

  return template(
    `import { CommandType } from ${
      Deno.inspect(commandDataTypeModuleRelativePath)
    };`,
    ``,
    `export default class ${className} implements CommandType {`,
    `  async handler(_args: string[]): Promise<void> {`,
    `    throw new Error(\`Not implemented yet\`)`,
    `  }`,
    `}`,
    ``,
  );
};
