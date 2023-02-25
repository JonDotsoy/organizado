import { bytes } from "../deeps.ts";

let called = false;
const warn = (): void =>
  !called ? (called = true, console.warn(``)) : undefined;

export class Line {
  constructor(readonly line: string) {}

  static of(str: string) {
    if (str.includes("\n")) warn();
    return new Line(str);
  }
}

export class TerminalUI {
  constructor(
    readonly consoleSize: () => { columns: number; rows: number } =
      (() => Deno.consoleSize()),
  ) {}

  static cleanASCIIColors(buff: Uint8Array) {
    // 27, 91, 52, 52, 109, 0, 0, 0, 0, 0, 0, 27, 91, 52, 57, 109
    //  X   X            Y                     X   X            Y
    const start = new Uint8Array([27, 91]);

    type M = { from: number; at: number };

    const match = (buff: Uint8Array): null | M => {
      const startMatch = bytes.indexOfNeedle(buff, start);
      if (startMatch < 0) return null;
      if (buff.at(startMatch + 4) !== 109) null;
      return { from: startMatch, at: startMatch + 5 };
    };

    let rest = buff;
    let m: null | M = null;
    while ((m = match(rest), m !== null)) {
      rest = bytes.concat(rest.subarray(0, m.from), rest.subarray(m.at));
    }
    return rest;
  }

  render(...lines: Line[]) {}
}
