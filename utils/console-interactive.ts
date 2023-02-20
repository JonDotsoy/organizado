import { colors } from "../deeps.ts";
import { durationString } from "./duration-string.ts";
import { template } from "./template.ts";

export const consoleInteractive = (snap: () => string, timeout = 100) => {
  const debugInterface = false;
  const interfaceStarted = Date.now();
  const getDurationInterface = () =>
    durationString(Date.now() - interfaceStarted);
  let stopped = false;
  let paused = false;
  let lastSnap: string | null = null;
  let frames = 0;
  Promise.resolve().then(async () => {
    while (!stopped) {
      const currentSnap = template(
        snap(),
        debugInterface
          ? colors.gray(`\n## Interface Active: ${getDurationInterface()}`)
          : null,
      );
      if (currentSnap !== lastSnap && !paused) {
        frames = frames + 1;
        console.clear();
        console.log(template(
          currentSnap,
          debugInterface
            ? colors.gray(
              `\n## Frames: ${frames.toLocaleString(undefined, {})}`,
            )
            : null,
        ));
        lastSnap = currentSnap;
      }
      await new Promise((r) => setTimeout(r, timeout));
    }
  });
  return {
    stop() {
      stopped = true;
    },
    pause() {
      paused = true;
    },
    resumen() {
      paused = false;
    },
  };
};
