import { ProjectEvent } from "../dto/project-event.dto.ts";
import { ProjectDetail } from "../dto/project-detail.dto.ts";
import { TaskDetail } from "../dto/task-detail.dto.ts";
import { assertSnapshot } from "https://deno.land/std@0.158.0/testing/snapshot.ts";
import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { ULID } from "../deeps.ts";

let t = 0;
const ulid = ULID.factory(() => 0);
const now = () => ulid(++t);

Deno.test("Events to make project settings", async (t) => {
  const userId = "A";

  const events: ProjectEvent[] = [
    { id: now(), userId, event: { Created: true } },
    { id: now(), userId, event: { UpdateTitle: { title: "FOO" } } },
    // { id: now(), userId, event: { CreateTask: { taskId: now() } } },
  ];

  const projectDetail = await ProjectDetail.fromLocation(
    "A",
    new URL("file:///projects/A.jsonl"),
  );

  assertSnapshot(t, projectDetail.writeManyEvents(...events));

  const newTaskId = now();
  const newTask = await TaskDetail.fromLocation(
    newTaskId,
    new URL(`file:///tasks/${newTaskId}.jsonl`),
  );

  projectDetail.writeManyEvents({
    id: now(),
    userId,
    event: { CreateTask: { taskId: newTaskId } },
  });
  newTask.writeManyEvents({ id: now(), userId, event: { Created: true } });

  assertSnapshot(t, projectDetail.writeManyEvents());
  assertSnapshot(t, newTask.writeManyEvents());
  assertSnapshot(
    t,
    newTask.writeManyEvents({
      id: now(),
      userId,
      event: { UpdateTitle: { title: "FOO" } },
    }),
  );

  newTask.writeManyEvents({
    id: now(),
    userId,
    event: { CreateComment: { id: now(), comment: "BIZ" } },
  });
  newTask.writeManyEvents({
    id: now(),
    userId,
    event: { CreateComment: { id: now(), comment: "BAZ" } },
  });

  assertSnapshot(t, newTask.writeManyEvents());
});

Deno.test("capture changes", async () => {
  const nextFrame = () => new Promise((r) => setTimeout(r, 0));

  let called = 0;
  const projectDetail = await ProjectDetail.fromLocation(
    "A",
    new URL("file:///projects/A.jsonl"),
  );

  Promise.resolve().then(async () => {
    for await (const _snap of projectDetail.watch()) {
      called += 1;
    }
  });

  projectDetail.writeManyEvents({
    id: now(),
    userId: "A",
    event: { Created: true },
  });

  await nextFrame();

  projectDetail.writeManyEvents({
    id: now(),
    userId: "A",
    event: { UpdateTitle: { title: "FOO" } },
  });

  projectDetail.writeManyEvents({
    id: now(),
    userId: "A",
    event: { UpdateTitle: { title: "BIZ" } },
  });

  await nextFrame();

  projectDetail.writeManyEvents({
    id: now(),
    userId: "A",
    event: { UpdateTitle: { title: "TAZ" } },
  });

  await nextFrame();

  assertEquals(called, 2);
});
