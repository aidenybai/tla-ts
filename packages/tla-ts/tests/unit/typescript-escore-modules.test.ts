import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

interface ModuleResult {
  status: string;
  message: string | undefined;
}

// ESCore's evaluation nests deeper than a test's stack, so checks run on one worker with a
// 256 MB stack, which prepares ESCore's runtime once for them all.
const worker = new Worker(
  `const { register } = require("node:module");
  const { readFileSync } = require("node:fs");
  const { parentPort, workerData } = require("node:worker_threads");
  // HACK: Node strips the types of tla-ts's sources, whose imports leave out the extension.
  register("data:text/javascript," + encodeURIComponent(\`export const resolve = (specifier, context, next) =>
    next(specifier, context).catch((error) => (specifier.startsWith(".") ? next(specifier + ".ts", context) : Promise.reject(error)));\`));
  const loading = Promise.all([
    import(workerData.source + "/parallel.ts"),
    import(workerData.source + "/typescript/spec/compile.ts"),
    import(workerData.source + "/typescript/spec/prepare.ts"),
  ]).then(([parallel, compile, prepare]) => ({
    check: parallel.check,
    compileToEscore: compile.compileToEscore,
    runtime: prepare.prepareRuntime(workerData.directory),
  }));
  loading.then(() => parentPort.postMessage({ id: -1 }));
  parentPort.on("message", async (spec) => {
    const loaded = await loading;
    try {
      const compiled = loaded.compileToEscore(readFileSync(spec.path, "utf8"), spec.path, loaded.runtime, spec.isModule);
      const result = await loaded.check({ ...compiled, workers: 1, onPrint: () => {} });
      parentPort.postMessage({ id: spec.id, status: result.status, message: result.failure?.message });
    } catch (error) {
      parentPort.postMessage({ id: spec.id, status: "stopped", message: error.message });
    }
  });`,
  {
    eval: true,
    workerData: {
      source: pathToFileURL(join(import.meta.dirname, "../../src")).href,
      directory: join(import.meta.dirname, "../../ecmascript"),
    },
    resourceLimits: { stackSizeMb: 256 },
  },
);
worker.unref();

const directories: string[] = [];
afterAll(() => {
  directories.forEach((directory) => rmSync(directory, { recursive: true, force: true }));
  return worker.terminate();
});

const pending: ((result: ModuleResult) => void)[] = [];
const ready = new Promise((resolve) => {
  worker.on("message", (result: ModuleResult & { id: number }) =>
    result.id === -1 ? resolve(undefined) : pending[result.id](result),
  );
});
// The worker prepares the runtime before the first check, which takes longer than a check.
beforeAll(() => ready, 60_000);

// Checks a program whose entry is main.js, in a directory of its files, whose package makes each
// JavaScript file an ES module unless the files give a package.json of their own, as Node runs
// them.
const checkModules = (files: Record<string, string>, isModule = true) => {
  const directory = mkdtempSync(join(tmpdir(), "escore-modules-"));
  directories.push(directory);
  Object.entries({ "package.json": '{ "type": "module" }', ...files }).forEach((entry) => {
    mkdirSync(dirname(join(directory, entry[0])), { recursive: true });
    writeFileSync(join(directory, entry[0]), entry[1]);
  });
  return new Promise<ModuleResult>((resolve) => {
    worker.postMessage({ id: pending.length, path: join(directory, "main.js"), isModule });
    pending.push(resolve);
  });
};

// Writes a program's files into a directory of their own, and checks the program from entry, as
// Node runs it, with the status that Node exits with.
const checkEntry = (files: Record<string, string>, entry: string) => {
  const directory = mkdtempSync(join(tmpdir(), "escore-kinds-"));
  directories.push(directory);
  Object.entries(files).forEach((file) => writeFileSync(join(directory, file[0]), file[1]));
  const node = spawnSync(process.execPath, [join(directory, entry)], { encoding: "utf8" }).status;
  return new Promise<ModuleResult & { node: number | null }>((resolve) => {
    worker.postMessage({
      id: pending.length,
      path: join(directory, entry),
      isModule: true,
    });
    pending.push((result) => resolve({ ...result, node }));
  });
};

const THREW = "the script threw an exception";

// A module whose code throws unless its log, joined, is what's expected.
const getMain = (imports: string, expected: string) => `${imports}
const result = log.join();
if (result !== "${expected}") throw new Error(result);
`;

describe("compiles modules by specializing ESCore", () => {
  describe("links imports to the live bindings of the modules that export them", () => {
    const getFiles = (expected: string) => ({
      "main.js": getMain(
        `import { count, increment } from "./counter.js";
        import * as counter from "./counter.js";
        import name, { label as renamed } from "./counter.js";
        const log = [];
        log.push(count);
        increment();
        increment();
        log.push(count, counter.count, name(), name.name, renamed, Object.keys(counter));`,
        expected,
      ),
      "counter.js": `export let count = 0;
        export function increment() { count++; }
        export default function () { return "unnamed"; }
        const label = "label";
        export { label };`,
    });

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getFiles("0,2,2,unnamed,default,label,count,default,increment,label")))
          .message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkModules(getFiles("0,1,2,unnamed,default,label,count,default,increment,label")))
          .message,
      ).toContain(THREW);
    });
  });

  describe("evaluates a cycle and an awaiting module in ESCore's order", () => {
    const getFiles = (expected: string) => ({
      "main.js": getMain(
        `import { log } from "./log.js";
        import "./slow.js";
        import "./fast.js";
        import { early, readLate } from "./cycle-a.js";
        log.push("main", early(), readLate());`,
        expected,
      ),
      "log.js": "export const log = [];",
      "slow.js": `import { log } from "./log.js";
        log.push("slow start");
        await null;
        log.push("slow end");`,
      "fast.js": `import { log } from "./log.js";
        log.push("fast");`,
      "cycle-a.js": `import { log } from "./log.js";
        import { hoisted, late } from "./cycle-b.js";
        log.push(hoisted(), late);
        export const value = "value";
        export function early() { return "early"; }
        export function readLate() { return late + value; }`,
      "cycle-b.js": `import { log } from "./log.js";
        import { early, value } from "./cycle-a.js";
        let tdz = "none";
        try { value; } catch (error) { tdz = error.constructor.name; }
        log.push(early(), tdz);
        export function hoisted() { return "hoisted"; }
        export const late = "late";`,
    });

    it("agrees with Node", async () => {
      expect(
        (
          await checkModules(
            getFiles(
              "slow start,fast,early,ReferenceError,hoisted,late,slow end,main,early,latevalue",
            ),
          )
        ).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (
          await checkModules(
            getFiles(
              "slow start,slow end,fast,early,ReferenceError,hoisted,late,main,early,latevalue",
            ),
          )
        ).message,
      ).toContain(THREW);
    });
  });

  describe("resolves star exports and leaves out an ambiguous name", () => {
    const getFiles = (expected: string) => ({
      "main.js": getMain(
        `import * as all from "./star.js";
        const log = [Object.keys(all).join("|"), Object.prototype.toString.call(all), "x" in all, all.y, all.b];`,
        expected,
      ),
      "star.js": `export * from "./one.js";
        export * from "./two.js";
        export { y as "b" } from "./one.js";`,
      "one.js": `export const x = 1; export const y = "Y";`,
      "two.js": "export const x = 2;",
    });

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getFiles("b|y,[object Module],false,Y,Y"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles("b|x|y,[object Module],true,Y,Y"))).message).toContain(
        THREW,
      );
    });
  });

  describe("gives each module the import.meta that Node gives it", () => {
    const getFiles = (expected: string) => ({
      "main.js": getMain(
        `import { meta as other } from "./other.js";
        const log = [typeof import.meta, Object.getPrototypeOf(import.meta), Reflect.ownKeys(import.meta).join("|"), import.meta.main, other.main, other === import.meta, import.meta === import.meta, Object.isExtensible(import.meta)];`,
        expected,
      ),
      "other.js": "export const meta = import.meta;",
    });

    it("agrees with Node", async () => {
      expect(
        (
          await checkModules(
            getFiles("object,,dirname|filename|main|resolve|url,true,false,false,true,true"),
          )
        ).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (
          await checkModules(
            getFiles("object,,dirname|filename|main|resolve|url,true,true,false,true,true"),
          )
        ).message,
      ).toContain(THREW);
    });

    describe("gives the url, the filename, and the directory of the module's file", () => {
      const getWhere = (expected: string) => ({
        "main.js": getMain(
          `const meta = import.meta;
          const log = [meta.url === "file://" + meta.filename, meta.dirname + "/main.js" === meta.filename, typeof meta.resolve, meta.resolve.name, meta.resolve.length, Object.getOwnPropertyDescriptor(meta, "url").writable];`,
          expected,
        ),
      });

      it("agrees with Node", async () => {
        expect(
          (await checkModules(getWhere("true,true,function,resolve,1,true"))).message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect(
          (await checkModules(getWhere("true,false,function,resolve,1,true"))).message,
        ).toContain(THREW);
      });
    });

    it("stops at a call of resolve, which the runtime leaves out", async () => {
      expect(
        (await checkModules({ "main.js": 'import.meta.resolve("./main.js");' })).message,
      ).toContain("tla-ts can't");
    });
  });

  describe("runs import() in the jobs that Node's loader takes", () => {
    // A module that counts jobs as they run and logs when each import() settles.
    const getImporting = (imports: string, expected: string) => ({
      "main.js": `import "./static.js";
        const log = [];
        globalThis.order = log;
        let tick = 0;
        globalThis.tick = () => tick;
        const spin = () => { if (tick < 40) { tick++; Promise.resolve().then(spin); } };
        spin();
        ${imports}
        setTimeout(() => { if (log.join() !== "${expected}") throw new Error(log.join()); });`,
      "static.js": "export const s = 1;",
      "fresh.js":
        'export const f = 1; globalThis.order.push("body@" + globalThis.tick()); Promise.resolve().then(() => globalThis.order.push("job@" + globalThis.tick()));',
      "deep.js": 'import "./leaf.js"; export const deep = 1;',
      "leaf.js": "export const leaf = 1;",
      "throws.js": 'throw new Error("bad");',
      "counter.cjs": "exports.count = 1;",
      "throws.cjs": 'throw new Error("cjs bad");',
    });
    const imports = `import("./static.js").then(() => log.push("static@" + tick));
      import("./fresh.js").then((ns) => log.push("fresh@" + tick + ":" + Object.keys(ns)));
      import("./deep.js").then(() => log.push("deep@" + tick));
      import("./counter.cjs").then((ns) => log.push("cjs@" + tick + ":" + ns.count));
      import("./throws.js").catch((error) => log.push("rejected@" + tick + ":" + error.message));
      import("./throws.cjs").catch((error) => log.push("cjs rejected@" + tick + ":" + error.message));`;

    it("agrees with Node", async () => {
      expect(
        (
          await checkModules(
            getImporting(
              imports,
              "body@6,job@7,static@9,cjs rejected@11:cjs bad,fresh@12:f,cjs@12:1,rejected@12:bad,deep@14",
            ),
          )
        ).message,
      ).toBeUndefined();
    });

    it("rejects another order", async () => {
      expect(
        (
          await checkModules(
            getImporting(
              imports,
              "body@6,job@7,static@9,fresh@12:f,cjs@12:1,cjs rejected@12:cjs bad,rejected@12:bad,deep@14",
            ),
          )
        ).message,
      ).toContain(THREW);
    });
  });

  describe("runs import() on the built-ins as the realm first has them, as Node's primordials", () => {
    const getFiles = (expected: string) => ({
      "main.js": `const log = [];
        const then = Promise.prototype.then;
        globalThis.Promise = function () { throw new Error("Promise"); };
        Map.prototype.get = function () { throw new Error("get"); };
        Set.prototype.has = function () { throw new Error("has"); };
        Array.prototype.map = function () { throw new Error("map"); };
        then.call(import("./imported.js"), (ns) => log.push(ns.value), (error) => log.push(error.message));
        setTimeout(() => { if (log.join() !== "${expected}") throw new Error(log.join()); });`,
      "imported.js": 'import "./leaf.js"; export const value = 1;',
      "leaf.js": "export const leaf = 1;",
    });

    it("agrees with Node", async () => {
      expect((await checkModules(getFiles("1"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles("Promise"))).message).toContain(THREW);
    });
  });

  describe("throws a SyntaxError where Node loads a module with an early error", () => {
    const getFiles = (expected: string) => ({
      "main.js": `import requires from "./requires.cjs";
        const log = [requires];
        let tick = 0;
        const spin = () => { if (tick < 40) { tick++; Promise.resolve().then(spin); } };
        spin();
        import("./clash.js").catch((error) => log.push(error.name + "@" + tick));
        import("./imports-clash.js").catch((error) => log.push(error.name + "@" + tick));
        import("./clash.cjs").catch((error) => log.push(error.name + "@" + tick));
        setTimeout(() => { if (log.join() !== "${expected}") throw new Error(log.join()); });`,
      "clash.js": "var name; function name() {}",
      "imports-clash.js": 'import "./clash.js";',
      "clash.cjs": "let name; var name;",
      "requires.cjs": `const names = [];
        try { require("./clash.cjs"); } catch (error) { names.push(error.name); }
        try { require("./clash.js"); } catch (error) { names.push(error.name); }
        module.exports = names.join("/");`,
    });

    it("agrees with Node", async () => {
      expect(
        (
          await checkModules(
            getFiles("SyntaxError/SyntaxError,SyntaxError@6,SyntaxError@6,SyntaxError@11"),
          )
        ).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (
          await checkModules(
            getFiles("SyntaxError/SyntaxError,SyntaxError@6,SyntaxError@6,SyntaxError@12"),
          )
        ).message,
      ).toContain(THREW);
    });

    it("fails as Node does at a static import of one", async () => {
      expect(
        (
          await checkModules({
            "main.js": 'import "./clash.js";',
            "clash.js": "let name; var name;",
          })
        ).message,
      ).toContain(THREW);
    });
  });

  // Node parses a CommonJS file in its wrapper, whose function takes a return at the file's top
  // level, and an ES module as a module, where a return there is a SyntaxError.
  describe("parses each file in its own goal, as node --check does", () => {
    const files = {
      "returns.cjs": "module.exports = 1;\nreturn;\nmodule.exports = 2;",
      "returns.mjs": "export const value = 1;\nreturn;",
    };
    const getFiles = (expected: string) => ({
      ...files,
      "main.js": `import value from "./returns.cjs";
        const log = [value];
        import("./returns.mjs").catch((error) => log.push(error.name));
        setTimeout(() => { if (log.join() !== "${expected}") throw new Error(log.join()); });`,
    });

    it("takes a CommonJS file's top-level return and rejects an ES module's, as node --check does", () => {
      const directory = mkdtempSync(join(tmpdir(), "escore-goals-"));
      directories.push(directory);
      Object.entries(files).forEach((file) => writeFileSync(join(directory, file[0]), file[1]));
      const getCheck = (file: string) =>
        spawnSync(process.execPath, ["--check", join(directory, file)], { encoding: "utf8" });
      expect(getCheck("returns.cjs").status).toBe(0);
      expect(getCheck("returns.mjs").stderr).toContain("SyntaxError: Illegal return statement");
    });

    it("agrees with Node", async () => {
      expect((await checkModules(getFiles("1,SyntaxError"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles("2,SyntaxError"))).message).toContain(THREW);
    });
  });

  describe("runs import() of a script, which loads modules as a module's does", () => {
    const getScript = (expected: string) => ({
      "main.js": `var log = [];
        import("./static.js").then((ns) => { log.push(Object.keys(ns).join()); return import("./static.js"); }).then(() => log.push("again"));
        setTimeout(() => { if (log.join() !== "${expected}") throw new Error(log.join()); });`,
      "static.js": "export const s = 1;",
    });

    it("agrees with Node", async () => {
      expect((await checkModules(getScript("s,again"), false)).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getScript("again,s"), false)).message).toContain(THREW);
    });
  });

  describe("fails as Node does where a module throws or imports a name no module exports", () => {
    it("rejects a module that throws", async () => {
      expect(
        (await checkModules({ "main.js": 'import "./throws.js";', "throws.js": "throw 1;" }))
          .message,
      ).toContain(THREW);
    });

    it("rejects an import of a missing export", async () => {
      expect(
        (
          await checkModules({
            "main.js": 'import { missing } from "./empty.js"; missing;',
            "empty.js": "export {};",
          })
        ).message,
      ).toContain(THREW);
    });

    it("accepts a module whose dependency catches its own error", async () => {
      expect(
        (
          await checkModules({
            "main.js": 'import "./catches.js";',
            "catches.js": "try { throw 1; } catch {}",
          })
        ).message,
      ).toBeUndefined();
    });
  });
});

describe("gives a module the host's globals and properties that ESCore lacks, which stop where its code uses them", () => {
  const getFiles = (expected: string) => ({
    "main.js": getMain(
      `const log = [];
      function warn(error) { console.warn(error); Error.captureStackTrace(error); }
      log.push(typeof setImmediate, typeof console, typeof Buffer, typeof process, "process" in globalThis, typeof warn, Error.stackTraceLimit, typeof Error.captureStackTrace);`,
      expected,
    ),
  });

  it("agrees with Node", async () => {
    expect(
      (await checkModules(getFiles("function,object,function,object,true,function,10,function")))
        .message,
    ).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect(
      (await checkModules(getFiles("function,object,object,object,true,function,10,function")))
        .message,
    ).toContain(THREW);
  });

  it("stops at a call of a global", async () => {
    expect((await checkModules({ "main.js": "setImmediate(() => {});" })).message).toContain(
      "tla-ts can't run the host's setImmediate",
    );
  });

  it("stops at a new of a global that the host constructs, rather than throw", async () => {
    expect(
      (await checkModules({ "main.js": 'const url = new URL("https://example.com");' })).message,
    ).toContain("tla-ts can't run the host's URL");
  });

  describe("makes an object of a constructor that makes one quietly, which stops where it's used", () => {
    const getQuiet = (expected: string) => ({
      "main.js": getMain(
        `const log = [];
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        function encode(text) { return encoder.encode(text); }
        log.push(typeof encoder, typeof decoder, encoder === decoder, typeof encode);`,
        expected,
      ),
    });

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getQuiet("object,object,false,function"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getQuiet("object,object,true,function"))).message).toContain(
        THREW,
      );
    });

    it("stops at a use of the object", async () => {
      expect((await checkModules({ "main.js": "new TextDecoder().decode();" })).message).toContain(
        "tla-ts can't run the host's TextDecoder",
      );
    });

    it("stops at a label of another encoding", async () => {
      expect((await checkModules({ "main.js": 'new TextDecoder("utf-16le");' })).message).toContain(
        "tla-ts can't run the host's TextDecoder",
      );
    });

    describe("reads a TextDecoder's options as Node does", () => {
      const getOptions = (expected: string) => ({
        "main.js": getMain(
          `const log = [];
          new TextDecoder("utf-8", { get fatal() { log.push("fatal"); return true; }, get ignoreBOM() { log.push("bom"); return true; } });`,
          expected,
        ),
      });

      it("agrees with Node", async () => {
        expect((await checkModules(getOptions("fatal,bom,bom,fatal"))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkModules(getOptions("fatal,bom"))).message).toContain(THREW);
      });
    });
  });

  it("stops at a class that extends a global of the host", async () => {
    expect(
      (await checkModules({ "main.js": "class Target extends EventTarget {}" })).message,
    ).toContain("tla-ts can't run the host's EventTarget");
  });

  it("stops at a call of a built-in's method that only the host has", async () => {
    expect((await checkModules({ "main.js": "Error.captureStackTrace({});" })).message).toContain(
      "tla-ts can't run the host's captureStackTrace",
    );
  });
});

describe("gives a module the part of Node's process and TextEncoder that Effect loads with", () => {
  const getFiles = (expected: string) => ({
    "main.js": getMain(
      `const log = [];
      const AsyncResource = globalThis.process?.getBuiltinModule?.("node:async_hooks")?.AsyncResource;
      const resource = new AsyncResource("effect/Fiber");
      const ran = resource.runInAsyncScope(function (a, b) { return [this.tag, a, b].join("-"); }, { tag: "t" }, 1, 2);
      const hrtime = globalThis.process?.hrtime;
      const encoder = new TextEncoder();
      log.push(AsyncResource.name, AsyncResource.length, ran, resource.emitDestroy() === resource, typeof hrtime, typeof hrtime?.bigint);
      log.push(encoder.encoding, Array.from(encoder.encode("a\u00e9\u20ac\ud83d\ude00\ud800")).join(" "), encoder.encode().length);`,
      expected,
    ),
  });

  it("agrees with Node", async () => {
    expect(
      (
        await checkModules(
          getFiles(
            "AsyncResource,1,t-1-2,true,function,function,utf-8,97 195 169 226 130 172 240 159 152 128 239 191 189,0",
          ),
        )
      ).message,
    ).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect(
      (
        await checkModules(
          getFiles(
            "AsyncResource,1,t-1-2,true,function,function,utf-8,97 195 169 226 130 172 240 159 152 128 237 160 128,0",
          ),
        )
      ).message,
    ).toContain(THREW);
  });

  it("stops at a call of hrtime's bigint", async () => {
    expect((await checkModules({ "main.js": "process.hrtime.bigint();" })).message).toContain(
      "tla-ts can't run the host's process.hrtime.bigint",
    );
  });
});

// Node's performance.now, whose name and length a program reads, which it calls on performance,
// and which throws a TypeError where it's called on another object, so the check stops there, as
// it does at every other use of the function.
describe("calls performance.now on performance, and stops at every other use", () => {
  const getFiles = (expected: string) => ({
    "main.js": getMain(
      `const log = [];
      log.push(typeof performance.now, performance.now.name, performance.now.length, typeof performance.now());`,
      expected,
    ),
  });

  it("agrees with Node", async () => {
    expect((await checkModules(getFiles("function,now,0,number"))).message).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect((await checkModules(getFiles("function,now,1,number"))).message).toContain(THREW);
  });

  it.each([
    "performance.now.call({})",
    "const { now } = performance; now()",
    "String(performance.now)",
    "performance.now.toString()",
    "performance.now.prototype",
    "Object.keys(performance.now)",
    "Object.getPrototypeOf(performance.now)",
  ])("stops at %s", async (use) => {
    expect((await checkModules({ "main.js": `${use};` })).message).toContain(
      "tla-ts can't run the host's performance.now",
    );
  });
});

// A global binding that holds the host's performance, which HasBinding and GetBindingValue read
// natively from the global object's own data property, and a missing one, which reaches the trap
// of a proxy on the global object's prototype, so that the host's object and the trap still run.
describe("reads global bindings through the global object and the proxy on its prototype", () => {
  const getFiles = (expected: string) => ({
    "main.js": getMain(
      `const log = [];
      globalThis.clock = performance;
      log.push(typeof clock.now(), clock === performance, typeof globalThis.clock);
      Object.setPrototypeOf(globalThis, new Proxy(Object.getPrototypeOf(globalThis), {
        has(target, key) {
          if (key === "probe") log.push("has");
          return Reflect.has(target, key);
        },
      }));
      try { probe; } catch (error) { log.push(error.name); }`,
      expected,
    ),
  });

  it("agrees with Node", async () => {
    expect(
      (await checkModules(getFiles("number,true,object,has,ReferenceError"))).message,
    ).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect((await checkModules(getFiles("number,true,object,ReferenceError"))).message).toContain(
      THREW,
    );
  });

  it("stops where a global binding's host object would", async () => {
    expect(
      (await checkModules({ "main.js": "globalThis.clock = performance; clock.now.call({});" }))
        .message,
    ).toContain("tla-ts can't run the host's performance.now");
  });
});

// The source text of a function of the host, which Node gives as its own code has it, stops, where
// a proxy would give a native function's text that Node doesn't.
describe("stops at the source text of the host's functions", () => {
  const getFiles = (expected: string) => ({
    "main.js": getMain(
      `const log = [];
      function add(a, b) { return a + b; }
      log.push(Function.prototype.toString.call(Math.max), String(add));`,
      expected,
    ),
  });

  it("agrees with Node", async () => {
    expect(
      (
        await checkModules(
          getFiles("function max() { [native code] },function add(a, b) { return a + b; }"),
        )
      ).message,
    ).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect(
      (
        await checkModules(
          getFiles("function () { [native code] },function add(a, b) { return a + b; }"),
        )
      ).message,
    ).toContain(THREW);
  });

  it.each([
    "structuredClone",
    "setImmediate",
    "process.getBuiltinModule",
    "import.meta.resolve",
    'Object.getOwnPropertyDescriptor(globalThis, "performance").get',
  ])("stops at the source text of %s", async (host) => {
    expect(
      (await checkModules({ "main.js": `Function.prototype.toString.call(${host});` })).message,
    ).toContain("tla-ts can't give the source text of the host's function");
  });
});

// process.getBuiltinModule, whose name and length are Node's, loads async_hooks, and stops at
// every other use, such as its prototype, which Node's, an ordinary function, has.
describe("calls process.getBuiltinModule as Node does, and stops at every other use", () => {
  const getFiles = (expected: string) => ({
    "main.js": getMain(
      `const log = [];
      const load = process.getBuiltinModule;
      log.push(load.name, load.length, typeof load("async_hooks"), load("async_hooks") === load("node:async_hooks"));`,
      expected,
    ),
  });

  it("agrees with Node", async () => {
    expect(
      (await checkModules(getFiles("getBuiltinModule,1,object,true"))).message,
    ).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect((await checkModules(getFiles("getBuiltinModule,2,object,true"))).message).toContain(
      THREW,
    );
  });

  it.each([
    "typeof process.getBuiltinModule.prototype",
    "Reflect.ownKeys(process.getBuiltinModule)",
    'new process.getBuiltinModule("async_hooks")',
    'process.getBuiltinModule.call(null, "async_hooks")',
    "String(process.getBuiltinModule)",
  ])("stops at %s", async (use) => {
    expect((await checkModules({ "main.js": `${use};` })).message).toContain(
      "tla-ts can't run the host's getBuiltinModule",
    );
  });
});

describe("gives a module a Timeout of setTimeout, which stops where its code uses it", () => {
  const getFiles = (expected: string) => ({
    "main.js": `const log = [];
      const handle = setTimeout(() => log.push("timer"));
      log.push(typeof handle, handle === setTimeout(() => {}));
      setTimeout(() => { if (log.join() !== "${expected}") throw new Error(log.join()); });`,
  });

  it("agrees with Node", async () => {
    expect((await checkModules(getFiles("object,false,timer"))).message).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect((await checkModules(getFiles("object,true,timer"))).message).toContain(THREW);
  });

  it("stops at a use of the Timeout", async () => {
    expect((await checkModules({ "main.js": "setTimeout(() => {}).unref();" })).message).toContain(
      "tla-ts can't run the host's Timeout",
    );
  });
});

describe("gives a module the part of Node's console that writes primitives and makes tasks", () => {
  const getFiles = (expected: string) => ({
    "main.js": getMain(
      `const log = [];
      const task = console.createTask("work");
      log.push(typeof console.log, console.log === console.log, console.log.name, console.log.length, task.run(() => 7), Object.keys(task).join(), task.run === console.createTask("other").run, task.run.name, task.run.length);
      console.error("warning", 1, true);`,
      expected,
    ),
  });

  it("agrees with Node", async () => {
    expect(
      (await checkModules(getFiles("function,true,log,0,7,run,true,run,0"))).message,
    ).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect(
      (await checkModules(getFiles("function,true,log,0,7,run,true,run,1"))).message,
    ).toContain(THREW);
  });

  it("stops at a write of an object, which Node formats", async () => {
    expect((await checkModules({ "main.js": "console.log({});" })).message).toContain(
      "tla-ts can't write an object to the host's console",
    );
  });

  // A task's run, whose name and length are Node's, is an ordinary function in Node, with a
  // prototype and a new that throws an Error, so every use of it but a call stops.
  it.each([
    "typeof task.run.prototype",
    "Reflect.ownKeys(task.run)",
    "new task.run(() => 1)",
    "task.run.call(task, () => 1)",
    "String(task.run)",
  ])("stops at %s", async (use) => {
    expect(
      (await checkModules({ "main.js": `const task = console.createTask("work"); ${use};` }))
        .message,
    ).toContain("tla-ts can't run the host's console task's run");
  });
});

describe("compiles CommonJS modules as Node loads them", () => {
  // A CommonJS module that requires others, of a package without a type.
  const getFiles = (main: string, expected: string) => ({
    "package.json": "{}",
    "main.js": `const log = [];
      ${main}
      const result = log.join();
      if (result !== "${expected}") throw new Error(result);`,
    "counter.js": "let count = 0; exports.next = () => ++count;",
    "a.js": `exports.__esModule = true;
      exports.name = "a";
      const b = require("./b.js");
      exports.fromB = b.seen;`,
    "b.js": `const a = require("./a.js");
      module.exports = { seen: a.name + ":" + a.fromB };`,
    "throws.js": `globalThis.loads = (globalThis.loads || 0) + 1;
      throw new Error("load " + globalThis.loads);`,
    "plain.js": `exports.name = "plain"; require("./reads-plain.js");`,
    "reads-plain.js": `require("./plain.js");`,
  });

  describe("runs each module once, with its exports as this, and requires again after a throw", () => {
    const main = `const counter = require("./counter.js");
      const again = require("./counter");
      log.push(counter === again, counter.next(), again.next(), this === exports, __filename.endsWith("main.js"));
      try { require("./throws.js"); } catch (error) { log.push(error.message); }
      try { require("./throws.js"); } catch (error) { log.push(error.message); }`;

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getFiles(main, "true,1,2,true,true,load 1,load 2"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkModules(getFiles(main, "true,1,2,true,true,load 1,load 1"))).message,
      ).toContain(THREW);
    });
  });

  // Node's util, of which a program reads only TextEncoder, the global's own, as React's server
  // builds do, and each require gives the same object.
  describe("requires Node's util, which stops where the code uses more of it", () => {
    const main = `const util = require("util");
      log.push(util === require("node:util"), util.TextEncoder === TextEncoder, new util.TextEncoder().encode("é").length);`;

    it("agrees with Node", async () => {
      expect((await checkModules(getFiles(main, "true,true,2"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles(main, "true,true,1"))).message).toContain(THREW);
    });

    it.each([
      "util.inspect",
      '"TextEncoder" in util',
      "Object.keys(util)",
      "Reflect.ownKeys(util)",
      "Object.getPrototypeOf(util)",
      'Object.defineProperty(util, "x", { value: 1 })',
      "util.x = 1",
      "delete util.TextEncoder",
      "({ ...util })",
      "JSON.stringify(util)",
      "globalThis.TextEncoder = class {}; util.TextEncoder",
    ])("stops at %s", async (use) => {
      expect(
        (await checkModules(getFiles(`const util = require("util"); ${use};`, ""))).message,
      ).toContain("tla-ts can't run the host's util");
    });
  });

  // Node's crypto and stream, which React's server builds require and use only in functions that
  // they export, and each require gives the same object, of the type Node's is.
  describe("requires Node's crypto and stream, which stop where the code uses them", () => {
    const main = `const crypto = require("crypto");
      const stream = require("stream");
      log.push(typeof crypto, typeof stream, crypto === require("node:crypto"), stream === require("node:stream"));`;

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getFiles(main, "object,function,true,true"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles(main, "object,object,true,true"))).message).toContain(
        THREW,
      );
    });

    it.each(
      ["crypto", "stream"].flatMap((name) =>
        [
          `${name}.createHash`,
          `"Readable" in ${name}`,
          `Object.keys(${name})`,
          `Reflect.ownKeys(${name})`,
          `Object.getPrototypeOf(${name})`,
          `Object.defineProperty(${name}, "x", { value: 1 })`,
          `${name}.x = 1`,
          `delete ${name}.Readable`,
          `({ ...${name} })`,
          `JSON.stringify(${name})`,
          ...(name === "stream" ? ["stream()", "new stream()"] : []),
        ].map((use) => [name, use]),
      ),
    )("stops at a use of %s: %s", async (name, use) => {
      expect(
        (await checkModules(getFiles(`const ${name} = require("${name}"); ${use};`, ""))).message,
      ).toContain(`tla-ts can't run the host's ${name}`);
    });
  });

  // Node's AsyncLocalStorage, which React's server builds make one of as they load, makes an
  // object of no arguments, whose every use stops, as its store follows the async context.
  describe("makes an AsyncLocalStorage of no arguments, which stops where the code uses it", () => {
    const main = `const Storage = require("async_hooks").AsyncLocalStorage;
      const storage = new Storage();
      log.push(typeof Storage, typeof storage, Storage === require("node:async_hooks").AsyncLocalStorage, storage !== new Storage());`;

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getFiles(main, "function,object,true,true"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles(main, "function,object,true,false"))).message).toContain(
        THREW,
      );
    });

    it.each([
      "storage.getStore()",
      "storage.run(1, () => 1)",
      "storage.enterWith(1)",
      "storage.exit(() => 1)",
      "storage.disable()",
      "Object.keys(storage)",
      "Object.getPrototypeOf(storage)",
      "JSON.stringify(storage)",
      "Object.prototype.toString.call(storage)",
      "storage instanceof Storage",
      "({}) instanceof Storage",
      "storage instanceof Object",
      "Storage.prototype",
      "Storage.name",
      "new Storage({})",
      "new Storage(undefined)",
      "Reflect.construct(Storage, [], Object)",
      "new (class extends Storage {})()",
      "Storage()",
    ])("stops at %s", async (use) => {
      expect(
        (
          await checkModules(
            getFiles(
              `const Storage = require("async_hooks").AsyncLocalStorage; const storage = new Storage(); ${use};`,
              "",
            ),
          )
        ).message,
      ).toContain("tla-ts can't run the host's AsyncLocalStorage");
    });
  });

  // Node's AsyncResource, whose name and length a program reads and whose objects it makes with
  // new, as Effect does, stops at every other use, such as an instanceof, which Node answers.
  describe("stops where the code uses AsyncResource other than to make its objects", () => {
    it.each([
      "({}) instanceof AsyncResource",
      "AsyncResource.prototype",
      "AsyncResource.bind",
      '"name" in AsyncResource',
      "Object.keys(AsyncResource)",
      'Object.getOwnPropertyDescriptor(AsyncResource, "name")',
      "Object.getPrototypeOf(AsyncResource)",
      "AsyncResource.x = 1",
      "delete AsyncResource.name",
      "JSON.stringify({ AsyncResource })",
      'AsyncResource("t")',
      'Reflect.construct(AsyncResource, ["t"], Object)',
      'new (class extends AsyncResource {})("t")',
    ])("stops at %s", async (use) => {
      expect(
        (
          await checkModules(
            getFiles(`const { AsyncResource } = require("async_hooks"); ${use};`, ""),
          )
        ).message,
      ).toContain("tla-ts can't run the host's AsyncResource");
    });
  });

  // An AsyncResource's runInAsyncScope and emitDestroy, whose names and lengths are Node's, run as
  // Node's do, and stop at every other use.
  describe("runs an AsyncResource's methods as Node does, and stops at every other use", () => {
    const main = `const { AsyncResource } = require("async_hooks");
      const resource = new AsyncResource("t");
      log.push(resource.runInAsyncScope.name, resource.runInAsyncScope.length, resource.emitDestroy.name, resource.emitDestroy.length);
      log.push(resource.runInAsyncScope(function (a, b) { return [this.tag, a, b].join("-"); }, { tag: "t" }, 1, 2), resource.emitDestroy() === resource);
      log.push(resource.runInAsyncScope === new AsyncResource("u").runInAsyncScope);`;

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getFiles(main, "runInAsyncScope,2,emitDestroy,0,t-1-2,true,true")))
          .message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkModules(getFiles(main, "runInAsyncScope,1,emitDestroy,0,t-1-2,true,true")))
          .message,
      ).toContain(THREW);
    });

    it.each([
      "resource.runInAsyncScope.prototype",
      "Object.keys(resource.emitDestroy)",
      "Object.getPrototypeOf(resource.runInAsyncScope)",
      "resource.runInAsyncScope.call(resource, () => 1)",
      "String(resource.emitDestroy)",
      "resource.runInAsyncScope.call({}, () => 1)",
      "Reflect.apply(resource.emitDestroy, {}, [])",
    ])("stops at %s", async (use) => {
      expect(
        (
          await checkModules(
            getFiles(
              `const { AsyncResource } = require("async_hooks"); const resource = new AsyncResource("t"); ${use};`,
              "",
            ),
          )
        ).message,
      ).toContain("tla-ts can't run the host's AsyncResource");
    });
  });

  describe("gives a module in a cycle the exports so far of the module that requires it", () => {
    const main = `const a = require("./a.js");
      log.push(a.name, a.fromB);`;

    it("agrees with Node", async () => {
      expect((await checkModules(getFiles(main, "a,a:undefined"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles(main, "a,a:a"))).message).toContain(THREW);
    });

    it("stops where Node gives a cycle's exports a prototype of its own", async () => {
      expect((await checkModules(getFiles('require("./plain.js");', ""))).message).toContain(
        "tla-ts can't give the exports of a CommonJS module in a cycle",
      );
    });
  });

  describe("reads Node's process.env as the process that compiles has it", () => {
    const main = (
      path: string,
    ) => `const mode = process.env.TLA_TS_UNSET === "production" ? require("./missing.js") : require("./counter.js");
      log.push(typeof process, process.env.PATH === ${JSON.stringify(path)}, process.env.TLA_TS_UNSET, mode.next());`;

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getFiles(main(process.env.PATH ?? ""), "object,true,,1"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles(main("/"), "object,true,,1"))).message).toContain(THREW);
    });

    it("stops at another use of process", async () => {
      expect((await checkModules(getFiles("log.push(process.argv);", ""))).message).toContain(
        "tla-ts can't run the host's process",
      );
    });
  });

  describe("stops at the module object and require only where the code uses more of them", () => {
    const main = `function load() { return module[("require" + log.length).slice(0, 7)]("timers"); }
      log.push(typeof module, typeof require, typeof load, require("./counter.js").next());`;

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getFiles(main, "object,function,function,1"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getFiles(main, "object,object,function,1"))).message).toContain(
        THREW,
      );
    });

    it("stops where the code runs", async () => {
      expect(
        (await checkModules(getFiles(`${main} load();`, "object,function,function,1"))).message,
      ).toContain("tla-ts can't use a CommonJS module's module");
    });
  });

  describe("gives an ES module a CommonJS module's exports as its default export", () => {
    const getImporting = (expected: string) => ({
      ...getFiles("", ""),
      "package.json": '{ "type": "module" }',
      "main.js": getMain(
        `import counter from "./counter.cjs";
        import again from "./counter.cjs";
        import "./side.cjs";
        import { order } from "./order.js";
        const log = [counter === again, counter.next(), again.next(), order];`,
        expected,
      ),
      "counter.cjs": 'let count = 0; exports.next = () => ++count; globalThis.order = "counter";',
      "side.cjs": 'globalThis.order += ",side";',
      "order.js": "export const order = globalThis.order;",
    });

    it("agrees with Node", async () => {
      expect((await checkModules(getImporting("true,1,2,counter,side"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkModules(getImporting("true,1,2,side,counter"))).message).toContain(THREW);
    });

    it("fails as Node does at an import of a name its lexer doesn't find", async () => {
      expect(
        (
          await checkModules({
            "main.js": 'import { hidden } from "./counter.cjs";',
            "counter.cjs": 'const name = "hidden"; exports[name] = 1;',
          })
        ).message,
      ).toContain(THREW);
    });
  });

  describe("requires an ES module as Node does", () => {
    const getRequiring = (expected: string) => ({
      ...getFiles(
        `const withDefault = require("./with-default.mjs");
        const again = require("./with-default.mjs");
        const named = require("./named.mjs");
        log.push(withDefault === again, Object.keys(withDefault).join("|"), withDefault.__esModule, withDefault.default(), Object.prototype.toString.call(withDefault));
        log.push(Object.keys(named).join("|"), named.__esModule, require("./whole.mjs"));
        try { require("./throws.mjs"); } catch (error) { log.push(error.message); }`,
        expected,
      ),
      "with-default.mjs": 'export default function () { return "d"; } export const x = 1;',
      "named.mjs": "export const y = 2; export const z = 3;",
      "whole.mjs": 'const value = "whole"; export { value as "module.exports" };',
      "throws.mjs": 'throw new Error("esm failed");',
    });

    it("agrees with Node", async () => {
      expect(
        (
          await checkModules(
            getRequiring("true,__esModule|default|x,true,d,[object Module],y|z,,whole,esm failed"),
          )
        ).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (
          await checkModules(
            getRequiring("true,default|x,true,d,[object Module],y|z,,whole,esm failed"),
          )
        ).message,
      ).toContain(THREW);
    });

    it("stops at a module that awaits at its top level, where Node throws", async () => {
      expect(
        (
          await checkModules({
            ...getFiles('require("./waits.mjs");', ""),
            "waits.mjs": "await null;",
          })
        ).message,
      ).toContain("tla-ts can't require an ES module that awaits");
    });
  });

  describe("loads a JSON file for an import of type json and a require, sharing its value", () => {
    const getJson = (expected: string) => ({
      ...getFiles("", ""),
      "package.json": '{ "type": "module" }',
      "data.json": '\ufeff{"a": [1, 2], "__proto__": 3}',
      "main.js": getMain(
        `import data from "./data.json" with { type: "json" };
        import * as ns from "./data.json" with { type: "json" };
        import { fromRequire } from "./reader.cjs";
        const log = [JSON.stringify(data), Object.keys(ns).join(), fromRequire === data, Object.getOwnPropertyNames(data).join()];`,
        expected,
      ),
      "reader.cjs": 'exports.fromRequire = require("./data.json");',
    });

    it("agrees with Node", async () => {
      expect(
        (await checkModules(getJson('{\\"a\\":[1,2],\\"__proto__\\":3},default,true,a,__proto__')))
          .message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkModules(getJson('{\\"a\\":[1,2],\\"__proto__\\":3},default,false,a,__proto__')))
          .message,
      ).toContain(THREW);
    });

    it("fails as Node does at an import of JSON without its type", async () => {
      expect(
        (await checkModules({ "main.js": 'import data from "./data.json";', "data.json": "1" }))
          .message,
      ).toContain(THREW);
    });
  });

  describe("gives an ES module the names that Node's lexer finds a CommonJS module exports", () => {
    const getNamed = (expected: string) => ({
      ...getFiles("", ""),
      "package.json": '{ "type": "module" }',
      "main.js": getMain(
        `import * as ns from "./lib.cjs";
        import lib, { a, b, later, thrower, "module.exports" as whole } from "./lib.cjs";
        import { c, d } from "./reexport.cjs";
        export * from "./reexport.cjs";
        import * as self from "./main.js";
        const log = [Object.keys(ns).join("|"), a, b, later, thrower, whole === lib, lib.notListed, c, d, Object.keys(self).join("|")];`,
        expected,
      ),
      "lib.cjs": `exports.a = 1;
        module.exports.b = 2;
        Object.defineProperty(exports, "thrower", { enumerable: true, get: function () { return x.thrower; } });
        exports.notListed2 = 0;
        if (false) exports.later = 3;
        const name = "notListed"; exports[name] = 4;`,
      "reexport.cjs": 'module.exports = require("./inner.cjs");',
      "inner.cjs": 'exports.c = "C"; exports.d = "D";',
    });

    it("agrees with Node", async () => {
      expect(
        (
          await checkModules(
            getNamed(
              "a|b|default|later|module.exports|notListed2|thrower,1,2,,,true,4,C,D,c|d|module.exports",
            ),
          )
        ).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (
          await checkModules(
            getNamed(
              "a|b|default|later|module.exports|notListed2|thrower,1,2,3,,true,4,C,D,c|d|module.exports",
            ),
          )
        ).message,
      ).toContain(THREW);
    });
  });

  it("stops at a module object's property other than exports", async () => {
    expect((await checkModules(getFiles("log.push(module.id);", "."))).message).toContain(
      "tla-ts can't use a CommonJS module's module",
    );
  });
});

// Each kind of file loads as Node loads it: .mts and .mjs as ES modules, .cts and .cjs as
// CommonJS, and .ts and .js as the package.json beside them says, whose types Node strips.
describe("loads each kind of file as Node does", () => {
  const LIBRARIES = ["ts", "mts", "cts", "js", "mjs", "cjs"];
  const isModuleKind = (extension: string, type: string) =>
    extension.startsWith("m") || (!extension.startsWith("c") && type === "module");
  // A library of each kind, named by its extension, which exports its extension and, in
  // TypeScript, a typed value.
  const getLibrary = (extension: string, type: string) => {
    const annotation = extension.endsWith("ts") ? ": string" : "";
    const value = `const kind${annotation} = "${extension}";`;
    return isModuleKind(extension, type)
      ? `${value}\nexport { kind };\nexport const where = typeof import.meta.url;\n`
      : `${value}\nexports.kind = kind;\nexports.where = typeof __filename;\n`;
  };
  // An entry of a kind that loads every library, as an import or a require, and throws unless
  // what they export, joined, is what's expected.
  const getEntry = (extension: string, type: string, expected: string) => {
    const isModule = isModuleKind(extension, type);
    const loads = LIBRARIES.map((library, index) =>
      isModule
        ? `import { kind as kind${index}, where as where${index} } from "./${library}.${library}";`
        : `const { kind: kind${index}, where: where${index} } = require("./${library}.${library}");`,
    );
    const values = LIBRARIES.map((_, index) => `kind${index} + where${index}`).join(", ");
    const self = isModule ? "typeof import.meta.filename" : "typeof __dirname";
    return `${loads.join("\n")}\nconst result = [${values}, ${self}].join();\nif (result !== "${expected}") throw new Error(result);\n`;
  };
  const getFiles = (entry: string, type: string, expected: string) => ({
    "package.json": `{ "type": "${type}" }`,
    ...Object.fromEntries(
      LIBRARIES.map((library) => [`${library}.${library}`, getLibrary(library, type)]),
    ),
    [`main.${entry}`]: getEntry(entry, type, expected),
  });
  const EXPECTED = [...LIBRARIES.map((library) => `${library}string`), "string"].join();

  describe.each(["module", "commonjs"])("in a package of type %s", (type) => {
    describe.each(LIBRARIES)("from an entry of .%s", (entry) => {
      it("agrees with Node", async () => {
        const result = await checkEntry(getFiles(entry, type, EXPECTED), `main.${entry}`);
        expect([result.node, result.message]).toEqual([0, undefined]);
      });

      it("rejects another result", async () => {
        const result = await checkEntry(getFiles(entry, type, "wrong"), `main.${entry}`);
        expect([result.node, result.message]).toEqual([1, expect.stringContaining(THREW)]);
      });
    });
  });

  // An import of a .js file loads the file that Node finds, which isn't the TypeScript file of its
  // name, so the compile stops where Node finds none, and where TypeScript would read the types of
  // that TypeScript file beside the .js file that Node loads.
  it("stops at an import of a .js file that only its TypeScript has, which Node doesn't find", async () => {
    const result = await checkEntry(
      {
        "package.json": '{ "type": "module" }',
        "lib.ts": 'export const kind: string = "ts";',
        "main.ts": 'import { kind } from "./lib.js";\nif (kind !== "ts") throw new Error(kind);\n',
      },
      "main.ts",
    );
    expect([result.node, result.message]).toEqual([
      1,
      expect.stringContaining("tla-ts can't load the module ./lib.js"),
    ]);
  });

  it("stops at an import of a .js file beside a TypeScript file of its name", async () => {
    const result = await checkEntry(
      {
        "package.json": '{ "type": "module" }',
        "lib.ts": 'export const kind: string = "ts";',
        "lib.js": 'export const kind = "js";',
        "main.js": 'import { kind } from "./lib.js";\nif (kind !== "ts") throw new Error(kind);\n',
      },
      "main.js",
    );
    expect([result.node, result.message]).toEqual([
      1,
      expect.stringContaining(
        "tla-ts can't read the types of a module that Node loads from another file than TypeScript reads",
      ),
    ]);
  });

  // Node runs a file of no module syntax, in a package that names no type, as CommonJS, in the
  // function it wraps a module's code in, with Node's globals.
  describe("runs a TypeScript file of no module syntax as CommonJS", () => {
    const getFiles = (expected: string) => ({
      "main.ts": `const kinds: string = [typeof process, typeof performance, typeof crypto, typeof Buffer, typeof require, typeof module, typeof __filename, this === module.exports].join();\nif (kinds !== "${expected}") throw new Error(kinds);\n`,
    });

    it("agrees with Node", async () => {
      const result = await checkEntry(
        getFiles("object,object,object,function,function,object,string,true"),
        "main.ts",
      );
      expect([result.node, result.message]).toEqual([0, undefined]);
    });

    it("rejects another result", async () => {
      const result = await checkEntry(
        getFiles("undefined,undefined,undefined,undefined,undefined,undefined,undefined,false"),
        "main.ts",
      );
      expect([result.node, result.message]).toEqual([1, expect.stringContaining(THREW)]);
    });
  });

  // Node's type stripping rejects syntax that it can't strip, which JavaScript runs.
  describe.each([
    [
      "a with statement",
      "const o = { a: 1 };\nwith (o) { a; }\n",
      "The 'with' statement is not supported",
    ],
    [
      "a function that an if declares",
      "const x = 1;\nif (x) function f() {}\n",
      "Declaration is not allowed",
    ],
  ])("rejects %s in TypeScript as Node does", (_, code, message) => {
    it("agrees with Node", async () => {
      const result = await checkEntry({ "main.js": code }, "main.js");
      expect([result.node, result.message]).toEqual([0, undefined]);
    });

    it("rejects another result", async () => {
      const result = await checkEntry({ "main.ts": code }, "main.ts");
      expect([result.node, result.status, result.message]).toEqual([
        1,
        "stopped",
        expect.stringContaining(message),
      ]);
    });
  });
});
