import { fromFileUrl, relative } from "path";

export const relativeURL = (from: URL, to: URL): string => {
  const d = relative(fromFileUrl(from), fromFileUrl(to));
  return d.startsWith(".") ? d : `./${d}`;
};
