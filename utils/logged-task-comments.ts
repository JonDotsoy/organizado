import { TaskDetail } from "../dto/task-detail.dto.ts";
import { template } from "./template.ts";
import { colors } from "../deeps.ts";

interface Options {
  max?: number;
  commentSelected?: number;
}

export const loggedTaskComments = (task: TaskDetail, options?: Options) => {
  const commentSelected = options?.commentSelected ?? 0;
  const maxComments = options?.max ?? 5;
  if (!task.comments.size) return null;

  return template(
    "Comments:",
    ...Array.from(task.comments.values())
      .map(({ comment }, index) =>
        ` - ${colors.blue(`{${index + 1}}`)}${
          commentSelected === index ? colors.yellow("*") : ""
        } ${comment}`
      )
      .slice(
        Math.max(0, commentSelected - Math.floor(maxComments / 2)),
        commentSelected + Math.ceil(maxComments / 2),
      ),
  );
};
