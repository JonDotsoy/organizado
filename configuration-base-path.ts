export const configurationBasePath = new URL(
  `${Deno.env.get("HOME") ?? Deno.cwd()}/.organizado/`,
  "file://",
);

export const configurationPath = new URL(
  "config.json",
  configurationBasePath,
);

export const configurationProjectsPath = new URL(
  "projects/",
  configurationBasePath,
);
