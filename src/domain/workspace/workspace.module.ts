import { ulid } from "npm:ulid";
import { ProjectDetail, ProjectGen } from "../../../dto/project-detail.dto.ts";
import { GEN } from "../../../utils/gen.ts";
import { readFile } from "../../../utils/jsonl.ts";
import { ProjectWorkspace } from "../project-workspace/project-workspace.module.ts";
import { basename } from "https://deno.land/std@0.177.0/path/mod.ts";
import { Configuration } from "../../../dto/configuration.dto.ts";

export class WorkspaceModule {
  private projects = new Map<string, ProjectWorkspace>();

  private constructor(
    readonly baseLocation: URL,
    readonly configurationLocation: URL = new URL("config.json", baseLocation),
    readonly projectsDirLocation: URL = new URL(`projects/`, baseLocation),
    readonly projectsTasksLocation: (projectLocation: URL) => URL = (
      projectLocation: URL,
    ) =>
      new URL(
        `tasks/`,
        new URL(
          `${basename(projectLocation.pathname, ".jsonl")}/`,
          projectLocation,
        ),
      ),
  ) { }

  async init() {
  }

  async *listProjects() {
    let projectIds = new Set<string>();
    for await (const f of Deno.readDir(this.projectsDirLocation)) {
      if (f.isFile && f.name.endsWith(".jsonl")) {
        const projectId = f.name.substring(0, f.name.length - ".jsonl".length);
        projectIds.add(projectId);
      }
    }
    for (const projectId of Array.from(projectIds).sort()) {
      yield await this.selectProject(projectId);
    }
  }

  async getConfiguration(): Promise<Configuration> {
    try {
      return JSON.parse(
        new TextDecoder().decode(
          await Deno.readFile(this.configurationLocation),
        ),
      );
    } catch (ex) {
      if (typeof ex === "object" && ex !== null && ex.code === "ENOENT") {
        return {};
      }
      throw ex;
    }
  }

  async putConfiguration(configuration: Configuration): Promise<void> {
    await Deno.writeFile(
      this.configurationLocation,
      new TextEncoder().encode(
        JSON.stringify(configuration, null, 2),
      ),
    );
  }

  async subscribeGen(gen: GEN<any, any>) {
    const snap = gen.getSnap();
    await Deno.mkdir(new URL("./", snap.location), { recursive: true });
    const writeStream = await Deno.open(snap.location, {
      append: true,
      create: true,
    });
    gen.notificationEvents.subscribe((event) => {
      writeStream.write(new TextEncoder().encode(`${JSON.stringify(event)}\n`));
    });
    globalThis.addEventListener("unload", () => {
      writeStream.close();
    });
  }

  async createProject(): Promise<ProjectGen> {
    const id = ulid();
    const location = new URL(`${id}.jsonl`, this.projectsDirLocation);
    const projectGen = ProjectDetail.fromEvents(id, location);
    const projectWorkspace = new ProjectWorkspace(this, projectGen);
    this.projects.set(id, projectWorkspace);
    await this.subscribeGen(projectWorkspace.projectGen);
    projectWorkspace.projectGen.next({
      id,
      userId: "",
      event: { Created: true },
    });
    return projectGen;
  }

  async selectProject(id: string): Promise<ProjectWorkspace> {
    const projectDetailEvents = this.projects.get(id);
    if (projectDetailEvents) return projectDetailEvents;
    const location = new URL(`${id}.jsonl`, this.projectsDirLocation);
    const projectGen = ProjectDetail.fromEvents(id, location);
    const projectWorkspace = new ProjectWorkspace(this, projectGen);
    try {
      for await (const data of readFile(location)) {
        projectGen.next(data);
      }
      this.projects.set(id, projectWorkspace);
      await this.subscribeGen(projectWorkspace.projectGen);
      return projectWorkspace;
    } catch (ex) {
      if (typeof ex === "object" && ex !== null && ex.code === "ENOENT") {
        throw new Error(`Cannot found project ${id}`);
      }
      throw ex;
    }
  }

  static async load(baseLocation: URL) {
    const workspaceModule = new WorkspaceModule(baseLocation);
    await workspaceModule.init();
    return workspaceModule;
  }
}
