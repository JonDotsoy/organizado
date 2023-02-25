import { bytes } from "../deeps.ts";

const {
  concat,
  indexOfNeedle,
} = bytes;

// const l = await Deno.open(".l", { append: true })

// const log = (data: any) => l.write(new TextEncoder().encode(`${Deno.pid}: ${Date.now()}:: ${Deno.inspect(data)} \n`))

export class ContinueController {
  private abortController = new AbortController();
  continue() {
    this.abortController.abort();
  }
  async waitToContinue() {
    if (this.abortController.signal.aborted) return;
    await new Promise<any>((done) => {
      this.abortController.signal.addEventListener("abort", done);
    });
  }
}

export interface ReadLineOptions {
  separator?: Uint8Array;
  continue?: ContinueController;
  continueWatch?: boolean;
}

export async function* readline(file: Deno.FsFile, options?: ReadLineOptions) {
  const separator = options?.separator ?? new Uint8Array([10]);
  const buf = new Uint8Array(256);
  const continueWatch = options?.continueWatch ?? false;
  // log(`Open readline for rid:${file.rid} - continueWatch ${continueWatch}`)
  let accumulator = new Uint8Array([]);

  while (true) {
    const n = await file.read(buf);
    if (n === null) {
      options?.continue?.continue();
      if (!continueWatch) {
        // log(`Break`)
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    accumulator = concat(accumulator, buf.subarray(0, n));

    let f: number;
    while ((f = indexOfNeedle(accumulator, separator), f >= 0)) {
      yield accumulator.subarray(0, f);
      accumulator = accumulator.subarray(f + separator.length);
    }
  }
}
