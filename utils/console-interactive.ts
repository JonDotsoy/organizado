import * as colors from "colors";

export const consoleInteractive = (snap: () => string, timeout = 100) => {
  let stopped = false;
  let lastSnap: string | null = null;
  let frames = 0;
  Promise.resolve().then(async () => {
    while (!stopped) {
      const currentSnap = snap();
      if (currentSnap !== lastSnap) {
        frames = frames + 1;
        console.clear();
        console.log(currentSnap);
        lastSnap = currentSnap;
        console.log(colors.gray(`\n## Frames: ${frames}`));
      }
      await new Promise((r) => setTimeout(r, timeout));
    }
  });
  return {
    stop() {
      stopped = true;
    },
  };
};
