import { readline, ReadLineOptions } from "./readline.ts";

export interface ReadFileOptions {
  readlineOptions?: ReadLineOptions;
}

export async function* readFile(
  location: string | URL,
  options?: ReadFileOptions,
) {
  const file = await Deno.open(location);

  for await (const line of readline(file, options?.readlineOptions)) {
    if (line.length) yield JSON.parse(new TextDecoder().decode(line));
  }

  file.close();
}
