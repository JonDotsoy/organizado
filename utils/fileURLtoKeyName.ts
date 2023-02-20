import { path } from "../deeps.ts";

const { basename, fromFileUrl } = path;

export const fileURLtoKeyName = (url: URL) => {
  return basename(fromFileUrl(url), ".ts").split(/\W/).map(
    (world) =>
      /^\d/.test(world)
        ? `_${world}`
        : `${world.slice(0, 1).toUpperCase()}${world.slice(1)}`,
  ).join("");
};
