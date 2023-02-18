import { readline } from "https://deno.land/x/readline@v1.1.0/mod.ts";

export async function* readFile(location: string | URL) {
  const file = await Deno.open(location);

  for await (const line of readline(file)) {
    if (line.length) yield JSON.parse(new TextDecoder().decode(line));
  }

  file.close();
}
