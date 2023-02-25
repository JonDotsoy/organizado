import { ULID, ulid } from "../deeps.ts";
import { readFile } from "./jsonl.ts";

export type ArgumentUpdate<D, U> = U extends (doc: D, ...args: infer R) => D ? R
  : never;

const EXT_DOC = `.doc.json`;
const EXT_DOC_HISTORY = `.h.jsonl`;

class CAsyncGenerator<T> {
  constructor(
    readonly asyncGenerator: AsyncGenerator<T>,
  ) {}

  [Symbol.asyncIterator]() {
    return this.asyncGenerator;
  }

  async toArray(): Promise<T[]> {
    const arr: T[] = [];
    for await (const elm of this) {
      arr.push(elm);
    }
    return arr;
  }
}

export interface Doc {
  [prop: string]: string | number | boolean | null | Doc | Doc[];
}

export type FnUpdate<D extends Doc> = (doc: D, ...args: any[]) => D;
export type UpdateFns<D extends Doc> = Record<string, FnUpdate<D>>;

export type Query = {
  where?: (doc: Doc) => boolean;
};

export class DocWatch<D extends Doc = {}, U extends UpdateFns<D> = {}> {
  // @ts-ignore
  private snapDoc: D = {};
  private historyFile: Deno.FsFile | null = null;
  private subsChanges = new Set<
    (<K extends keyof U>(updateKey: K, args: ArgumentUpdate<D, U[K]>) => void)
  >();
  private subsDocChanges = new Set<(doc: D) => void>();

  constructor(
    private location: URL,
    private historyLocation: URL,
    readonly reducer: U,
  ) {}

  get doc() {
    return this.snapDoc;
  }

  close() {
    this.historyFile?.close();
  }

  async reloadDoc() {
    const { location } = this;

    await Deno.mkdir(new URL("./", location), { recursive: true });

    try {
      this.snapDoc = JSON.parse(await Deno.readTextFile(this.location));
      return this.snapDoc;
    } catch (ex) {
      if (ex instanceof Deno.errors.NotFound) return null;
      throw ex;
    }
  }

  subscribe(cb: (doc: D) => void) {
    this.subsDocChanges.add(cb);
    cb(this.snapDoc);
    return () => {
      this.subsDocChanges.delete(cb);
    };
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<D> {
    yield this.snapDoc;
    const next: { target: null | ((snap: D) => void) } = { target: null };
    this.subscribe((snap) => next.target?.(snap));
    while (true) {
      yield new Promise<D>((resolve) => next.target = resolve);
    }
  }

  private timer: ReturnType<typeof setTimeout> | null = null;
  private timerPromise: null | Promise<void> = null;
  private writeDoc() {
    if (this.timerPromise) return this.timerPromise;

    this.timerPromise = new Promise<void>((resolve) => {
      this.timer = setTimeout(async () => {
        try {
          await Deno.writeFile(
            this.location,
            new TextEncoder().encode(JSON.stringify(this.snapDoc, null, 2)),
          );
        } catch (ex) {
          console.error(ex);
        } finally {
          this.subsDocChanges.forEach((sub) => sub(this.snapDoc));
          resolve();
          this.timerPromise = null;
          this.timer = null;
        }
      }, 0);
    });

    return this.timerPromise;
  }

  async initWatch() {
    const { location, historyLocation } = this;

    await Deno.mkdir(new URL("./", location), { recursive: true });
    await Deno.mkdir(new URL("./", historyLocation), { recursive: true });

    await this.reloadDoc();

    this.historyFile = await Deno.open(historyLocation, {
      create: true,
      append: true,
    });
    this.subsChanges.add((updateKey, args) => {
      this.historyFile?.write(
        new TextEncoder().encode(
          `${JSON.stringify({ id: ulid(), updateKey, args })}\n`,
        ),
      );
    });

    return this;
  }

  updateOne<K extends keyof U>(updateKey: K, ...args: ArgumentUpdate<D, U[K]>) {
    this.subsChanges.forEach((sub) => sub(updateKey, args));
    this.snapDoc = this.reducer[updateKey](this.snapDoc, ...args);
    return this.writeDoc();
  }
}

export class Collection<D extends Doc = {}, U extends UpdateFns<D> = {}> {
  private watchDocs = new Map<string, DocWatch<D, U>>();

  constructor(
    readonly name: string,
    readonly db: GenDB,
    readonly reducer: U,
    readonly location: URL,
    readonly locationHistories: URL,
  ) {}

  find(query?: Query) {
    return new CAsyncGenerator(this._find(query));
  }

  private async *_find(query?: Query): AsyncGenerator<Doc> {
    try {
      await Deno.stat(this.location);
    } catch (ex) {
      if (ex instanceof Deno.errors.NotFound) return;
    }

    for await (const entry of Deno.readDir(this.location)) {
      if (entry.isFile && entry.name.endsWith(EXT_DOC)) {
        const docId = entry.name.substring(
          0,
          entry.name.length - EXT_DOC.length,
        );

        const doc = await this.selectById(docId);

        if (doc) {
          if (query) {
            if (query?.where?.(doc)) yield doc;
          } else {
            yield doc;
          }
        }
      }
    }
  }

  idToLocations(id: string) {
    const location = new URL(`${id}${EXT_DOC}`, this.location);
    const historyLocation = new URL(
      `${id}${EXT_DOC_HISTORY}`,
      this.locationHistories,
    );

    return {
      location,
      historyLocation,
    };
  }

  async selectById(id: string): Promise<D | null> {
    const ref = this.watchDocs.get(id);
    if (ref) return ref.doc;
    const { location, historyLocation } = this.idToLocations(id);
    const doc = new DocWatch<D, U>(location, historyLocation, this.reducer);
    return await doc.reloadDoc();
  }

  watchById(id: string): Promise<DocWatch<D, U>> {
    const ref = this.watchDocs.get(id);
    if (ref) return Promise.resolve(ref);
    const { location, historyLocation } = this.idToLocations(id);
    const doc = new DocWatch<D, U>(location, historyLocation, this.reducer);
    this.watchDocs.set(id, doc);
    return doc.initWatch();
  }

  async syncById(id: string, locationSync: URL) {
    const { location, historyLocation } = this.idToLocations(id);

    if (this.watchDocs.has(id)) throw new Error(`Found ${id} open`);

    const history = readFile(historyLocation);
    const nextFile = readFile(locationSync);

    const tmpfileUrl = await Deno.makeTempFile();
    const tmpfile = await Deno.open(tmpfileUrl, { write: true });

    // @ts-ignore
    let partialDoc: D = { id };

    let historyDoc: IteratorResult<any, void> | null = null;
    let nextFileDoc: IteratorResult<any, void> | null = null;

    while (true) {
      historyDoc = historyDoc ?? await history.next();
      nextFileDoc = nextFileDoc ?? await nextFile.next();

      if (nextFileDoc.done && historyDoc.done) break;

      if (nextFileDoc.done || historyDoc.value.id <= nextFileDoc.value.id) {
        partialDoc = this.reducer[historyDoc.value.updateKey](
          partialDoc,
          ...historyDoc.value.args,
        );
        tmpfile.write(
          new TextEncoder().encode(`${JSON.stringify(historyDoc.value)}\n`),
        );
        historyDoc = null;
        continue;
      }

      if (historyDoc.done || nextFileDoc.value.id <= historyDoc.value.id) {
        partialDoc = this.reducer[nextFileDoc.value.updateKey](
          partialDoc,
          ...nextFileDoc.value.args,
        );
        tmpfile.write(
          new TextEncoder().encode(`${JSON.stringify(nextFileDoc.value)}\n`),
        );
        nextFileDoc = null;
        continue;
      }

      throw new Error("failed");
    }

    tmpfile.close();

    await Deno.writeFile(
      location,
      new TextEncoder().encode(JSON.stringify(partialDoc, null, 2)),
    );
    await Deno.copyFile(tmpfileUrl, historyLocation);

    await Deno.remove(tmpfileUrl);
  }
}

export class GenDB {
  private collections = new Map<string, Collection<any, any>>();

  constructor(
    readonly location: URL,
  ) {}

  collection<D extends Doc = {}, U extends UpdateFns<D> = {}>(
    collectionName: string,
    reducer?: U,
  ): Collection<D, U> {
    if (!/^\w+$/.test(collectionName)) {
      throw new Error(`The collection name not allowed`);
    }
    const coll = this.collections.get(collectionName);
    if (coll) return coll;
    const nextColl = new Collection(
      collectionName,
      this,
      reducer ?? {},
      new URL(`${collectionName}/docs/`, this.location),
      new URL(`${collectionName}/h/`, this.location),
    );
    this.collections.set(collectionName, nextColl);
    return nextColl as Collection<any, any>;
  }
}
