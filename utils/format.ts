export class Format {
  constructor(readonly ext: string, readonly contentType: string) {}

  fileName(basename: string) {
    return `${basename}${this.ext}`;
  }
}

type EXT = `.${string}`;
type CONTENT_TYPE = `${string}/${string}`;

const table: [symbol, EXT, CONTENT_TYPE][] = [
  [Symbol.for("json"), `.json`, `application/json`],
  [Symbol.for("yaml"), `.yaml`, `application/yaml`],
  [Symbol.for("yaml"), `.yml`, `application/yaml`],
  [Symbol.for("txt"), `.txt`, `text/plain`],
  [Symbol.for("md"), `.md`, `text/markdown`],
];

const indexSymbols = new Map<symbol, Format>();
table.map(([s, ext, contentType]) =>
  indexSymbols.has(s) ? null : indexSymbols.set(s, new Format(ext, contentType))
);

const indexExt = new Map<EXT, Format>(
  table.map(([s, ext]) => [ext, indexSymbols.get(s)!]),
);

const indexContentType = new Map<CONTENT_TYPE, Format>(
  table.map(([s, _, contentType]) => [contentType, indexSymbols.get(s)!]),
);

export const formatFactory = (format: any): Format => {
  return indexSymbols.get(Symbol.for(format)) ||
    indexExt.get(format) ||
    indexContentType.get(format) ||
    indexSymbols.get(Symbol.for("txt"))!;
};
