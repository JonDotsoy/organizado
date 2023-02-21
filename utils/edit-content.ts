import { tmpdir } from "../.tmp/index.ts";
import { colors, ulid } from "../deeps.ts";
import { formatFactory } from "./format.ts";

export class EditContent {
  constructor(
    readonly tmpdirLocation: URL = tmpdir,
  ) {}

  async getEditor(): Promise<string[]> {
    // return ["vim"]
    return ["code", "-w"];
  }

  async open(
    payload: Uint8Array,
    formatStr: "md" | "json" | "yaml" | "txt",
  ): Promise<Uint8Array> {
    const editionId = ulid();
    const format = formatFactory(formatStr.toLowerCase());
    const tmpfile = new URL(format.fileName(editionId), this.tmpdirLocation);
    await Deno.writeFile(tmpfile, payload);
    const editing = await this.getEditor();
    console.log(`${colors.cyan(`Editing with ${editing.join(" ")}...`)}`);
    const p = await Deno.run({ cmd: [...editing, tmpfile.pathname] });
    await p.status();
    const newPayload = await Deno.readFile(tmpfile);
    await Deno.remove(tmpfile);
    return newPayload;
  }
}
