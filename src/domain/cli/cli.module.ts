import { WorkspaceModule } from "../workspace/workspace.module.ts";
import { CommandType } from "./command/command.data-type.ts";
import ConfigCommand from "./config.command.ts";
import HelpCommand from "./help/help.command.ts";
import ProjectEditCommand from "./project/project-edit.command.ts";
import ProjectHelpCommand from "./project/project-help.command.ts";
import ProjectInfoCommand from "./project/project-info.command.ts";
import ProjectListCommand from "./project/project-list.command.ts";
import ProjectNewCommand from "./project/project-new.command.ts";
import ProjectRelatedHelpGitCommand from "./project/project-related-help-git.command.ts";
import ProjectRelatedUrlCommand from "./project/project-related-url.command.ts";
import ProjectSelectCommand from "./project/project-select.command.ts";
import TaskArchiveCommand from "./tasks/task-archive.command.ts";
import TaskDeleteCommand from "./tasks/task-delete.command.ts";
import TaskEditCommand from "./tasks/task-edit.command.ts";
import TaskFocusCommand from "./tasks/task-focus.command.ts";
import TaskHelpCommand from "./tasks/task-help.command.ts";
import TaskInfoCommand from "./tasks/task-info.command.ts";
import TaskListCommand from "./tasks/task-list.command.ts";
import TaskNewCommand from "./tasks/task-new.command.ts";
import TaskSelectCommand from "./tasks/task-select.command.ts";

export class CliModule implements CommandType {
  constructor(
    readonly workspace: WorkspaceModule,
  ) {}

  handler(args: string[]) {
    switch (args.at(0)) {
      case "config":
      case "c":
        return new ConfigCommand(this.workspace).handler(args.slice(1));
      case "project":
      case "projects":
      case "p":
        switch (args.at(1)) {
          case "list":
          case "l":
            return new ProjectListCommand(this.workspace).handler(
              args.slice(2),
            );
          case "select":
          case "s":
            return new ProjectSelectCommand(this.workspace).handler(
              args.slice(2),
            );
          case "edit":
          case "e":
            return new ProjectEditCommand(this.workspace).handler(
              args.slice(2),
            );
          case "new":
          case "n":
            return new ProjectNewCommand(this.workspace).handler(args.slice(2));
          case "info":
          case "i":
            return new ProjectInfoCommand(this.workspace).handler(
              args.slice(2),
            );
          case "related":
          case "r": {
            switch (args.at(2)) {
              case "link":
                return new ProjectRelatedUrlCommand(this.workspace).handler(
                  args.slice(3),
                );
            }
            return new ProjectRelatedHelpGitCommand(this.workspace).handler(
              args.slice(3),
            );
          }
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
            return new TaskEditCommand(this.workspace).handler(args.slice(2));
          case "new":
          case "n":
            return new TaskNewCommand(this.workspace).handler(args.slice(2));
          case "info":
          case "i":
            return new TaskInfoCommand(this.workspace).handler(args.slice(2));
          case "focus":
          case "f":
            return new TaskFocusCommand(this.workspace).handler(args.slice(2));
          case "archive":
          case "a":
            return new TaskArchiveCommand(this.workspace).handler(
              args.slice(2),
            );
          case "delete":
          case "d":
            return new TaskDeleteCommand(this.workspace).handler(args.slice(2));
          case "select":
          case "s":
            return new TaskSelectCommand(this.workspace).handler(args.slice(2));
        }
        return new TaskHelpCommand().handler(args.slice(1));
      case "focus":
      case "f":
        return new TaskFocusCommand(this.workspace).handler(args.slice(1));
    }

    return new HelpCommand().handler(args.slice(1));
  }
}
