import { decodeTime } from "npm:ulid";
import { GEN, gen } from "../utils/gen.ts";
import { TaskEvent } from "./task-event.dto.ts";

export type TaskGen = GEN<TaskEvent, TaskDetail>;

export class TaskDetail {
  constructor(
    readonly id: string,
    readonly location: URL,
    readonly title: string | null,
    readonly createdAt: Date | null,
    readonly updatedAt: Date | null,
    readonly taskRelated: Set<string>,
    readonly comments: Map<string, { comment: string }>,
  ) {}

  static fromEvents(id: string, location: URL): TaskGen {
    let title: string | null = null;
    const taskRelated: Set<string> = new Set();
    let createdAt: Date | null = null;
    let updatedAt: Date | null = null;
    const comments: Map<string, { comment: string }> = new Map();

    return gen<TaskEvent, TaskDetail>(
      {
        CreateComment: ({ id, comment }) => comments.set(id, { comment }),
        Created: (_, { id }) => createdAt = new Date(decodeTime(id)),
        RelatedTask: (event) => taskRelated.add(event.taskRelated),
        UpdateTitle: (event) => title = event.title,
      },
      [
        (_, _1, { id }) => updatedAt = new Date(decodeTime(id)),
      ],
      () =>
        new TaskDetail(
          id,
          location,
          title,
          createdAt,
          updatedAt,
          taskRelated,
          comments,
        ),
    );
  }
}
