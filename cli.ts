import { parse } from "https://deno.land/std@0.175.0/flags/mod.ts";
import { configurationProjectsPath } from "./configuration-base-path.ts";
import { Configuration } from "./dto/configuration.dto.ts";
import { ProjectDetail } from "./dto/project-detail.dto.ts";
import { fetchConfiguration, putConfiguration } from "./queries/configuration.ts";
import { putProject } from "./queries/project.ts";

class CommandArgumentError extends Error { }

const handlerProjectList = async () => {
  const config = await fetchConfiguration();

  if (!config.project_selected) {
    console.error(`No project selected`);
    return;
  }

  console.error(`Project selected:`);
  console.log(config.project_selected);
};

const helpHandlerSelectProject = (config: Configuration, projectId: string | null): ProjectDetail | null => {
  if (projectId) {
    return config.projects?.find(project => project.id === projectId) ?? null
  } else {
    for (const project of config.projects ?? []) {
      console.error(`- ID: ${project.id}`)
      console.error(`  Title: ${project.title}`)
      console.error(`  Location: ${project.location}`)
      console.error()
      if (confirm(`Select this project?`)) {
        return project
      }
    }
  }

  return null
}

const handlerProjectEdit = async (projectId: string | null) => {
  const configuration = await fetchConfiguration()
  const projectSelected = helpHandlerSelectProject(configuration, projectId)

  if (!projectSelected) throw new Error("Project not selected")

  projectSelected.title = prompt("Title:", projectSelected.title ?? undefined);

  configuration.projects = configuration.projects?.map(project => project.id === projectSelected.id ? projectSelected : project) ?? [projectSelected]

  await putConfiguration(configuration)
}

const handlerProjectSelect = async (projectId: string | null) => {
  const config = await fetchConfiguration()
  const project = await helpHandlerSelectProject(config, projectId)

  if (project && confirm(`Select this project?`)) {
    config.project_selected = project.id
    await putConfiguration(config)
    console.log(`Project ${project.title} (${project.id}) selected 🙌`)
  }
};
const handlerProjectHelp = () => console.error("handlerProjectHelp");

interface handlerProjectNewProps {
  title: string | null;
  path: string | null;
}

const handlerProjectNew = async (props: handlerProjectNewProps) => {
  const projectId = crypto.randomUUID();
  const title = props.title ?? prompt("Name project:");
  const destination = props.path
    ? new URL(props.path, new URL(`${Deno.cwd()}/`, "file://"))
    : new URL(`${projectId}.jsonl`, configurationProjectsPath);

  console.error(`Project name: ${title}`);
  console.error(`Project ID: ${projectId}`);
  console.error(`Project Destination: ${destination}`);

  if (confirm(`Confirm the creation of the ${JSON.stringify(title)} project`)) {
    const newProjectDetail: ProjectDetail = {
      id: projectId,
      title,
      location: destination.toString(),
    };

    await putProject(newProjectDetail);
  } else {
    console.error(`Skip save project`);
  }
};

const handlerTaskHelp = () => console.error("handlerTaskHelp");
const handlerTaskNew = () => console.error("handlerTaskNew");
const handlerTaskList = () => console.error("handlerTaskList");
const handlerTaskFocus = () => console.error("handlerTaskFocus");
const handlerHelp = () => console.error("Help");

const main = () => {
  const args = parse(Deno.args, {
    alias: {
      title: "t",
      path: "p",
    },
    string: ["title", "path"],
  });

  switch (args._.at(0)) {
    case "project":
    case "p":
      switch (args._.at(1)) {
        case undefined:
          return handlerProjectList();
        case "select":
        case "s":
          return handlerProjectSelect(args._.at(2)?.toString() ?? null);
        case "edit":
        case "e":
          return handlerProjectEdit(args._.at(2)?.toString() ?? null)
        case "new":
        case "n":
          return handlerProjectNew({ title: args.title ?? null, path: args.path ?? null });
      }
      return handlerProjectHelp();
    case "task":
    case "t":
      switch (args._.at(1)) {
        case undefined:
          return handlerTaskList();
        case "new":
        case "n":
          return handlerTaskNew();
        case "focus":
        case "f":
          return handlerTaskFocus();
      }
      return handlerTaskHelp();
  }

  return handlerHelp();
};

await main();
