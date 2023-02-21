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

  async *listProjectIds() {
    const projectIds = new Set<string>();
    for await (const f of Deno.readDir(this.projectsDirLocation)) {
      if (f.isFile && f.name.endsWith(".jsonl")) {
        const projectId = f.name.substring(0, f.name.length - ".jsonl".length);
        projectIds.add(projectId);
      }
    }
    yield* Array.from(projectIds).sort();
  }

  async *listProjects() {
    for await (const projectId of this.listProjectIds()) {
      yield await this.selectProject(projectId);
    }
  }

  async gitGetConfig(key: string) {
    const process = await Deno.run({
      cmd: ["git", "config", "--local", key],
      stdout: "piped",
    });
    const status = await process.status();
    if (status.code === 1) return null;
    return new TextDecoder().decode(await process.output()).trim();
  }

  async gitSetConfig(key: string, value: string) {
    const process = await Deno.run({
      cmd: ["git", "config", "--local", key, value],
    });
    const status = await process.status();
    if (status.code !== 0) throw new Error("Failed set configuration");
  }

  async gitUnsetConfig(key: string) {
    await Deno.run({ cmd: ["git", "config", "--local", "--unset", key] });
  }

  async isGitDirectory() {
    const process = await Deno.run({
      cmd: ["git", "status"],
      stdout: "null",
    });
    const status = await process.status();
    return status.code === 0;
  }

  async getConfigurationProjectSelected() {
    const projectSelectedGitConfig = await this.gitGetConfig(
      "organizado.project-selected",
    );

    if (!projectSelectedGitConfig) {
      const projectGen = await this.createProject();
      const projectId = projectGen.getSnap().id;

      // projectGen.pushEvent("RelatedGit", { git: "" })

      await this.gitSetConfig("organizado.project-selected", projectId);

      return projectId;
    }

    return projectSelectedGitConfig;
  }

  async getConfiguration(): Promise<Configuration> {
    try {
      if (await this.isGitDirectory()) {
        const projectSelectedGitConfig = await this
          .getConfigurationProjectSelected();

        const taskSelectedGitConfig = await this.gitGetConfig(
          "organizado.task-selected",
        );

        return {
          project_selected: projectSelectedGitConfig ?? undefined,
          task_selected: taskSelectedGitConfig ?? undefined,
        };
      } else {
        return JSON.parse(
          new TextDecoder().decode(
            await Deno.readFile(this.configurationLocation),
          ),
        );
      }
    } catch (ex) {
      if (typeof ex === "object" && ex !== null && ex.code === "ENOENT") {
        return {};
      }
      throw ex;
    }
  }

  async putConfiguration(configuration: Configuration): Promise<void> {
    if (await this.isGitDirectory()) {
      if (configuration.project_selected) {
        await this.gitSetConfig(
          "organizado.project-selected",
          configuration.project_selected,
        );
      } else {
        await this.gitUnsetConfig("organizado.project-selected");
      }
      if (configuration.task_selected) {
        await this.gitSetConfig(
          "organizado.task-selected",
          configuration.task_selected,
        );
      } else {
        await this.gitUnsetConfig("organizado.task-selected");
      }
    } else {
      return Deno.writeFile(
        this.configurationLocation,
        new TextEncoder().encode(
          JSON.stringify(configuration, null, 2),
        ),
      );
    }
  }

  async createProject(): Promise<ProjectGen> {
    const projectId = ulid();
    const location = new URL(`${projectId}.jsonl`, this.projectsDirLocation);
    await Deno.writeFile(location, new Uint8Array());
    const projectGen = await ProjectDetail.fromLocation(projectId, location);
    const projectWorkspace = new ProjectWorkspace(this, projectGen);
    this.projects.set(projectId, projectWorkspace);
    projectGen.pushEvent("Created", true);
    return projectGen;
  }

  async resolveProjectIdString(projectIdString: string) {
    let projectNumeralIndexString = /^{(\d+)}$/.exec(projectIdString)?.at(1);
    if (projectNumeralIndexString) {
      const projectNumeralIndex = Number(projectNumeralIndexString);
      let n = 0;
      for await (const projectId of this.listProjectIds()) {
        n = n + 1;
        if (n === projectNumeralIndex) return projectId;
      }
    }
    return projectIdString;
  }

  async selectProject(
    projectIdString: string,
    options?: SelectProjectOptions,
  ): Promise<ProjectWorkspace> {
    const projectId = await this.resolveProjectIdString(projectIdString);
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
