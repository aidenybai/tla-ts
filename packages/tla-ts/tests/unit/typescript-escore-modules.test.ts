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

// ESCore's evaluation nests deeper than a test's stack, so checks run on one worker with the
// stack that test262-engine262 gives ESCore, which prepares ESCore's runtime once for them all.
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
      const compiled = loaded.compileToEscore(readFileSync(spec.path, "utf8"), spec.path, loaded.runtime, true);
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
const checkModules = (files: Record<string, string>) => {
  const directory = mkdtempSync(join(tmpdir(), "escore-modules-"));
  directories.push(directory);
  Object.entries({ "package.json": '{ "type": "module" }', ...files }).forEach((entry) => {
    mkdirSync(dirname(join(directory, entry[0])), { recursive: true });
    writeFileSync(join(directory, entry[0]), entry[1]);
  });
  return new Promise<ModuleResult>((resolve) => {
    worker.postMessage({ id: pending.length, path: join(directory, "main.js") });
    pending.push(resolve);
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

  it("stops at a call of a built-in's method that only the host has", async () => {
    expect((await checkModules({ "main.js": "Error.captureStackTrace({});" })).message).toContain(
      "tla-ts can't run the host's captureStackTrace",
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
      log.push(typeof console.log, console.log === console.log, console.log.name, console.log.length, task.run(() => 7), Object.keys(task).join(), task.run === console.createTask("other").run);
      console.error("warning", 1, true);`,
      expected,
    ),
  });

  it("agrees with Node", async () => {
    expect(
      (await checkModules(getFiles("function,true,log,0,7,run,true"))).message,
    ).toBeUndefined();
  });

  it("rejects another result", async () => {
    expect((await checkModules(getFiles("function,true,log,0,7,run,false"))).message).toContain(
      THREW,
    );
  });

  it("stops at a write of an object, which Node formats", async () => {
    expect((await checkModules({ "main.js": "console.log({});" })).message).toContain(
      "tla-ts can't write an object to the host's console",
    );
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
    const main = `function load() { return module[("require" + Math.random()).slice(0, 7)]("timers"); }
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

    it("stops at an import of another name", async () => {
      expect(
        (
          await checkModules({
            "main.js": 'import { next } from "./counter.cjs";',
            "counter.cjs": "exports.next = () => 1;",
          })
        ).message,
      ).toContain("tla-ts can't import names other than default from a CommonJS module");
    });
  });

  it("stops at a module object's property other than exports", async () => {
    expect((await checkModules(getFiles("log.push(module.id);", "."))).message).toContain(
      "tla-ts can't use a CommonJS module's module",
    );
  });
});
