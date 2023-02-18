import { decodeTime } from "npm:ulid";
import { GEN, gen } from "../utils/gen.ts";
import { Comment } from "./commet.dto.ts";
import { ProjectEvent } from "./project-event.dto.ts";
import { TaskDetail } from "./task-detail.dto.ts";
import { TaskEvent } from "./task-event.dto.ts";

export type ProjectGen = GEN<ProjectEvent, ProjectDetail>;

export class ProjectDetail {
  constructor(
    readonly id: string,
    readonly title: string | null,
    readonly location: URL,
    readonly cratedAt: Date | null,
    readonly updatedAt: Date | null,
    readonly tasks: Map<string, Pick<TaskDetail, "id">>,
  ) {}

  static fromEvents(id: string, location: URL): ProjectGen {
    let title: string | null = null;
    let cratedAt: Date | null = null;
    let updatedAt: Date | null = null;
    const tasks: Map<string, Pick<TaskDetail, "id">> = new Map();

    return gen<ProjectEvent, ProjectDetail>(
      {
        Created: (_, { id }) => cratedAt = new Date(decodeTime(id)),
        UpdateTitle: (event) => title = event.title,
        CreateTask: ({ taskId }) => tasks.set(taskId, { id: taskId }),
      },
      [
        (_, _1, { id }) => updatedAt = new Date(decodeTime(id)),
      ],
      () => new ProjectDetail(id, title, location, cratedAt, updatedAt, tasks),
    );
  }
}
