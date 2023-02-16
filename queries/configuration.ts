import { configurationPath } from "../configuration-base-path.ts";
import { Configuration } from "../dto/configuration.dto.ts";

export const putConfiguration = async (
  configuration: Configuration,
): Promise<void> => {
  await Deno.mkdir(new URL(`./`, configurationPath), { recursive: true });
  await Deno.writeFile(
    configurationPath,
    new TextEncoder().encode(JSON.stringify(configuration, null, 2)),
  );
};

export const fetchConfiguration = async (): Promise<Configuration> => {
  try {
    const configurationBuff: Uint8Array = await Deno.readFile(
      configurationPath,
    );
    return JSON.parse(new TextDecoder().decode(configurationBuff));
  } catch (ex) {
    if (ex instanceof Error && "code" in ex && ex.code === "ENOENT") return {};
    throw ex;
  }
};
