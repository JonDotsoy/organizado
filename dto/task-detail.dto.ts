import { decodeTime } from "ulid";
import { flags } from "../deeps.ts";
import { GEN, openGen } from "../utils/gen.ts";
import { TaskEvent } from "./task-event.dto.ts";

interface FromLocationOptions {
  watch?: boolean;
}

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
    readonly totalCountTimer: null | number,
    readonly withTimer: null | boolean,
    readonly currentTimer: { start: number } | null,
  ) {}

  static fromLocation(
    id: string,
    location: URL,
    options?: FromLocationOptions,
  ): Promise<TaskGen> {
    let title: string | null = null;
    const taskRelated: Set<string> = new Set();
    let createdAt: Date | null = null;
    let updatedAt: Date | null = null;
    const comments: Map<string, { comment: string }> = new Map();
    let startTimer: null | number = null;
    let totalCountTimer: null | number = 0;
    let withTimer: null | boolean = false;
    let currentTimer: { start: number } | null = null;

    return openGen<TaskEvent, TaskDetail>(
      location,
      {
        CreateComment: ({ id, comment }) => comments.set(id, { comment }),
        Created: (_, { id }) => createdAt = new Date(decodeTime(id)),
        RelatedTask: (event) => taskRelated.add(event.taskRelated),
        UpdateTitle: (event) => title = event.title,
        StartTimer: (event) => {
          if (startTimer === null) {
            startTimer = event.startTimer;
            currentTimer = { start: startTimer };
            withTimer = true;
          }
        },
        StopTimer: (event) => {
          if (startTimer) {
            totalCountTimer = (totalCountTimer ?? 0) +
              (event.stopTimer - startTimer);
            startTimer = null;
            currentTimer = null;
            withTimer = null;
          }
        },
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
          totalCountTimer,
          withTimer,
          currentTimer,
        ),
      {
        watchGen: options?.watch,
      },
    );
  }
}
