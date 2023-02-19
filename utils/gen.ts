import { detectPrng, ulid } from "ulid";
import { readFile } from "./jsonl.ts";
import { ContinueController } from "./readline.ts";

const instanceId = ulid();

class NotificationSignal<T = void> {
  private subs: ((data: T) => void)[] = [];

  notify(data: T) {
    this.subs.forEach((sub) => sub(data));
  }

  subscribe(fn: (data: T) => void) {
    this.subs.push(fn);
    return () => {
      this.subs = this.subs.filter((sub) => sub !== fn);
    };
  }

  async waitOnceNotification() {
    await new Promise<void>((resolve) => {
      const unSub = this.subscribe(() => {
        unSub();
        resolve();
      });
    });
  }
}

type A<T extends { event: Record<any, any> }> = {
  [K in keyof T["event"]]: (
    body: Exclude<T["event"][K], undefined>,
    target: T,
  ) => any;
};

export class GEN<T extends { event: Record<any, any> }, E> {
  readonly notificationChanges = new NotificationSignal();
  readonly notificationEvents = new NotificationSignal<T>();
  private snap: E;

  constructor(
    readonly mapChanges: A<T>,
    readonly middleware: (<K extends keyof T["event"]>(
      keyEvent: K,
      valueEvent: Exclude<T["event"][K], undefined>,
      target: T,
    ) => void)[],
    readonly returnNext: () => E,
  ) {
    this.snap = returnNext();
  }

  getSnap() {
    return this.snap;
  }

  async *watch() {
    while (true) {
      await this.notificationChanges.waitOnceNotification();
      yield this.snap;
    }
  }

  watchCb(cb: (snap: E) => void | Promise<void>) {
    Promise.resolve().then(async () => {
      for await (const snap of this.watch()) {
        await cb(snap);
      }
    });
  }

  writeManyEvents(...events: T[]) {
    for (const event of events) {
      if (
        typeof event === "object" && event !== null && "event" in event
      ) {
        this.notificationEvents.notify(event);
        for (const [keyEvent, bodyEvent] of Object.entries(event.event)) {
          this.mapChanges[keyEvent](bodyEvent, event);
          this.middleware.forEach((mid) => mid(keyEvent, bodyEvent, event));
        }
      }
    }
    this.snap = this.returnNext();
    this.notificationChanges.notify();
    return this.getSnap();
  }

  pushEvent<K extends keyof T["event"]>(
    keyEvent: K,
    valueEvent: Exclude<T["event"][K], undefined>,
  ) {
    // @ts-ignore
    this.writeManyEvents({
      iid: instanceId,
      id: ulid(),
      event: { [keyEvent]: valueEvent },
    });
  }

  static async subscribeGen<T extends GEN<any, any>>(
    location: URL,
    instanceGen: T,
  ) {
    await Deno.mkdir(new URL("./", location), { recursive: true });
    const writeStream = await Deno.open(location, {
      append: true,
      create: true,
    });
    instanceGen.notificationEvents.subscribe((event) => {
      if (
        typeof event === "object" && event !== null &&
        typeof event.iid === "string" && event.iid === instanceId
      ) {
        writeStream.write(
          new TextEncoder().encode(`${JSON.stringify(event)}\n`),
        );
      }
    });
    globalThis.addEventListener("unload", () => {
      writeStream.close();
    });
  }

  static async openGen<T extends GEN<any, any>>(
    location: URL,
    instanceGen: T,
    options?: OpenGenOptions,
  ) {
    const continueController = new ContinueController();
    Promise.resolve().then(async () => {
      for await (
        const data of readFile(location, {
          readlineOptions: {
            continue: continueController,
            continueWatch: options?.watchGen,
          },
        })
      ) {
        instanceGen.writeManyEvents(data);
      }
    });
    await continueController.waitToContinue();
    await this.subscribeGen(location, instanceGen);
  }
}

export interface OpenGenOptions {
  watchGen?: boolean;
}

export const openGen = async <T extends { event: Record<any, any> }, E>(
  location: URL,
  mapChanges: A<T>,
  middleware: (<K extends keyof T["event"]>(
    keyEvent: K,
    valueEvent: Exclude<T["event"][K], undefined>,
    target: T,
  ) => void)[],
  returnNext: () => E,
  options?: OpenGenOptions,
) => {
  const instanceGen = new GEN(mapChanges, middleware, returnNext);

  await GEN.openGen(location, instanceGen, options);

  return instanceGen;
};
