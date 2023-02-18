import { CliModule } from "./src/domain/cli/cli.module.ts";
import { WorkspaceModule } from "./src/domain/workspace/workspace.module.ts";

const baseLocation = new URL(`${Deno.env.get("HOME") ?? Deno.cwd()}/.organizado/`, "file:///");

const workspaceModule = await WorkspaceModule.load(baseLocation);

new CliModule(workspaceModule).handler(Deno.args).catch(console.error);
