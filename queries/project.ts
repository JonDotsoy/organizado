import { configurationPath } from "../configuration-base-path.ts";
import { ProjectDetail } from "../dto/project-detail.dto.ts";
import { ProjectEvent } from "../dto/project-event.dto.ts";
import { TaskDetail } from "../dto/task-detail.dto.ts";
import { fetchConfiguration, putConfiguration } from "./configuration.ts";

export const fetchProject = async (projectId: string) => {
  const config = await fetchConfiguration();
  const projectLocation = config.projects?.find((project) =>
    project.id === projectId
  );

  if (!projectLocation) {
    throw new Error(`Cannot found project ${projectId}`);
  }

  throw new Error("Not implemented yet");
};

export const putProject = async (
  { id: projectId, location, ...rest }: ProjectDetail,
) => {
  const config = await fetchConfiguration();
  const projectDetail = config.projects?.find((project) =>
    project.id === projectId
  );

  if (!projectDetail) {
    const projects = config.projects ?? [];

    projects.push({ id: projectId, location, ...rest });

    const eventCreated: ProjectEvent = {
      CreatedProject: {
        timestamp: Date.now(),
      },
    };

    await Deno.mkdir(new URL("./", location), { recursive: true });
    await Deno.writeFile(
      new URL(location),
      new TextEncoder().encode(`${JSON.stringify(eventCreated)}\n`),
    );
    config.projects = projects;
    await putConfiguration(config);
  }
};

export const putProjectEvent = async (
  { location }: ProjectDetail,
  projectEvent: ProjectEvent,
) => {
  const file = await Deno.open(new URL(location), { append: true })

  await file.write(new TextEncoder().encode(JSON.stringify(projectEvent)))
  await file.write(new TextEncoder().encode("\n"))

  file.close()
}
