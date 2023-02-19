import { assert, assertEquals } from "asserts";
import { TaskDetail } from "../../dto/task-detail.dto.ts";

Deno.test("Event timer", () => {
  const taskGen = TaskDetail.fromLocation("", new URL("file:///"));

  taskGen.pushEvent("StartTimer", { startTimer: 1 });
  taskGen.pushEvent("StopTimer", { stopTimer: 100 });

  assertEquals(taskGen.getSnap().totalCountTimer, 99);
});

Deno.test("Event multiple timer", () => {
  const taskGen = TaskDetail.fromLocation("", new URL("file:///"));

  taskGen.pushEvent("StartTimer", { startTimer: 1 });
  taskGen.pushEvent("StopTimer", { stopTimer: 100 });

  taskGen.pushEvent("StartTimer", { startTimer: 200 });
  taskGen.pushEvent("StopTimer", { stopTimer: 250 });

  assertEquals(taskGen.getSnap().totalCountTimer, 99 + 50);
});

Deno.test("Event repeat event start", () => {
  const taskGen = TaskDetail.fromLocation("", new URL("file:///"));

  taskGen.pushEvent("StartTimer", { startTimer: 1 });
  taskGen.pushEvent("StartTimer", { startTimer: 20 });
  taskGen.pushEvent("StartTimer", { startTimer: 30 });
  taskGen.pushEvent("StopTimer", { stopTimer: 100 });

  taskGen.pushEvent("StartTimer", { startTimer: 200 });
  taskGen.pushEvent("StopTimer", { stopTimer: 250 });

  assertEquals(taskGen.getSnap().totalCountTimer, 99 + 50);
});

Deno.test("Status current timer", () => {
  const taskGen = TaskDetail.fromLocation("", new URL("file:///"));

  taskGen.pushEvent("StartTimer", { startTimer: 1 });

  assert(taskGen.getSnap().withTimer);
});
