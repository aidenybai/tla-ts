import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { describe, expect, it } from "vite-plus/test";
import { compileToEscore } from "../../src/typescript/spec/compile";
import { createLibrary } from "../../src/typescript/spec/library";

const library = createLibrary(join(import.meta.dirname, "../../ecmascript"));

interface ScriptResult {
  status: string;
  message: string | undefined;
}

// ESCore's evaluation nests deeper than a test's stack, so the check runs on a worker with the
// stack that test262-engine262 gives ESCore.
const checkScript = (source: string) => {
  const spec = compileToEscore(`"use strict";\n${source}`, "spec.ts", library);
  const worker = new Worker(
    `const { parentPort, workerData } = require("node:worker_threads");
    import(workerData.url).then(async (tla) => {
      const result = await tla.check({
        source: workerData.source,
        config: workerData.config,
        loadModule: (name) => workerData.modules[name],
        onPrint: () => {},
      });
      parentPort.postMessage({ status: result.status, message: result.failure?.message });
    });`,
    {
      eval: true,
      workerData: {
        url: pathToFileURL(join(import.meta.dirname, "../../dist/index.js")).href,
        source: spec.source,
        config: spec.config,
        modules: Object.fromEntries(library.modules),
      },
      resourceLimits: { stackSizeMb: 256 },
    },
  );
  return new Promise<ScriptResult>((resolve, reject) => {
    worker.once("message", (result: ScriptResult) => {
      void worker.terminate();
      resolve(result);
    });
    worker.once("error", reject);
  });
};

const THREW = "the script threw an exception";

describe("compiles scripts by specializing ESCore", () => {
  describe("runs closures that keep their environments", () => {
    const getSource = (expected: string) => `
      const makeCounter = () => {
        let count = 0;
        return { next: () => ++count, peek() { return count; } };
      };
      const first = makeCounter();
      const second = makeCounter();
      first.next();
      first.next();
      second.next();
      const adders: ((value: number) => number)[] = [];
      for (let index = 0; index < 3; index++) adders.push((value) => value + index);
      const result = [first.peek(), second.peek(), adders[0](10), adders[2](10)].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("2,1,10,12"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("2,2,10,12"))).message).toContain(THREW);
    });
  });

  describe("calls a function that only a value at run time picks", () => {
    const getSource = (expected: string) => `
      const handlers = [(value: number) => value * 2, (value: number) => value + 100];
      function apply(this: { offset: number }, pick: number, value: number) {
        return handlers[pick % handlers.length](value) + this.offset;
      }
      const bound = apply.bind({ offset: 1 }, 3);
      const result = [bound(5), apply.call({ offset: 0 }, 2, 7), apply.apply({ offset: 2 }, [1, 1])].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("106,14,103"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("106,14,104"))).message).toContain(THREW);
    });
  });
});
