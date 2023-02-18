import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
  assertRejects,
} from "https://deno.land/std@0.175.0/testing/asserts.ts";
import { ProjectDetail } from "../../../dto/project-detail.dto.ts";
import { WorkspaceModule } from "../workspace/workspace.module.ts";
import { demoWorkspace } from "npm:@jondotsoy/demo-workspace";
import { TaskDetail, TaskGen } from "../../../dto/task-detail.dto.ts";

Deno.test({
  name: "Create a new workspace",
  sanitizeResources: false,
  fn: async ({ name }) => {
    const { cwd: workspaceLocation } = demoWorkspace({ workspaceName: name });

    const workspaceModule = await WorkspaceModule.load(workspaceLocation);

    const projectGen = await workspaceModule.createProject();

    assertInstanceOf(projectGen.getSnap(), ProjectDetail);
  },
});

Deno.test({
  name: "Read project",
  sanitizeResources: false,
  fn: async ({ name }) => {
    const workspace = demoWorkspace({ workspaceName: name });
    const workspaceLocation = workspace.cwd;
    workspace.makeTree({ "projects/000000.jsonl": `` });

    const workspaceModule = await WorkspaceModule.load(workspaceLocation);

    const project = await workspaceModule.selectProject("000000");

    assertInstanceOf(project.projectGen.getSnap(), ProjectDetail);
  },
});

Deno.test({
  name: "ID was not found",
  sanitizeResources: true,
  fn: async ({ name }) => {
    const workspace = demoWorkspace({ workspaceName: name });
    const workspaceLocation = workspace.cwd;

    const workspaceModule = await WorkspaceModule.load(workspaceLocation);

    await assertRejects(async () => {
      await workspaceModule.selectProject("000000");
    });
  },
});

Deno.test({
  name: "Store changes",
  sanitizeResources: false,
  fn: async ({ name }) => {
    const workspace = demoWorkspace({ workspaceName: name });
    const workspaceLocation = workspace.cwd;
    const { "projects/000000.jsonl": file } = workspace.makeTree({
      "projects/000000.jsonl": `
        {"id":"01GSFX2K01K0K0FRT2DEMFB0EJ","userId":"A","event":{"Created":true}}
      `,
    });

    const workspaceModule = await WorkspaceModule.load(workspaceLocation);

    const project = await workspaceModule.selectProject("000000");

    project.projectGen.next({
      id: "1",
      userId: "A",
      event: { UpdateTitle: { title: "FOO" } },
    });
    project.projectGen.next({
      id: "2",
      userId: "A",
      event: { UpdateTitle: { title: "BIZ" } },
    });

    await new Promise((r) => setTimeout(r, 10));

    const payload = new TextDecoder().decode(
      await Deno.readFile(file),
    );
    assertEquals(
      payload,
      `{"id":"01GSFX2K01K0K0FRT2DEMFB0EJ","userId":"A","event":{"Created":true}}\n` +
        `{"id":"1","userId":"A","event":{"UpdateTitle":{"title":"FOO"}}}\n` +
        `{"id":"2","userId":"A","event":{"UpdateTitle":{"title":"BIZ"}}}\n` +
        ``,
    );
  },
});

Deno.test({
  name: "Read stored project",
  sanitizeResources: false,
  fn: async ({ name }) => {
    const workspace = demoWorkspace({ workspaceName: name });
    const workspaceLocation = workspace.cwd;

    workspace.makeTree({
      "projects/000000.jsonl": `
        {"id":"01GSFX2K01K0K0FRT2DEMFB0EJ","userId":"A","event":{"Created":true}}
        {"id":"01GSFX2SE5CHXH7VE9YY072ZAE","userId":"A","event":{"UpdateTitle":{"title":"FOO"}}}
        {"id":"01GSFX2ZRPSJBG7XZYFB8N0JF7","userId":"A","event":{"UpdateTitle":{"title":"BIZ"}}}
      `,
    });

    const workspaceModule = await WorkspaceModule.load(workspaceLocation);

    const projectWorkspace = await workspaceModule.selectProject("000000");

    assertEquals(projectWorkspace.projectGen.getSnap().title, "BIZ");
    assertNotEquals(projectWorkspace.projectGen.getSnap().cratedAt, null);
  },
});

Deno.test({
  name: "Create task",
  sanitizeResources: false,
  fn: async ({ name }) => {
    const workspace = demoWorkspace({ workspaceName: name });
    const workspaceLocation = workspace.cwd;

    workspace.makeTree({
      "projects/000000.jsonl": `
        {"id":"01GSFX2K01K0K0FRT2DEMFB0EJ","userId":"A","event":{"Created":true}}
        {"id":"01GSFX2SE5CHXH7VE9YY072ZAE","userId":"A","event":{"UpdateTitle":{"title":"FOO"}}}
        {"id":"01GSFX2ZRPSJBG7XZYFB8N0JF7","userId":"A","event":{"UpdateTitle":{"title":"BIZ"}}}
      `,
    });

    const workspaceModule = await WorkspaceModule.load(workspaceLocation);

    const projectWorkspace = await workspaceModule.selectProject("000000");
    const taskGen: TaskGen = await projectWorkspace.createTask();

    assertInstanceOf(taskGen.getSnap(), TaskDetail);
    assert(
      projectWorkspace.projectGen.getSnap().tasks.has(taskGen.getSnap().id),
    );
  },
});

Deno.test({
  name: "Update task",
  sanitizeResources: false,
  fn: async ({ name }) => {
    const workspace = demoWorkspace({ workspaceName: name });
    const workspaceLocation = workspace.cwd;

    workspace.makeTree({
      "projects/000000.jsonl": `
        {"id":"01GSFX2K01K0K0FRT2DEMFB0EJ","userId":"A","event":{"Created":true}}
      `,
    });

    const workspaceModule = await WorkspaceModule.load(workspaceLocation);

    const projectWorkspace = await workspaceModule.selectProject("000000");
    const taskGen: TaskGen = await projectWorkspace.createTask();

    taskGen.next({
      id: "AAA",
      userId: "A",
      event: { UpdateTitle: { title: "FOO" } },
    });

    await new Promise((r) => setTimeout(r, 1000));

    const u = new URL(
      `projects/000000/tasks/${taskGen.getSnap().id}.jsonl`,
      workspace.cwd,
    );
    assert((await Deno.readFile(u)).length > 0);
  },
});
