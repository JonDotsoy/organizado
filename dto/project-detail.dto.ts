import { ULID } from "../deeps.ts";
import { GEN, openGen } from "../utils/gen.ts";
import { ProjectEvent } from "./project-event.dto.ts";
import { TaskDetail } from "./task-detail.dto.ts";

const decodeTime = ULID.decodeTime;

export type ProjectGen = GEN<ProjectEvent, ProjectDetail>;

interface FromLocalOptions {
  watch?: boolean;
}

export class ProjectDetail {
  constructor(
    readonly id: string,
    readonly title: string | null,
    readonly location: URL,
    readonly cratedAt: Date | null,
    readonly updatedAt: Date | null,
    readonly tasks: Map<string, Pick<TaskDetail, "id">>,
    readonly related: Set<URL>,
    readonly mainDirectory: URL | null,
  ) {}

  static fromLocation(
    id: string,
    location: URL,
    options?: FromLocalOptions,
  ): Promise<ProjectGen> {
    let title: string | null = null;
    let cratedAt: Date | null = null;
    let updatedAt: Date | null = null;
    const tasks: Map<string, Pick<TaskDetail, "id">> = new Map();
    const related: Set<URL> = new Set();
    let mainDirectory: URL | null = null;

    return openGen<ProjectEvent, ProjectDetail>(
      location,
      {
        Created: (_, { id }) => cratedAt = new Date(decodeTime(id)),
        UpdateTitle: (event) => title = event.title,
        CreateTask: ({ taskId }) => tasks.set(taskId, { id: taskId }),
        RelatedGit: ({ git }) => related.add(git),
        RelatedLink: ({ url }) => related.add(url),
        SetMainDirectory: ({ url }) => mainDirectory = url,
      },
      [
        (_, _1, { id }) => updatedAt = new Date(decodeTime(id)),
      ],
      () =>
        new ProjectDetail(
          id,
          title,
          location,
          cratedAt,
          updatedAt,
          tasks,
          related,
          mainDirectory,
        ),
      {
        watchGen: options?.watch,
      },
    );
  }
}
