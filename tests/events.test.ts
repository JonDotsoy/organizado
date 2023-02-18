import { ProjectEvent } from "../dto/project-event.dto.ts";
import { factory } from "npm:ulid";
import { ProjectDetail } from "../dto/project-detail.dto.ts";
import { TaskDetail } from "../dto/task-detail.dto.ts";
import { assertSnapshot } from "https://deno.land/std@0.158.0/testing/snapshot.ts";
import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

let t = 0;
const ulid = factory(() => 0);
const now = () => ulid(++t);

Deno.test("Events to make project settings", (t) => {
  const userId = "A";

  const events: ProjectEvent[] = [
    { id: now(), userId, event: { Created: true } },
    { id: now(), userId, event: { UpdateTitle: { title: "FOO" } } },
    // { id: now(), userId, event: { CreateTask: { taskId: now() } } },
  ];

  const projectDetail = ProjectDetail.fromEvents(
    "A",
    new URL("file:///projects/A.jsonl"),
  );

  assertSnapshot(t, projectDetail.next(...events));

  const newTaskId = now();
  const newTask = TaskDetail.fromEvents(
    newTaskId,
    new URL(`file:///tasks/${newTaskId}.jsonl`),
  );

  projectDetail.next({
    id: now(),
    userId,
    event: { CreateTask: { taskId: newTaskId } },
  });
  newTask.next({ id: now(), userId, event: { Created: true } });

  assertSnapshot(t, projectDetail.next());
  assertSnapshot(t, newTask.next());
  assertSnapshot(
    t,
    newTask.next({
      id: now(),
      userId,
      event: { UpdateTitle: { title: "FOO" } },
    }),
  );

  newTask.next({
    id: now(),
    userId,
    event: { CreateComment: { id: now(), comment: "BIZ" } },
  });
  newTask.next({
    id: now(),
    userId,
    event: { CreateComment: { id: now(), comment: "BAZ" } },
  });

  assertSnapshot(t, newTask.next());
});

Deno.test("capture changes", async () => {
  const nextFrame = () => new Promise((r) => setTimeout(r, 0));

  let called = 0;
  const projectDetail = ProjectDetail.fromEvents(
    "A",
    new URL("file:///projects/A.jsonl"),
  );

  Promise.resolve().then(async () => {
    for await (const snap of projectDetail.watch()) {
      called += 1;
    }
  });

  projectDetail.next({ id: now(), userId: "A", event: { Created: true } });

  await nextFrame();

  projectDetail.next({
    id: now(),
    userId: "A",
    event: { UpdateTitle: { title: "FOO" } },
  });

  projectDetail.next({
    id: now(),
    userId: "A",
    event: { UpdateTitle: { title: "BIZ" } },
  });

  await nextFrame();

  projectDetail.next({
    id: now(),
    userId: "A",
    event: { UpdateTitle: { title: "TAZ" } },
  });

  await nextFrame();

  assertEquals(called, 2);
});
