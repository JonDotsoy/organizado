import { CliModule } from "./src/domain/cli/cli.module.ts";
import { WorkspaceModule } from "./src/domain/workspace/workspace.module.ts";

const tryEnvHome = () => {
  try {
    return Deno.env.get("HOME");
  } catch (ex) {
    if (ex instanceof Deno.errors.PermissionDenied) {
      return undefined;
    }
    throw ex;
  }
};

const baseLocation = new URL(
  `${tryEnvHome() ?? Deno.cwd()}/.organizado/`,
  "file:///",
);

const workspaceModule = await WorkspaceModule.load(baseLocation);

new CliModule(workspaceModule).handler(Deno.args).catch(console.error);
