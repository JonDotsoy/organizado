import {
  configurationPath,
  configurationProjectsPath,
} from "../configuration-base-path.ts";
import { Configuration } from "../dto/configuration.dto.ts";
import { ProjectDetail } from "../dto/project-detail.dto.ts";
import * as jsonl from "../utils/jsonl.ts";

export const putConfiguration = async (
  configuration: Configuration,
): Promise<void> => {
  await Deno.mkdir(new URL(`./`, configurationPath), { recursive: true });
  await Deno.writeFile(
    configurationPath,
    new TextEncoder().encode(JSON.stringify(configuration, null, 2)),
  );
};

export const getEnvironmentConfiguration = async (): Promise<
  Pick<Configuration, "project_selected">
> => {
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

export const getProjects = async function* () {
  for await (const file of await Deno.readDir(configurationProjectsPath)) {
    if (file.isFile && file.name.endsWith(".jsonl")) {
      const id = file.name.substring(0, file.name.length - ".jsonl".length);
      const location = new URL(file.name, configurationProjectsPath);

      const projectDetail = ProjectDetail.fromEvents(id, location);

      for await (const event of jsonl.readFile(location)) {
        projectDetail.next(event);
      }

      yield projectDetail.getSnap();
    }
  }
};

export const fetchConfiguration = async (): Promise<Configuration> => {
  const environmentConfiguration = await getEnvironmentConfiguration();

  for await (const f of getProjects()) {
    console.log(f);
  }

  return {
    project_selected: environmentConfiguration.project_selected,
  };
};
