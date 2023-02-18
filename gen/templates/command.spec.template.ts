import { dirname, fromFileUrl, relative } from "path";
import { fileURLtoKeyName } from "../../utils/fileURLtoKeyName.ts";
import { relativeURL } from "./relativeURL.ts";

const EOL = "\n";
const template = (...lines: string[]) => lines.join(EOL);

interface Props {
  out: URL;
  fileToTest: URL;
}

export default (props: Props) => {
  const commandDataTypeModuleRelativePath = relativeURL(
    new URL("./", props.out),
    props.fileToTest,
  );

  const className = fileURLtoKeyName(props.fileToTest);

  return template(
    `import ${className} from ${
      Deno.inspect(commandDataTypeModuleRelativePath)
    };`,
    ``,
    `Deno.test(${Deno.inspect(className)}, () => {`,
    `  // Your test here`,
    `})`,
    ``,
  );
};
