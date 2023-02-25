import { ULID } from "../../deeps.ts";
import { asserts, demoWorkspace } from "../../deeps-dev.ts";
import { Collection, GenDB } from "../../utils/gen-db.ts";

Deno.test("GEN DB: List docs", { sanitizeResources: false }, async (t) => {
  const workspace = demoWorkspace({
    workspaceName: t.name,
  });

  workspace.makeTree({
    "asd/docs/biz.doc.json": JSON.stringify({ id: "biz" }, null, 2),
    "asd/docs/foo.doc.json": JSON.stringify({ id: "foo" }, null, 2),
    "asd/docs/aaa.doc.json": JSON.stringify({ id: "aaa" }, null, 2),
  });

  const db = new GenDB(
    workspace.cwd,
  );

  const coll = db.collection("asd");

  const docs: any[] = [];
  for await (const doc of coll.find()) {
    docs.push(doc);
  }

  asserts.assertEquals(docs, [
    { id: "aaa" },
    { id: "foo" },
    { id: "biz" },
  ]);
});

Deno.test("GEN DB: Update doc", { sanitizeResources: false }, async (t) => {
  const workspace = demoWorkspace({
    workspaceName: t.name,
  });

  workspace.makeTree({
    "asd/docs/foo.doc.json": JSON.stringify({ id: "foo" }, null, 2),
    "asd/h/foo.h.jsonl": ``,
  });

  const db = new GenDB(
    workspace.cwd,
  );

  type D = {
    id: string;
    foo?: number;
    biz?: number;
  };

  let fooCalls = 0;
  let bizCalls = 0;

  type Reducer = {
    foo(doc: D, a: number): D;
    biz(doc: D): D;
  };

  const coll: Collection<D, Reducer> = db.collection("asd", {
    foo: (doc: D): D => ({ ...doc, foo: ++fooCalls }),
    biz: (doc: D): D => ({ ...doc, biz: ++bizCalls }),
  });

  const docWatch = await coll.watchById("foo");

  docWatch.updateOne("foo", 1);
  asserts.assertEquals(docWatch.doc, { id: "foo", foo: 1 });
  docWatch.updateOne("biz");
  asserts.assertEquals(docWatch.doc, { id: "foo", foo: 1, biz: 1 });
  docWatch.updateOne("foo", 1);
  asserts.assertEquals(docWatch.doc, { id: "foo", foo: 2, biz: 1 });
});

Deno.test("Watch changes with subscriber", async (t) => {
  const workspace = demoWorkspace({
    workspaceName: t.name,
  });

  workspace.makeTree({
    "asd/docs/foo.doc.json": JSON.stringify({ id: "foo" }, null, 2),
    "asd/h/foo.h.jsonl": ``,
  });

  const db = new GenDB(
    workspace.cwd,
  );

  type Doc = {};

  type Reducer = { foo: (doc: Doc) => Doc };

  const coll: Collection<Doc, Reducer> = db.collection("asd", {
    foo: (d) => d,
  });

  const doc = await coll.watchById("foo");

  const changeDocs: any[] = [];
  doc.subscribe((doc) => {
    changeDocs.push(doc);
  });

  doc.updateOne("foo");
  doc.updateOne("foo");

  await new Promise((r) => setTimeout(r, 100));

  asserts.assertEquals(changeDocs, [
    { id: "foo" },
    { id: "foo" },
  ]);

  doc.close();
});

Deno.test("Watch changes with generator", async (t) => {
  const workspace = demoWorkspace({
    workspaceName: t.name,
  });

  workspace.makeTree({
    "asd/docs/foo.doc.json": JSON.stringify({ id: "foo" }, null, 2),
    "asd/h/foo.h.jsonl": ``,
  });

  const db = new GenDB(
    workspace.cwd,
  );

  type Doc = {
    n?: number;
  };

  type Reducer = {
    foo: (doc: Doc) => Doc;
    biz: (doc: Doc, add: number) => Doc;
  };

  const coll: Collection<Doc, Reducer> = db.collection("asd", {
    foo: (d) => d,
    biz: (d, add) => ({ ...d, n: (d.n ?? 0) + add }),
  });

  const doc = await coll.watchById("foo");

  const changeDocs: any[] = [];
  Promise.resolve().then(async () => {
    for await (const snap of doc) {
      changeDocs.push(snap);
    }
  });

  doc.updateOne("foo");
  doc.updateOne("foo");

  await new Promise((r) => setTimeout(r, 100));
  doc.updateOne("biz", 3);
  doc.updateOne("biz", 3);
  await new Promise((r) => setTimeout(r, 100));
  doc.updateOne("biz", 2);
  await new Promise((r) => setTimeout(r, 100));

  asserts.assertEquals(changeDocs, [
    { id: "foo" },
    { id: "foo" },
    { id: "foo", n: 6 },
    { id: "foo", n: 8 },
  ]);

  doc.close();
});

Deno.test("Sync events", async (t) => {
  const workspace = demoWorkspace({
    workspaceName: t.name,
  });

  let ulid = ULID.factory(() => 0);

  const { "foo2.h.jsonl": foo2Location } = workspace.makeTree({
    "asd/docs/foo.doc.json": JSON.stringify({ id: "foo", n: 3 }, null, 2),
    "asd/h/foo.h.jsonl": `
      ${JSON.stringify({ "id": ulid(1000), "updateKey": "foo", "args": [] })}
      ${JSON.stringify({ "id": ulid(1100), "updateKey": "foo", "args": [] })}
      ${JSON.stringify({ "id": ulid(1200), "updateKey": "biz", "args": [3] })}
      ${JSON.stringify({ "id": ulid(1300), "updateKey": "biz", "args": [3] })}
      ${JSON.stringify({ "id": ulid(1400), "updateKey": "biz", "args": [2] })}
    `,
    "foo2.h.jsonl": `
      ${JSON.stringify({ "id": ulid(1200), "updateKey": "biz", "args": [1] })}
      ${JSON.stringify({ "id": ulid(1201), "updateKey": "foo", "args": [] })}
      ${JSON.stringify({ "id": ulid(1210), "updateKey": "biz", "args": [3] })}
      ${JSON.stringify({ "id": ulid(1310), "updateKey": "biz", "args": [3] })}
      ${JSON.stringify({ "id": ulid(1320), "updateKey": "biz", "args": [2] })}
    `,
  });

  const db = new GenDB(
    workspace.cwd,
  );

  type Doc = {
    n?: number;
  };

  type Reducer = {
    foo: (doc: Doc) => Doc;
    biz: (doc: Doc, add: number) => Doc;
  };

  const coll: Collection<Doc, Reducer> = db.collection("asd", {
    foo: (d) => ({ ...d }),
    biz: (d, add) => ({ ...d, n: (d.n ?? 0) + add }),
  });

  await coll.syncById("foo", foo2Location);

  // console.log(await Deno.readTextFile(coll.idToLocations("foo").historyLocation))
});
