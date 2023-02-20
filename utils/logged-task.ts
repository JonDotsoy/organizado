import { colors } from "../deeps.ts";
import { TaskDetail } from "../dto/task-detail.dto.ts";
import { template } from "./template.ts";

export interface LoggedTaskOptions {
  showLocation?: boolean;
}

export const loggedTask = (
  n: number | null | undefined,
  { id, title, updatedAt, createdAt, archivedAt, ...task }: TaskDetail,
  options?: LoggedTaskOptions,
) => {
  const showLocation = options?.showLocation ?? false;
  const opts: string[] = [];

  if (updatedAt) {
    opts.push(
      `Update At ${
        updatedAt.toLocaleString(undefined, {
          dateStyle: "full",
          timeStyle: "medium",
        })
      }`,
    );
  }
  if (createdAt) {
    opts.push(
      `Created At ${
        createdAt.toLocaleString(undefined, {
          dateStyle: "full",
          timeStyle: "medium",
        })
      }`,
    );
  }
  if (archivedAt) {
    opts.push(
      `Archived At ${
        archivedAt.toLocaleString(undefined, {
          dateStyle: "full",
          timeStyle: "medium",
        })
      }`,
    );
  }

  return template(
    `${n ? colors.blue(`{${n}} `) : ""}${
      archivedAt ? colors.red(`${id}:`) : colors.yellow(`${id}:`)
    } ${title === null ? colors.gray(`null`) : title}${
      colors.gray(opts.length ? ` (${opts.join(", ")})` : "")
    }`,
    showLocation
      ? `  Location: ${colors.cyan(task.location.toString())}`
      : null,
  );
};
