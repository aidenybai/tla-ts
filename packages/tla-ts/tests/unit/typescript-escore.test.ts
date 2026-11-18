import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

interface ScriptResult {
  status: string;
  message: string | undefined;
}

// ESCore's evaluation nests deeper than a test's stack, so checks run on one worker with the
// stack that test262-engine262 gives ESCore, which prepares ESCore's runtime once for them all.
const worker = new Worker(
  `const { register } = require("node:module");
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
      const compiled = loaded.compileToEscore(spec.source, "spec.ts", loaded.runtime);
      const code = compiled.loadModule("ProgramCode").replace("\\n====", "\\n" + spec.appended + "\\n====");
      const result = await loaded.check({
        ...compiled,
        loadModule: (name) => (name === "ProgramCode" ? code : undefined),
        workers: 1,
        onPrint: () => {},
      });
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
afterAll(() => worker.terminate());

const pending: ((result: ScriptResult) => void)[] = [];
const ready = new Promise((resolve) => {
  worker.on("message", (result: ScriptResult & { id: number }) =>
    result.id === -1 ? resolve(undefined) : pending[result.id](result),
  );
});
// The worker prepares the runtime before the first check, which takes longer than a check.
beforeAll(() => ready, 60_000);

// Checks a script, with the definitions in appended added to the module of its code.
const checkScript = (source: string, isStrict = true, appended = "") =>
  new Promise<ScriptResult>((resolve) => {
    worker.postMessage({
      id: pending.length,
      source: `${isStrict ? '"use strict";' : ""}\n${source}`,
      appended,
    });
    pending.push(resolve);
  });

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

  describe("runs the methods of a buffer's view", () => {
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
  });

  describe("stops where the host's locale or date parsing would decide", () => {
    const getSource = (expected: string) => `
      const result = [
        Date.parse("1970-01-01T00:00:00.000Z"),
        new Date(0).toISOString(),
        "Ab".toLocaleLowerCase(),
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("0,1970-01-01T00:00:00.000Z,ab"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("0,1970-01-01T00:00:00.000Z,Ab"))).message).toContain(
        THREW,
      );
    });

    it("stops at a locale-sensitive method and at a date string outside ECMA-262's formats", async () => {
      expect((await checkScript("(1234.5).toLocaleString();")).message).toContain("tla-ts can't");
      expect((await checkScript('Date.parse("Thu Jan 01 1970");')).message).toContain(
        "tla-ts can't",
      );
      expect((await checkScript('"I".toLocaleLowerCase("tr");')).message).toContain("tla-ts can't");
    });
  });

  describe("resumes a generator where it yielded", () => {
    const getSource = (expected: string) => `
      const log: unknown[] = [];
      function* inner() {
        const received = yield "i1";
        log.push("inner got " + received);
        return "inner done";
      }
      function* outer() {
        try {
          log.push(yield* inner());
          log.push(1 + (yield "o1") * 2);
          while (true) {
            const value = yield "loop";
            if (value === undefined) break;
            log.push(value);
          }
        } catch (error) {
          log.push("caught " + error);
          yield "after catch";
        } finally {
          log.push("finally");
        }
      }
      const generator = outer();
      log.push(generator.next().value);
      log.push(generator.next("a").value);
      log.push(generator.next(5).value);
      log.push(generator.next("v1").value);
      log.push(generator.throw("boom").value);
      log.push(generator.next().done);
      const methods = { *pair() { yield 1; yield 2; } };
      for (const value of methods.pair()) log.push(value);
      class Single { *[Symbol.iterator]() { yield "c"; } }
      log.push([...new Single()].join());
      function* countdown(count: number): Generator<number, number> {
        while (count > 0) yield yield* countdown(--count);
        return 34;
      }
      log.push([...countdown(2)].join());
      const result = log.join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (
          await checkScript(
            getSource(
              "i1|inner got a|inner done|o1|11|loop|v1|loop|caught boom|after catch|finally|true|1|2|c|34,34,34",
            ),
          )
        ).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (
          await checkScript(
            getSource(
              "i1|inner got a|inner done|o1|11|loop|v1|loop|caught boom|after catch|finally|true|1|2|c|34,34",
            ),
          )
        ).message,
      ).toContain(THREW);
    });
  });

  describe("resumes an async function when the promise it awaits settles", () => {
    const getSource = (expected: string) => `
      const log: string[] = [];
      const settle = (value: number) => new Promise<number>((resolve) => resolve(value));
      const add = async (left: number, right: number) => (await settle(left)) + (await settle(right));
      class Rejecting {
        async run(value: number) {
          try {
            await Promise.reject(new Error("no " + value));
          } catch (error) {
            return (error as Error).message;
          }
          return "unreached";
        }
      }
      async function main() {
        log.push(String(await add(1, 2)));
        log.push(await new Rejecting().run(3));
        for (const promise of [settle(4), settle(5)]) log.push(String(await promise));
        try {
          await (async () => {
            throw new TypeError("t");
          })();
        } catch (error) {
          log.push((error as Error).name);
        }
        return log.join("|");
      }
      log.push("sync");
      main().then((result) => {
        if (result !== "${expected}") throw new Error(result);
      });
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("sync|3|no 3|4|5|TypeError"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("3|no 3|4|5|TypeError|sync"))).message).toContain(THREW);
    });
  });

  describe("queues an async generator's results as promises", () => {
    const getSource = (expected: string) => `
      const log: unknown[] = [];
      async function* numbers() {
        const received = yield 1;
        log.push("got " + received);
        yield await Promise.resolve(2);
        return 3;
      }
      const iterator = numbers();
      iterator
        .next()
        .then((first) => {
          log.push(first.value);
          return iterator.next("a");
        })
        .then((second) => {
          log.push(second.value);
          return iterator.next();
        })
        .then((last) => {
          log.push(last.value, last.done);
          if (log.join() !== "${expected}") throw new Error(log.join());
        });
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("1,got a,2,3,true"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("1,got a,2,3,false"))).message).toContain(THREW);
    });
  });

  describe("awaits the value that an async generator returns", () => {
    const getSource = (expected: string) => `
      const actual: string[] = [];
      async function* implicit() {}
      async function* explicit() {
        return undefined;
      }
      Promise.resolve(0)
        .then(() => actual.push("tick 1"))
        .then(() => actual.push("tick 2"))
        .then(() => {
          if (actual.join() !== "${expected}") throw new Error(actual.join());
        });
      implicit().next().then(() => actual.push("implicit"));
      explicit().next().then(() => actual.push("explicit"));
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("tick 1,implicit,tick 2,explicit"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("tick 1,implicit,explicit,tick 2"))).message).toContain(
        THREW,
      );
    });
  });

  describe("runs each timer of no delay as a task once the jobs before it ran", () => {
    const getSource = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const log: string[] = [];
      setTimeout(() => {
        log.push("t1");
        Promise.resolve().then(() => log.push("j2"));
        setTimeout(() => {
          log.push("t3");
          if (log.join() !== "${expected}") throw new Error(log.join());
        });
      });
      setTimeout(() => log.push("t2"));
      Promise.resolve().then(() => log.push("j1"));
      log.push("sync");
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("sync,j1,t1,j2,t2,t3"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("sync,t1,j1,j2,t2,t3"))).message).toContain(THREW);
    });

    it("stops where a program reads what setTimeout returns", async () => {
      const source =
        "declare function setTimeout(callback: () => void): unknown; const timer = setTimeout(() => {});";
      expect((await checkScript(source)).message).toContain("tla-ts can't");
    });
  });

  describe("runs the built-ins of a global that a table of names links", () => {
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

  describe("hoists a block's function to its var scope outside strict mode, as Annex B does", () => {
    const getSource = (expected: string) => `
      const before = typeof hoisted;
      {
        function hoisted() {
          return 1;
        }
      }
      const inFunction = (function () {
        const initial = typeof inner;
        switch (1) {
          case 1:
            function inner() {
              return 2;
            }
        }
        return initial + inner();
      })();
      const result = [before, typeof hoisted, inFunction].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("undefined,function,undefined2"), false)).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource("undefined,undefined,undefined2"), false)).message,
      ).toContain(THREW);
    });

    it("stops at a block function named arguments where the editions disagree", async () => {
      const source = `(function () {
        typeof arguments;
        { function arguments() {} }
      })();`;
      expect((await checkScript(source, false)).message).toContain("tla-ts can't");
    });
  });

  describe("models the realm of the host that compiles it", () => {
    const getSource = (expected: string) => `
      const result = [
        "transferToImmutable" in ArrayBuffer.prototype,
        typeof (globalThis as Record<string, unknown>).print,
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;
    const host = [
      "transferToImmutable" in ArrayBuffer.prototype,
      typeof Reflect.get(globalThis, "print"),
    ].join();

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(host))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource(`${host}!`))).message).toContain(THREW);
    });

    it("stops at a global that only the host has", async () => {
      expect((await checkScript("setImmediate(() => {});")).message).toContain(
        "tla-ts can't run the host's setImmediate",
      );
    });

    it("runs a script's own binding named as one of Node's module globals", async () => {
      expect(
        (await checkScript("var global = this; if (global !== globalThis) throw 0;")).message,
      ).toBeUndefined();
      expect(
        (await checkScript("var global = this; if (global === globalThis) throw 0;")).message,
      ).toContain(THREW);
    });
  });

  describe("gives a function's source text, of a script a TLA+ string can hold or not", () => {
    const getSource = (text: string, expected: string) => `
      const f = (a: number) => a + 1;
      const g = () => "${text}";
      const result = [String(f), String(g)].join("|");
      if (result !== '(a) => a + 1|() => "${text}"' + "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("e", ""))).message).toBeUndefined();
      expect((await checkScript(getSource("\u00e9", ""))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("e", "!"))).message).toContain(THREW);
      expect((await checkScript(getSource("\u00e9", "!"))).message).toContain(THREW);
    });
  });

  describe("stops at a call to a function that its script names nowhere else", () => {
    it("runs a script that never calls it", async () => {
      expect(
        (await checkScript("function unused() { return 1; } const used = () => 2; used();"))
          .message,
      ).toBeUndefined();
    });

    it("runs an accessor that an index the runtime computes reaches", async () => {
      const getSource = (expected: string) => `
        const arrayLike = { get "1"() { return "got"; }, length: 2 };
        const result = Array.prototype.join.call(arrayLike);
        if (result !== "${expected}") throw new Error(result);
      `;
      expect((await checkScript(getSource(",got"))).message).toBeUndefined();
      expect((await checkScript(getSource(",got!"))).message).toContain(THREW);
    });

    it("stops where the script reaches it by a name it makes", async () => {
      expect(
        (await checkScript('function unused() { return 1; } (globalThis as any)["un" + "used"]();'))
          .message,
      ).toContain("tla-ts can't call a function that its script names nowhere else");
    });
  });

  describe("checks the names and levels of a program's code", () => {
    it("rejects a definition that names an unknown operator", async () => {
      expect(
        (await checkScript("const x = 1;", true, "Broken(s) == NoSuchOperator(s)")).message,
      ).toContain("Unknown operator: `NoSuchOperator'");
    });

    it("rejects a definition whose argument exceeds an operator's level", async () => {
      expect(
        (await checkScript("const x = 1;", true, "Broken(s) == {[](s = 1)}")).message,
      ).toContain("Level error in applying operator $Set");
    });

    it("accepts a definition of constant level", async () => {
      expect(
        (await checkScript("const x = 1;", true, "Fine(s) == {s = 1}")).message,
      ).toBeUndefined();
    });
  });
});
