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
const checkScript = (source: string, isStrict = true) => {
  const spec = compileToEscore(`${isStrict ? '"use strict";' : ""}\n${source}`, "spec.ts", library);
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

  describe("runs a script outside strict mode as sloppy code", () => {
    const getSource = (expected: string) => `
      function mapped(first: unknown) {
        arguments[0] = 9;
        return first;
      }
      function getThis(this: unknown) {
        return this === globalThis;
      }
      const result = [mapped(1), getThis()].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("9,true"), false)).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("1,true"), false)).message).toContain(THREW);
    });
  });

  describe("runs classes, accessors, loops, and exceptions as ESCore does", () => {
    const getSource = (expected: string) => `
      class Shape {
        sides = 0;
        constructor(public name: string) {}
        get label() { return this.name + ":" + this.sides; }
        static make(name: string) { return new this(name); }
      }
      class Square extends Shape {
        sides = 4;
        get label() { return "[" + super.label + "]"; }
      }
      const square = Square.make("sq");
      let log = square.label + "," + (square instanceof Shape);
      try {
        (Shape as unknown as () => void)();
      } catch (error) {
        log += "," + (error as Error).constructor.name;
      } finally {
        log += ",done";
      }
      outer: for (const value of [1, 2, 3]) {
        switch (value) {
          case 2:
            continue outer;
          default:
            log += value;
        }
      }
      if (log !== "${expected}") throw new Error(log);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("[sq:4],true,TypeError,done13"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("[sq:4],true,TypeError,done123"))).message).toContain(
        THREW,
      );
    });
  });

  describe("makes a regular expression of a literal", () => {
    const getSource = (expected: string) => `
      const pattern = /a(b+)c/g;
      const result = [pattern.test("xabbc"), pattern.lastIndex, "2024-01".replace(/(\\d+)-(\\d+)/, "$2/$1")].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("true,5,01/2024"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("true,4,01/2024"))).message).toContain(THREW);
    });
  });

  describe("keeps the built-in methods that a script names and stops at the others", () => {
    const getSource = (expected: string) => `
      const view = new DataView(new ArrayBuffer(4));
      view.setUint8(1, 200);
      const result = [view.getUint8(1), view.getUint8(0), Math.max(1, 5)].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("200,0,5"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("200,0,1"))).message).toContain(THREW);
    });
  });

  describe("binds and assigns through destructuring patterns", () => {
    const getSource = (expected: string) => `
      const { a, b: { c = 5 } = {}, ...rest } = { a: 1, x: 2, y: 3 } as { a: number; b?: { c?: number }; x: number; y: number };
      const [p, , q = 9, ...others] = [1, 2, undefined, 4, 5];
      let m = 1;
      let n = 2;
      [m, n] = [n, m];
      let isClosed = false;
      const iterable = {
        [Symbol.iterator]: () => ({ next: () => ({ value: 1, done: false }), return: () => { isClosed = true; return {}; } }),
      };
      const [first] = iterable as unknown as number[];
      const sum = ({ x, y = x + 1 }: { x: number; y?: number }) => x + y;
      const result = [a, c, Object.keys(rest).join(""), p, q, others.join(""), m, n, first, isClosed, sum({ x: 1 })].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("1,5,xy,1,9,45,2,1,1,true,3"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("1,5,xy,1,9,45,2,1,1,false,3"))).message).toContain(
        THREW,
      );
    });
  });

  describe("calls a tag with its site's template object", () => {
    const getSource = (expected: string) => `
      const sites: TemplateStringsArray[] = [];
      const keep = (strings: TemplateStringsArray, ...values: unknown[]) => {
        sites.push(strings);
        return strings.raw.join("|") + "#" + values.join();
      };
      let text = "";
      for (let index = 0; index < 2; index++) text = keep\`a\${index}b\\n\`;
      const result = [text, sites[0] === sites[1], Object.isFrozen(sites[0])].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("a|b\\\\n#1,true,true"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("a|b\\\\n#1,false,true"))).message).toContain(THREW);
    });
  });

  describe("scopes a block's function declaration to the block in strict mode", () => {
    const getSource = (expected: string) => `
      let inner = "";
      {
        function scoped() {
          return 1;
        }
        inner = typeof scoped;
      }
      const result = [inner, typeof (globalThis as Record<string, unknown>).scoped].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("function,undefined"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("function,function"))).message).toContain(THREW);
    });

    it("stops where Annex B would hoist it outside strict mode", () => {
      expect(() =>
        compileToEscore("(function () { if (true) function hoisted() {} })();", "spec.ts", library),
      ).toThrow("tla-ts can't compile a function declaration in a block outside strict mode");
    });
  });

  describe("stops where the host's locale or time zone data would decide", () => {
    const getSource = (expected: string) => `
      const result = [Date.parse("1970-01-01T00:00:00.000Z"), Temporal.PlainDate.from("2020-01-02").day].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("0,2"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("0,3"))).message).toContain(THREW);
    });

    it("stops at a locale-sensitive method and at a named time zone", async () => {
      expect((await checkScript("(1234.5).toLocaleString();")).message).toContain("tla-ts can't");
      expect(
        (await checkScript('Temporal.ZonedDateTime.from("2020-01-01T00:00[America/New_York]");'))
          .message,
      ).toContain("tla-ts can't");
    });
  });

  describe("keeps the built-ins of a global that a table of names links", () => {
    const getSource = (expected: string) => `
      const result = [...new Float32Array([3, 1.5])].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("3,1.5"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("3,1"))).message).toContain(THREW);
    });
  });

  describe("keeps private names in each class's private environment", () => {
    const getSource = (expected: string) => `
      class Counter {
        #count = 0;
        static #made = 0;
        get #doubled() { return this.#count * 2; }
        constructor() { Counter.#made++; }
        increment() { this.#count += 1; return this; }
        get doubled() { return this.#doubled; }
        static made() { return Counter.#made; }
        static has(value: object) { return #count in value; }
      }
      const counter = new Counter().increment().increment();
      new Counter();
      let isRejected = false;
      try {
        Counter.prototype.increment.call({});
      } catch (error) {
        isRejected = error instanceof TypeError;
      }
      const result = [counter.doubled, Counter.made(), Counter.has(counter), Counter.has({}), isRejected].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("4,2,true,false,true"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("4,2,true,true,true"))).message).toContain(THREW);
    });
  });
});
