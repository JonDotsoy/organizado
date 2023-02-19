import { ulid } from "ulid";
import { ProjectGen } from "../../../dto/project-detail.dto.ts";
import { TaskDetail, TaskGen } from "../../../dto/task-detail.dto.ts";
import { readFile } from "../../../utils/jsonl.ts";
import { WorkspaceModule } from "./../workspace/workspace.module.ts";

interface SelectTaskOptions {
  watch?: boolean;
}

export class ProjectWorkspace {
  private tasks: Map<string, TaskGen> = new Map();

  constructor(
    readonly workspace: WorkspaceModule,
    readonly projectGen: ProjectGen,
  ) {}

  async *listTaskIds() {
    const taskIds = new Set<string>();
    try {
      for await (
        const taskRelativePath of Deno.readDir(
          this.workspace.projectsTasksLocation(
            this.projectGen.getSnap().location,
          ),
        )
      ) {
        if (
          taskRelativePath.isFile && taskRelativePath.name.endsWith(".jsonl")
        ) {
          const taskId = taskRelativePath.name.substring(
            0,
            taskRelativePath.name.length - ".jsonl".length,
          );
          taskIds.add(taskId);
        }
      }
    } catch (ex) {
      if (typeof ex === "object" && ex !== null && ex.code === "ENOENT") return;
      throw ex;
    }

    yield* Array.from(taskIds).sort();
  }

  async *listTasks() {
    for await (const taskId of this.listTaskIds()) {
      yield this.selectTask(taskId);
    }
  }

  async resolveTaskId(proposalTaskId: string) {
    const indexString = /\{(\d+)\}/.exec(proposalTaskId)?.at(1);
    if (indexString) {
      const index = Number(indexString);
      let n = 0;
      for await (const taskId of this.listTaskIds()) {
        n = n + 1;
        if (n === index) return taskId;
      }
    }
    return proposalTaskId;
  }

  async selectTask(proposalTaskId: string, options?: SelectTaskOptions) {
    const taskId = await this.resolveTaskId(proposalTaskId);
    const location = new URL(
      `${taskId}.jsonl`,
      this.workspace.projectsTasksLocation(this.projectGen.getSnap().location),
    );
    const taskGen = await TaskDetail.fromLocation(taskId, location, {
      watch: options?.watch,
    });
    this.tasks.set(taskId, taskGen);
    return taskGen;
  }

  async createTask(): Promise<TaskGen> {
    const taskId = ulid();
    const location = new URL(
      `${taskId}.jsonl`,
      this.workspace.projectsTasksLocation(this.projectGen.getSnap().location),
    );
    const taskGen = await TaskDetail.fromLocation(taskId, location);
    this.tasks.set(taskId, taskGen);
    taskGen.pushEvent("Created", true);
    this.projectGen.pushEvent("CreateTask", { taskId });
    return taskGen;
  }
}
