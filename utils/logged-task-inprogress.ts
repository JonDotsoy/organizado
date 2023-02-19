import * as colors from "colors";
import { TaskDetail } from "../dto/task-detail.dto.ts";
import { durationString } from "./duration-string.ts";

const EOL = "\n";
const template = (...lines: (string | null)[]) =>
  lines.filter((l) => l !== null).join(EOL);

export const loggedTaskInprogress = (task: TaskDetail) => {
  return template(
    ``,
    `Timer:`,
    `  Total tacked: ${
      colors.green(durationString(task.totalCountTimer ?? 0))
    }`,
    task.currentTimer?.start
      ? `  Current timer: ${
        colors.blue(durationString(Date.now() - task.currentTimer.start))
      }`
      : null,
    ``,
  );
};
