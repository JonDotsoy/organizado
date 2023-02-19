import * as colors from "colors";
import { parse } from "flags";
import { YAML } from "../../../../deeps.ts";
import { TaskDetail } from "../../../../dto/task-detail.dto.ts";
import { loggedTask } from "../../../../utils/logged-task.ts";
import { WorkspaceModule } from "../../workspace/workspace.module.ts";
import { CommandType } from "../command/command.data-type.ts";

const partialTask = ({ id, title, createdAt, updatedAt }: TaskDetail) => ({
  id,
  title,
  createdAt,
  updatedAt,
});

export default class TaskListCommand implements CommandType {
  constructor(readonly workspace: WorkspaceModule) {}

  printTaskConsole(tasks: TaskDetail[]) {
    let n = 0;
    for (const task of tasks) {
      n = n + 1;

      console.log(loggedTask(n, task));
    }
  }

  printTaskYAML(tasks: TaskDetail[]) {
    console.log(YAML.stringify(tasks.map(partialTask)));
  }

  printTaskJSON(tasks: TaskDetail[]) {
    console.log(JSON.stringify(tasks.map(partialTask), null, 2));
  }

  async handler(args: string[]) {
    const { format } = parse(args, {
      string: "format",
      alias: { format: "f" },
    });

    const configuration = await this.workspace.getConfiguration();
    if (!configuration.project_selected) {
      throw new Error(
        "No project selected. Please select with `t p s <project_id>`",
      );
    }
    const projectWorkspace = await this.workspace.selectProject(
      configuration.project_selected,
    );

    const tasks: TaskDetail[] = [];
    for await (const taskGen of projectWorkspace.listTasks()) {
      const task = taskGen.getSnap();
      tasks.push(task);
    }

    switch (format?.toLowerCase()) {
      case "json":
        return this.printTaskJSON(tasks);
      case "yaml":
        return this.printTaskYAML(tasks);
      default:
        return this.printTaskConsole(tasks);
    }
  }
}
