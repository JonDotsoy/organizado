import { WorkspaceModule } from "../workspace/workspace.module.ts";
import { CommandType } from "./command/command.data-type.ts";
import { HelpCommand } from "./help/help.command.ts";
import { ProjectEditCommand } from "./project/project-edit.command.ts";
import { ProjectHelpCommand } from "./project/project-help.command.ts";
import { ProjectListCommand } from "./project/project-list.command.ts";
import { ProjectNewCommand } from "./project/project-new.command.ts";
import { ProjectSelectCommand } from "./project/project-select.command.ts";
import { TaskEditCommand } from "./tasks/task-edit.command.ts";
import { TaskFocusCommand } from "./tasks/task-focus.command.ts";
import { TaskHelpCommand } from "./tasks/task-help.command.ts";
import { TaskListCommand } from "./tasks/task-list.command.ts";
import { TaskNewCommand } from "./tasks/task-new.command.ts";

export class CliModule implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  handler(args: string[]) {
    switch (args.at(0)) {
      case "project":
      case "p":
        switch (args.at(1)) {
          case "list":
          case "l":
            return new ProjectListCommand(this.workspace).handler(args.slice(2));
          case "select":
          case "s":
            return new ProjectSelectCommand(this.workspace).handler(args.slice(2));
          case "edit":
          case "e":
            return new ProjectEditCommand(this.workspace).handler(args.slice(2));
          case "new":
          case "n":
            return new ProjectNewCommand(this.workspace).handler(args.slice(2));
        }
        return new ProjectHelpCommand().handler(args.slice(1));
      case "task":
      case "t":
        switch (args.at(1)) {
          case "list":
          case "l":
            return new TaskListCommand(this.workspace).handler(args.slice(2));
          case "edit":
          case "e":
            return new TaskEditCommand().handler(args.slice(2));
          case "new":
          case "n":
            return new TaskNewCommand(this.workspace).handler(args.slice(2));
          case "focus":
          case "f":
            return new TaskFocusCommand().handler(args.slice(2));
        }
        return new TaskHelpCommand().handler(args.slice(1));
    }
    return new HelpCommand().handler(args.slice(1));
  }
}
