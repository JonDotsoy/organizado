import { colors } from "../../deeps.ts";
import { asserts } from "../../deeps-dev.ts";
import { TerminalUI } from "../../utils/terminal-ui.ts";

Deno.test("Clear ASCII Colors", () => {
  const C = `foo${colors.bgBlue(`biz`)}baz`;

  asserts.equal(
    TerminalUI.cleanASCIIColors(new TextEncoder().encode(C)),
    new TextEncoder().encode(`foobizbaz`),
  );
});
