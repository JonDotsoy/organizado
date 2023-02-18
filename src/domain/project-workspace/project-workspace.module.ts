import { ulid } from "npm:ulid";
import { ProjectGen } from "../../../dto/project-detail.dto.ts";
import { TaskDetail, TaskGen } from "../../../dto/task-detail.dto.ts";
import { readFile } from "../../../utils/jsonl.ts";
import { WorkspaceModule } from "./../workspace/workspace.module.ts";

export class ProjectWorkspace {
  private tasks: Map<string, TaskGen> = new Map();

  constructor(
    readonly workspace: WorkspaceModule,
    readonly projectGen: ProjectGen,
  ) { }

  async * listTasks() {
    try {
      for await (const taskRelativePath of await Deno.readDir(this.workspace.projectsTasksLocation(this.projectGen.getSnap().location))) {
        if (taskRelativePath.isFile && taskRelativePath.name.endsWith(".jsonl")) {
          const taskId = taskRelativePath.name.substring(0, taskRelativePath.name.length - ".jsonl".length)
          yield await this.selectTask(taskId)
        }
      }
    } catch (ex) {
      if (typeof ex === "object" && ex !== null && ex.code === "ENOENT") return;
      throw ex
    }
  }

  async selectTask(taskId: string) {
    const location = new URL(`${taskId}.jsonl`, this.workspace.projectsTasksLocation(this.projectGen.getSnap().location));
    const taskDetail = TaskDetail.fromEvents(taskId, location)
    for await (const event of readFile(location)) {
      taskDetail.next(event)
    }
    return taskDetail
  }

  async createTask(): Promise<TaskGen> {
    const id = ulid();
    const location = new URL(
      `${id}.jsonl`,
      this.workspace.projectsTasksLocation(this.projectGen.getSnap().location),
    );
    const taskGen = TaskDetail.fromEvents(id, location);
    this.tasks.set(id, taskGen);
    await this.workspace.subscribeGen(taskGen);
    taskGen.next({ id, userId: "", event: { Created: true } });
    this.projectGen.next({
      id: ulid(),
      userId: "",
      event: { CreateTask: { taskId: id } },
    });
    return taskGen;
  }
}
