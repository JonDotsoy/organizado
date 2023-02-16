import { parse } from "https://deno.land/std@0.175.0/flags/mod.ts";
import { configurationProjectsPath } from "./configuration-base-path.ts";
import { Configuration } from "./dto/configuration.dto.ts";
import { ProjectDetail } from "./dto/project-detail.dto.ts";
import { TaskDetail } from "./dto/task-detail.dto.ts";
import { fetchConfiguration, putConfiguration } from "./queries/configuration.ts";
import { putProject, putProjectEvent } from "./queries/project.ts";

class CommandArgumentError extends Error { }

const handlerProjectList = async () => {
  const config = await fetchConfiguration();
  const project = config.project_selected ? config.projects?.find(project => project.id === config.project_selected) ?? null : null

  if (!project) {
    console.error(`No project selected`);
    return;
  }

  console.error(`Project selected:`);

  console.log(`- ID: ${project.id}`)
  console.log(`  Title: ${project.title}`)
  console.log(`  Location: ${project.location}`)
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

  if (project) {
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
      tasks: [],
    };

    await putProject(newProjectDetail);
  } else {
    console.error(`Skip save project`);
  }
};

const handlerTaskHelp = () => console.error("handlerTaskHelp");

interface handlerTaskNewProps {
  title: string | null
  taskRelated: number | null
}

const handlerTaskNew = async (props: handlerTaskNewProps) => {
  const configuration = await fetchConfiguration()
  const project = configuration.project_selected ? configuration.projects?.find(project => project.id === configuration.project_selected) ?? null : null

  if (!project) throw new Error(`Project not selected`)

  const title = props.title ?? prompt("Task Title:")

  if (!title) throw new Error("Require a title valid")

  const task: TaskDetail = {
    id: project.tasks.length + 1,
    title,
    taskRelated: props.taskRelated ?? undefined,
  }

  console.error(`- ID: ${task.id}`)
  console.error(`  Title: ${task.title}`)
  console.error(`  Task Related: ${task.taskRelated}`)

  if (confirm(`Created task ${task.id}?`)) {
    project.tasks.push(task)

    await putConfiguration(configuration)
  }
}

const handlerTaskList = async () => {
  const configuration = await fetchConfiguration()
  const project = configuration.project_selected ? configuration.projects?.find(project => project.id === configuration.project_selected) ?? null : null

  if (!project) throw new Error(`Project not selected`)

  for (const task of project.tasks) {
    console.error(`- ID: ${task.id}`)
    console.error(`  Title: ${task.title}`)
    console.error()
  }
}

const handlerTaskFocus = async (taskIdString: string | number | null) => {
  if (!taskIdString) throw new Error("Require the task id argument")

  const taskId = Number(taskIdString)

  const configuration = await fetchConfiguration()
  const project = configuration.project_selected ? configuration.projects?.find(project => project.id === configuration.project_selected) ?? null : null

  if (!project) throw new Error(`Cannot found project`)

  const task = project?.tasks.find(task => task.id === taskId) ?? null

  if (!task) throw new Error(`Cannot found task ${taskIdString}`)

  await putProjectEvent(project, { StartTrack: { taskId, timestamp: Date.now() } })

  let timerRunning = true

  while (true) {
    console.clear()
    console.error(`Start focus task:`)
    console.error(`- ID: ${task.id}`)
    console.error(`  Title: ${task.title}`)
    console.error()
    console.error(` State: ${timerRunning ? "Running" : "Stopped"}`)
    console.error()

    const command = prompt(`Command (P = Pause timer, Q = Stop, X = Finish task, M = Add comment, C = Create a new task related)`)

    const codeAction = command?.toLowerCase()

    if (codeAction === "p") {
      if (timerRunning) {
        await putProjectEvent(project, { StopTrack: { taskId, timestamp: Date.now() } })
        timerRunning = false
      } else if (!timerRunning) {
        await putProjectEvent(project, { StartTrack: { taskId, timestamp: Date.now() } })
        timerRunning = true
      }
    }

    if (codeAction === "q") {
      await putProjectEvent(project, { StopTrack: { taskId, timestamp: Date.now() } })
      return
    }

    if (codeAction === "m") {
      await putProjectEvent(project, { TaskComment: { taskId, timestamp: Date.now(), comment: prompt(`Add Comment:`) ?? '' } })
    }

    if (codeAction === "c") {
      await handlerTaskNew({ title: null, taskRelated: taskId })
    }
  }
}

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
          return handlerTaskNew({ title: args.title ?? null, taskRelated: null });
        case "focus":
        case "f":
          return handlerTaskFocus(args._.at(2) ?? null);
      }
      return handlerTaskHelp();
  }

  return handlerHelp();
};

await main();
