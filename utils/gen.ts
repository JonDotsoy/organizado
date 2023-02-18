import { ulid } from "npm:ulid";


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
    readonly middleware: (<K extends keyof T["event"]>(keyEvent: K, valueEvent: Exclude<T["event"][K], undefined>, target: T) => void)[],
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

  next(...events: T[]) {
    for (const event of events) {
      if (
        typeof event === "object" && event !== null && "event" in event
      ) {
        this.notificationEvents.notify(event);
        for (const [keyEvent, bodyEvent] of Object.entries(event.event)) {
          this.mapChanges[keyEvent](bodyEvent, event);
          this.middleware.forEach(mid => mid(keyEvent, bodyEvent, event))
        }
      }
    }
    this.snap = this.returnNext();
    this.notificationChanges.notify();
    return this.getSnap();
  }

  pushEvent<K extends keyof T["event"]>(keyEvent: K, valueEvent: Exclude<T["event"][K], undefined>) {
    // @ts-ignore
    this.next({ id: ulid(), event: { [keyEvent]: valueEvent } })
  }
}

export const gen = <T extends { event: Record<any, any> }, E>(
  mapChanges: A<T>,
  middleware: (<K extends keyof T["event"]>(keyEvent: K, valueEvent: Exclude<T["event"][K], undefined>, target: T) => void)[],
  returnNext: () => E,
) => new GEN(mapChanges, middleware, returnNext);
