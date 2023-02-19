const EOL = "\n";
export const template = (...lines: (string | null)[]) =>
  lines.filter((line) => typeof line === "string").join(EOL);
