import commandTemplate from "./templates/command.template.ts";
import commandTestTemplate from "./templates/command.spec.template.ts";
import { flags, path } from "../deeps.ts";

const EOL = "\n";
const template = (...lines: string[]) => lines.join(EOL);
const testsFolder = new URL("../tests/", import.meta.url);
const srcFolder = new URL("../src/", import.meta.url);

const commandHandler = async (args: string[]) => {
  const { _: [relativePath] } = flags.parse(args);

  if (typeof relativePath !== "string") {
    throw new Error("Missing the <relative_path> argument");
  }

  const endFile = new URL(
    `${relativePath}.command.ts`,
    new URL(`${Deno.cwd()}/`, "file:///"),
  );

  if (!endFile.toString().toString().startsWith(srcFolder.toString())) {
    throw new Error(`Is not file incide ${srcFolder}`);
  }

  const endIncideTestFolder = new URL(
    endFile.toString().toString().slice(srcFolder.toString().length),
    testsFolder,
  );

  const endNameFile = `${
    path.basename(path.fromFileUrl(endIncideTestFolder), ".ts")
  }.spec.ts`;
  const endTestFile = new URL(endNameFile, endIncideTestFolder);

  console.log(`? Write ${endFile}`);
  console.log(`? Write ${endTestFile}`);

  const payload = commandTemplate({ out: endFile });
  const payloadSpec = commandTestTemplate({
    out: endTestFile,
    fileToTest: endFile,
  });

  await Deno.mkdir(new URL("./", endFile), { recursive: true });
  await Deno.mkdir(new URL("./", endTestFile), { recursive: true });

  await Deno.writeFile(endFile, new TextEncoder().encode(payload), {});
  await Deno.writeFile(endTestFile, new TextEncoder().encode(payloadSpec), {});

  console.log(`✅ Write ${endFile}`);
  console.log(`✅ Write ${endTestFile}`);
};

const GENCli = () => {
  const [command] = Deno.args;

  switch (command) {
    case "command":
      return commandHandler(Deno.args.slice(1));
  }

  return console.log(
    template(
      `Usage: deno run gen/cli.ts <command>`,
      ``,
      `Commands:`,
      `  command <relative_path>          Generate a command file`,
      ``,
    ),
  );
};

await GENCli();
