import { ProjectDetail, ProjectGen } from "../../../dto/project-detail.dto.ts";
import { ProjectWorkspace } from "../project-workspace/project-workspace.module.ts";
import { basename } from "https://deno.land/std@0.177.0/path/mod.ts";
import { Configuration } from "../../../dto/configuration.dto.ts";
import { ulid } from "../../../deeps.ts";

interface SelectProjectOptions {
  watch?: boolean;
}

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
  ) {}

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

  async createProject(): Promise<ProjectGen> {
    const projectId = ulid();
    const location = new URL(`${projectId}.jsonl`, this.projectsDirLocation);
    const projectGen = await ProjectDetail.fromLocation(projectId, location);
    const projectWorkspace = new ProjectWorkspace(this, projectGen);
    this.projects.set(projectId, projectWorkspace);
    projectGen.pushEvent("Created", true);
    return projectGen;
  }

  async selectProject(
    projectId: string,
    options?: SelectProjectOptions,
  ): Promise<ProjectWorkspace> {
    const projectDetailEvents = this.projects.get(projectId);
    if (projectDetailEvents) return projectDetailEvents;
    const location = new URL(`${projectId}.jsonl`, this.projectsDirLocation);
    const projectGen = await ProjectDetail.fromLocation(projectId, location, {
      watch: options?.watch,
    });
    const projectWorkspace = new ProjectWorkspace(this, projectGen);
    this.projects.set(projectId, projectWorkspace);
    return projectWorkspace;
  }

  static async load(baseLocation: URL) {
    const workspaceModule = new WorkspaceModule(baseLocation);
    await workspaceModule.init();
    return workspaceModule;
  }
}
