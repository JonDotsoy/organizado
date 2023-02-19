import * as colors from "colors";
import { TaskDetail } from "../dto/task-detail.dto.ts";

export const loggedTask = (
  n: number | null | undefined,
  { id, title, updatedAt, createdAt }: TaskDetail,
) => {
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

  return `${n ? colors.blue(`{${n}} `) : ""}${colors.yellow(`${id}:`)} ${
    title === null ? colors.gray(`null`) : title
  }${colors.gray(opts.length ? ` (${opts.join(", ")})` : "")}`;
};
