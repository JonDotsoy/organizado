export const consoleInteractive = (snap: () => string, timeout = 100) => {
  let stopped = false;
  Promise.resolve().then(async () => {
    while (!stopped) {
      console.clear();
      console.log(snap());
      await new Promise((r) => setTimeout(r, timeout));
    }
  });
  return {
    stop() {
      stopped = true;
    },
  };
};
