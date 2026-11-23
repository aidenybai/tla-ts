import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext, Script } from "node:vm";
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
      const compiled = loaded.compileToEscore(spec.source, spec.fileName, loaded.runtime, spec.isModule);
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
const checkScript = (source: string, isStrict = true, appended = "", fileName = "spec.ts") =>
  new Promise<ScriptResult>((resolve) => {
    worker.postMessage({
      id: pending.length,
      source: `${isStrict ? '"use strict";' : ""}\n${source}`,
      fileName,
      isModule: false,
      appended,
    });
    pending.push(resolve);
  });

// Checks an ES module at /tla-ts/stack.ts, the entry Node runs, as node /tla-ts/stack.ts would.
const checkModule = (source: string) =>
  new Promise<ScriptResult>((resolve) => {
    worker.postMessage({
      id: pending.length,
      source,
      fileName: "/tla-ts/stack.ts",
      isModule: true,
      appended: "",
    });
    pending.push(resolve);
  });

const THREW = "the script threw an exception";

describe("compiles scripts by specializing ESCore", () => {
  // Each operation on two finite nonzero doubles runs natively in ESNumber, and each with a zero, an
  // infinity, or a zero result runs its TLA+.
  describe("computes doubles, their powers and floors, and signed zeros", () => {
    const getSource = (expected: string) => `
      const values = [0.1, -2.5, 3, 2 ** 53 + 2, 1e-310];
      let text = "";
      for (const left of values) {
        for (const right of values) text += \`\${left / right},\${left % right},\${left * right},\${left + right};\`;
      }
      text += [2 ** 10, 3 ** 5, (-2) ** 3, 0.5 ** 3, Math.floor(-0.5), Math.floor(2.75), 1 / -0, -0 % 1, Object.is(3 * -0, -0)]
        .map(String)
        .join(",");
      if (text !== "${expected}") throw new Error(text);
    `;
    const expected =
      "1,0,0.010000000000000002,0.2;-0.04,0.1,-0.25,-2.4;0.03333333333333333,0.1,0.30000000000000004,3.1;1.1102230246251563e-17,0.1,900719925474099.5,9007199254740994;Infinity,3.135287412051e-311,1e-311,0.1;-25,-0.09999999999999987,-0.25,-2.4;1,0,6.25,-5;-0.8333333333333334,-2.5,-7.5,0.5;-2.775557561562891e-16,-2.5,-22517998136852484,9007199254740992;-Infinity,-8.7685794026083e-311,-2.5e-310,-2.5;30,0.09999999999999984,0.30000000000000004,3.1;-1.2,0.5,-7.5,0.5;1,0,9,6;3.330669073875469e-16,3,27021597764222984,9007199254740996;Infinity,5.2229528313e-312,3e-310,3;90071992547409940,0.09999999999999992,900719925474099.5,9007199254740994;-3602879701896397.5,1.5,-22517998136852484,9007199254740992;3002399751580331.5,1,27021597764222984,9007199254740996;1,0,8.112963841460672e+31,18014398509481988;Infinity,9.01884420564e-312,9.007199254740966e-295,9007199254740994;9.99999999999997e-310,1e-310,1e-311,0.1;-4e-311,1e-310,-2.5e-310,-2.5;3.333333333333e-311,1e-310,3e-310,3;0,1e-310,9.007199254740966e-295,9007199254740994;1,0,0,2e-310;1024,243,-8,0.125,-1,2,-Infinity,0,true";

    it("agrees with Node", async () => {
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(expected)))).not.toThrow();
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const wrong = expected.replace("-1,2,-Infinity", "-0,2,-Infinity");
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(wrong)))).toThrow(expected);
      expect((await checkScript(getSource(wrong))).message).toContain(THREW);
    });
  });

  // Each lookup reads an object's own property with OrdinaryGetOwnProperty, which tla-ts runs
  // natively, and a missing one goes on to the prototype.
  describe("reads own and inherited properties", () => {
    const getSource = (expected: string) => `
      const base: Record<string, number> = { a: 1 };
      const derived = Object.create(base) as Record<string, number>;
      derived.b = 2;
      const list = [10, 20, 30];
      const text = [
        derived.a,
        derived.b,
        derived.c,
        "a" in derived,
        Object.prototype.hasOwnProperty.call(derived, "a"),
        Object.getOwnPropertyDescriptor(derived, "b")?.value,
        Object.getOwnPropertyDescriptor(derived, "a"),
        list[1],
        list[5],
        Object.prototype.hasOwnProperty.call(list, "2"),
      ]
        .map(String)
        .join(",");
      if (text !== "${expected}") throw new Error(text);
    `;
    const expected = "1,2,undefined,true,false,2,undefined,20,undefined,true";

    it("agrees with Node", async () => {
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(expected)))).not.toThrow();
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const wrong = expected.replace("true,false", "true,true");
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(wrong)))).toThrow(expected);
      expect((await checkScript(getSource(wrong))).message).toContain(THREW);
    });
  });

  // CanonicalNumericIndexString, which tla-ts runs natively, tells the keys that a typed array
  // keeps as its own properties from those it reads as indices.
  describe("keeps a typed array's keys that aren't canonical numeric strings", () => {
    const getSource = (expected: string) => `
      const array = new Uint8Array(3);
      const view = array as unknown as Record<string, unknown>;
      for (const key of ["foo", "NaN", "Infinity", "-Infinity", "1.5", "1e21", "0.5", "-0", "01"]) {
        view[key] = 9;
      }
      let text = Object.keys(array).join(",") + ";";
      for (const key of ["foo", "NaN", "Infinity", "1.5", "1e21", "01", "length", "-1", "3"]) {
        text += String(view[key]) + ",";
      }
      text += String("foo" in array) + String("1.5" in array) + String("01" in array);
      if (text !== "${expected}") throw new Error(text);
    `;
    const expected =
      "0,1,2,foo,1e21,01;9,undefined,undefined,undefined,9,9,3,undefined,undefined,truefalsetrue";

    it("agrees with Node", async () => {
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(expected)))).not.toThrow();
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const wrong = expected.replace("foo,1e21", "foo,NaN,1e21");
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(wrong)))).toThrow(expected);
      expect((await checkScript(getSource(wrong))).message).toContain(THREW);
    });
  });

  // Each key goes in the bucket that PropBucket gives it, and each object in the page of the heap
  // that HeapGet reads, which tla-ts runs natively.
  describe("orders an object's keys and reads objects past a page of the heap", () => {
    const getSource = (expected: string) => `
      const object: Record<string, number> = {};
      for (const key of ["b", "250", "4294967295", "4294967294", "01", "7", "100", "99", "a", "12345"]) {
        object[key] = key.length;
      }
      const objects: { index: number }[] = [];
      for (let index = 0; index < 300; index++) objects.push({ index });
      let total = 0;
      for (const item of objects) total += item.index;
      const text =
        Object.keys(object).join(",") + ";" + String(total) + ";" + String(object["4294967295"]) + String(object["01"]);
      if (text !== "${expected}") throw new Error(text);
    `;
    const expected = "7,99,100,250,12345,4294967294,b,4294967295,01,a;44850;102";

    it("agrees with Node", async () => {
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(expected)))).not.toThrow();
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const wrong = expected.replace("250,12345", "12345,250");
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(wrong)))).toThrow(expected);
      expect((await checkScript(getSource(wrong))).message).toContain(THREW);
    });
  });

  // Each key of the typed array is a string that CanonicalNumericIndexString reads with StrToNum,
  // which tla-ts runs natively for a string of decimal digits.
  describe("reads the keys of a typed array that are canonical numeric strings", () => {
    const getSource = (expected: string) => `
      const array = new Uint8Array(4);
      const view = array as unknown as Record<string, number | undefined>;
      view["1"] = 7;
      view["-1"] = 5;
      view["01"] = 6;
      view["4"] = 8;
      let text = "";
      for (const key of ["0", "1", "-0", "01", "+1", "1.0", "-1", "4", "1073741823", "1073741824"]) {
        text += String(view[key]) + ",";
      }
      text += String(Number("-12") + Number("+3") + Number("007"));
      if (text !== "${expected}") throw new Error(text);
    `;
    const expected =
      "0,7,undefined,6,undefined,undefined,undefined,undefined,undefined,undefined,-2";

    it("agrees with Node", async () => {
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(expected)))).not.toThrow();
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const wrong = expected.replace("0,7", "0,5");
      expect(() => runInNewContext(stripTypeScriptTypes(getSource(wrong)))).toThrow(expected);
      expect((await checkScript(getSource(wrong))).message).toContain(THREW);
    });
  });

  // Each set puts a key into a WeakMap's table with @@, which finds an object's key without
  // comparing it with each key the table holds.
  describe("sets and gets the keys of a WeakMap that grows a key at a time", () => {
    const getSource = (expected: string) => `
      const map = new WeakMap<object, object>();
      const head = {};
      let key: object | undefined = head;
      for (let index = 0; index < 300; index++) {
        const next = {};
        map.set(key as object, next);
        key = next;
      }
      map.set(head, map.get(head) as object);
      let count = 0;
      for (key = head; key !== undefined; key = map.get(key)) count++;
      if (String(count) !== "${expected}") throw new Error(String(count));
    `;

    it("agrees with Node", async () => {
      expect(() => runInNewContext(stripTypeScriptTypes(getSource("301")))).not.toThrow();
      expect((await checkScript(getSource("301"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(() => runInNewContext(stripTypeScriptTypes(getSource("300")))).toThrow("301");
      expect((await checkScript(getSource("300"))).message).toContain(THREW);
    });
  });

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

  describe("holds the bindings that only a function's own code reaches in its frame", () => {
    const getSource = (expected: string) => `
      function fib(n: number): number { if (n < 2) return n; const a = fib(n - 1); const b = fib(n - 2); return a + b; }
      function sum(list: number[]) { let total = 0; for (const item of list) { total += item; } return total; }
      const holder = { base: 10, get twice() { let d = this.base; d = d * 2; return d; } };
      function viaGetter(k: number) { const before = k; const t = holder.twice; return before + t; }
      function mapped(xs: number[]) { const off = 3; return xs.map((x) => x + 1).map(function (y) { const z = y * 2; return z; }).join("-") + off; }
      function* numbers(n: number) { for (let i = 0; i < n; i++) yield fib(i); }
      function shadow(p: number) { let r = p; { const p = 100; r += p; } for (let p = 0; p < 2; p++) { r += p; } return r + p; }
      function update(v: number) { let c = v; c++; ++c; c--; let d = c ** 2; d %= 7; return [c, d]; }
      function labels() { let n = 0; outer: for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) { if (j === 1) continue outer; if (i === 2) break outer; n += 10 * i + j; } } return n; }
      function cases(x: number) { let out = ""; switch (x) { case 1: const a = "one"; out = a; case 2: out += "two"; break; default: out = "other"; } return out; }
      function hoisted() { function read() { return v; } var v = 4; return read(); }
      function early() { try { u; const u = 1; return "no"; } catch (error) { return (error as Error).constructor.name; } }
      function fixed() { const c = 1; try { (c as number) = 2; } catch (error) { return (error as Error).constructor.name; } return "no"; }
      function caught() { let y = 1; try { throw 3; } catch (e) { y += e as number; } let s = 0; for (const key in { p: 1, q: 2 }) s += key.length; return y + s; }
      const kept = (a: number) => { let k = a; return () => ++k; };
      const counter = kept(5);
      counter();
      const result = [fib(10), sum([1, 2, 3]), viaGetter(1), mapped([1, 2]), [...numbers(5)].join(), shadow(5), update(3).join(), labels(), cases(1), cases(2), cases(3), hoisted(), early(), fixed(), caught(), counter()].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (
          await checkScript(
            getSource(
              "55;6;21;4-63;0,1,1,2,3;111;4,2;10;onetwo;two;other;4;ReferenceError;TypeError;6;7",
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
              "55;6;21;4-63;0,1,1,2,3;111;4,2;10;onetwo;two;other;4;ReferenceError;TypeError;6;6",
            ),
          )
        ).message,
      ).toContain(THREW);
    });
  });

  describe("keeps a binding that a class's extends clause reads in its environment", () => {
    const getSource = (expected: string) => `
      class Base {
        static make() { return new this(); }
        kind() { return "base"; }
      }
      function derive(parent: typeof Base, label: string) {
        let made = 0;
        class Derived extends parent {
          constructor() { made += 1; super(); }
          kind() { return label + ":" + super.kind(); }
        }
        const instance = Derived.make();
        return [instance.kind(), made, Object.getPrototypeOf(Derived) === parent].join();
      }
      function extendsCall(pick: () => typeof Base) { class Picked extends pick() {} return new Picked().kind(); }
      const result = [derive(Base, "d"), extendsCall(() => Base)].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("d:base,1,true;base"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("d:base,2,true;base"))).message).toContain(THREW);
    });
  });

  describe("calls a function that needs no environment without making one", () => {
    const getSource = (expected: string) => `
      const flip = (bit: number) => (bit === 0 ? 1 : 0);
      function made(this: { n?: number }, v: number) { let w = v + 1; return w; }
      const owner = {
        n: 5,
        arrow() { const read = () => this.n; return read(); },
        bare(k: number) { const j = k * 2; return j; },
      };
      function depth(n: number): number { return n === 0 ? 0 : 1 + depth(n - 1); }
      const instance = new (made as unknown as new (v: number) => object)(1);
      const result = [flip(0), flip(1), made.call(undefined, 2), owner.arrow(), owner.bare(4), depth(20), typeof instance, [3, 1, 2].map(flip).join("")].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("1,0,3,5,8,20,object,000"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("1,0,3,5,8,20,object,001"))).message).toContain(THREW);
    });
  });

  describe("reads and writes an ordinary object's own data properties as [[Get]] and [[Set]] do", () => {
    const getSource = (expected: string) => `
      const o: any = { a: 1, b: "x" };
      o.a = o.a + 1;
      o.c = 3;
      const frozen = Object.freeze({ k: 1 });
      let threw = "";
      try { (frozen as any).k = 2; } catch (error) { threw = (error as Error).constructor.name; }
      const arr: any = [1, 2];
      arr.length = 1;
      arr.extra = 5;
      class Point { x: number; constructor(x: number) { this.x = x; } get double() { return this.x * 2; } }
      const p = new Point(3);
      p.x = p.x + 1;
      const proto = { inherited: 7 };
      const child: any = Object.create(proto);
      child.inherited = 8;
      const setterHost = { set v(n: number) { (this as any).w = n * 10; } } as any;
      setterHost.v = 2;
      const result = [o.a, o.b, o.c, threw, arr.length, arr.extra, p.x, p.double, child.inherited, proto.inherited, setterHost.w, "abc".length].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("2,x,3,TypeError,1,5,4,8,8,7,20,3"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("2,x,3,TypeError,1,5,4,8,8,7,20,4"))).message).toContain(
        THREW,
      );
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
        name: string;
        constructor(name: string) {
          this.name = name;
        }
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

  describe("holds a long string of runs of consecutive code points as the runs", () => {
    const literal = `${[
      ...Array.from({ length: 5000 }, (_, index) => 0x4e00 + index),
      ...Array.from({ length: 3000 }, (_, index) => 0x1f000 + index),
    ]
      .map((codePoint) => `\\u{${codePoint.toString(16)}}`)
      .join("")}\\uD800\\uDBFF`;
    const getSource = (expected: string) => `
      const literal = "${literal}";
      let built = "";
      for (let code = 0x4e00; code < 0x4e00 + 5000; code++) built += String.fromCharCode(code);
      const result = [
        literal.length,
        literal.charCodeAt(4999),
        literal.charCodeAt(5000),
        literal.charCodeAt(5001),
        literal.codePointAt(5000 + 2 * 2999),
        literal.charCodeAt(literal.length - 1),
        literal.slice(0, 5000) === built,
        /^\\p{Script=Han}+/u.exec(literal)?.[0].length,
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("11002,24967,55356,56320,129975,56319,true,5000"))).message,
      ).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource("11002,24967,55356,56320,129975,56320,true,5000"))).message,
      ).toContain(THREW);
    }, 600_000);
  });

  describe("repeats a character class and searches a long string as RepeatMatcher does", () => {
    const getSource = (expected: string) => `
      const run = "a".repeat(30000);
      const result = [
        /^\\p{L}+$/u.test(run),
        /^\\P{L}+$/u.test(run),
        /a+b/.test(run.slice(0, 200)),
        /a+?a$/.exec(run)?.[0].length,
        /(?<=a{3})b/.exec(run + "b")?.index,
        /a{2,5}?/.exec(run)?.[0].length,
        /[^a]/u.exec(run + "😀")?.index,
        /b|a$/u.exec(run)?.index,
        /^a*a{199}$/.test(run.slice(0, 200)),
        "aab".replace(/a*?b/, "-"),
        /(?<!a+)b/.test("ab"),
        /x*/.exec("y")?.[0].length,
        /\\p{Lu}{2,}/u.exec("aBCd")?.[0],
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (
          await checkScript(
            getSource("true,false,false,30000,30000,2,30000,29999,true,-,false,0,BC"),
          )
        ).message,
      ).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect(
        (
          await checkScript(
            getSource("true,false,false,30000,30000,2,30000,29999,true,-,false,0,B"),
          )
        ).message,
      ).toContain(THREW);
    }, 600_000);
  });

  describe("repeats a class of strings over a long string as RepeatMatcher does", () => {
    const getSource = (expected: string, length = 4000) => `
      const result = [
        /^[\\q{ab|c}]+$/v.test("ab".repeat(${length}) + "c"),
        /^[\\q{abc|ab|a}]+$/v.exec("abcab")?.[0],
        /^[\\q{ab|a}]+b$/v.exec("ab")?.[0],
        /[\\q{ab|a}]{2}/v.exec("aab")?.[0],
        /[\\q{xy|x}]{2,3}/v.exec("xyxyxyx")?.[0],
        /^\\p{RGI_Emoji}+$/v.test("😀👍🏽".repeat(${length / 4})),
        /[\\q{ab|a}]+?/v.exec("abab")?.[0],
        /^[\\q{aa|1}]+$/iv.test("aA1".repeat(${length / 2})),
        /^[\\q{ab|c}]+$/v.test("ab".repeat(${length}) + "d"),
        /[\\q{ab|a}]*c/v.exec("abaabc")?.[0],
        /^[\\q{abc|ab|a}]{2,4}c$/v.exec("abcabcabc")?.[0],
        /^(?:[\\q{ab|a}]{3})+$/v.test("abaab"),
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (
          await checkScript(
            getSource("true,abcab,ab,aab,xyxyxy,true,ab,true,false,abaabc,abcabcabc,true"),
          )
        ).message,
      ).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect(
        (
          await checkScript(
            getSource("true,abcab,ab,aab,xyxyxy,true,ab,true,false,abaabc,abcabc,true"),
          )
        ).message,
      ).toContain(THREW);
    }, 600_000);

    // The script's run reaches ESCore's Asserts, so the check's LET of it evaluates at each
    // reference, as TLC's does, rather than run the script again at each reference to what it kept.
    it("rejects another result over a shorter string in a check's time", async () => {
      expect(
        (
          await checkScript(
            getSource("true,abcab,ab,aab,xyxyxy,true,ab,true,false,abaabc,abcabc,true", 1200),
          )
        ).message,
      ).toContain(THREW);
    });
  });

  describe("stops where a code point folds to a ClassString of one code point under the i and v flags", () => {
    const getSource = (expected: string) => `
      const result = [
        /^[\\q{1|ab}]+$/iv.test("1aB"),
        /[\\q{a}]/v.test("A"),
        /^[\\q{KK|ß}]$/iv.test("Kk"),
        /[\\q{a}]/iv.test("ab"),
        /[\\q{ß}]/iv.test("xß"),
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("true,false,true,true,true"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("true,false,true,false,true"))).message).toContain(THREW);
    });

    it("stops where V8 matches only the folded code point", async () => {
      expect((await checkScript('/[\\q{a}]/iv.test("A");')).message).toContain("tla-ts can't");
    });
  });

  describe("substitutes a replacement's captures, and stops at one longer than tla-ts holds", () => {
    const getSource = (expected: string) => `
      const x = "ab".repeat(1 << 15);
      const result = [x.replace(/(.+)/, "$1-$1-$1").length, "abc".replace(/(b)/, "[$1$&$\`$']")].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("196610,a[bbac]c"))).message).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect((await checkScript(getSource("196610,a[bbac]"))).message).toContain(THREW);
    }, 600_000);

    it("stops at a replacement of millions of code units", async () => {
      expect(
        (await checkScript('"ab".repeat(1 << 15).replace(/(.+)/, "$1".repeat(65));')).message,
      ).toContain("tla-ts can't");
    }, 600_000);
  });

  describe("reads RegExp's legacy static properties after a match, and stops where V8 differs", () => {
    const getSource = (expected: string) => `
      /(b)(c)?/.exec("abd");
      const legacy = RegExp as unknown as Record<string, string>;
      const result = ["$1", "$2", "lastMatch", "leftContext", "rightContext", "input", "lastParen"]
        .map((key) => legacy[key])
        .join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("b||b|a|d|abd|"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("b||b|a|d|abd|c"))).message).toContain(THREW);
    });

    it("stops where V8 reads an empty string before any match", async () => {
      expect(
        (await checkScript("const first = (RegExp as unknown as Record<string, string>).$1;"))
          .message,
      ).toContain("tla-ts can't read a legacy static property of RegExp");
    });
  });

  describe("calls a sort comparator on the pairs that V8's TimSort compares, in its order", () => {
    const getSource = (expected: string) => `
      const log: string[] = [];
      const sortLogged = (items: number[]) =>
        items
          .slice()
          .sort((a, b) => {
            log.push(\`\${a}\${b}\`);
            return a - b;
          })
          .join("");
      const holey = [2, undefined, 1, , 3];
      const result = [
        sortLogged([5, 4, 3, 1, 2, 3]),
        log.splice(0).join(" "),
        sortLogged([3, 1, 4, 1, 5, 9, 2, 6]),
        log.splice(0).join(" "),
        holey
          .sort((a, b) => {
            log.push(\`\${a}\${b}\`);
            return (b as number) - (a as number);
          })
          .join(),
        log.splice(0).join(" "),
        Array.from({ length: 70 }, (_, index) => 70 - index).sort((a, b) => {
          log.push("");
          return a - b;
        })[0],
        log.splice(0).length,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;
    const expected =
      "123345|45 35 34 14 13 24 23 21 33 35 34|11234569|13 41 43 13 11 53 54 93 95 24 21 23 63 65 69|3,2,1,,|12 31 32|1|69";

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource(expected.replace("45 35", "45 34")))).message).toContain(
        THREW,
      );
    });

    const getMerged = (expected: string) => `
      let calls = 0;
      let hash = 0;
      const sorted = Array.from({ length: 150 }, (_, index) => (index * 37) % 101).sort((a, b) => {
        calls += 1;
        hash = (hash * 31 + a * 1009 + b) % 1000000007;
        return a - b;
      });
      const result = calls + ":" + hash + ":" + sorted.slice(0, 5).join(",");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node where TimSort merges runs", async () => {
      expect((await checkScript(getMerged("889:821657304:0,0,1,2,2"))).message).toBeUndefined();
    }, 600_000);

    it("rejects another result where TimSort merges runs", async () => {
      expect((await checkScript(getMerged("888:821657304:0,0,1,2,2"))).message).toContain(THREW);
    }, 600_000);
  });

  describe("compares values of different types as unequal", () => {
    const getSource = (expected: string) => `
      const values: unknown[] = [null, true, "", 0];
      const result = [JSON.stringify(""), JSON.stringify([true, ""]), values.indexOf(""), values.includes(false)].join();
      if (result !== '${expected}') throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource('"",[true,""],2,false'))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource('"",[true,""],1,false'))).message).toContain(THREW);
    });
  });

  describe("runs the helpers of the iterators that collections and arrays give", () => {
    const getSource = (expected: string) => `
      const set = new Set([1, 2, 3]);
      const map = new Map([["a", 1], ["b", 2]]);
      const result = [
        set.values().every((value) => value > 0),
        map.keys().some((key) => key === "b"),
        [5, 6].entries().map((entry) => entry.join(":")).toArray().join(" "),
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("true,true,0:5 1:6"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("true,false,0:5 1:6"))).message).toContain(THREW);
    });
  });

  describe("runs the built-ins that a generator's helpers and an async disposal reach", () => {
    const getSource = (expected: string) => `
      function* numbers() {
        yield 1;
        yield 2;
        yield 3;
      }
      const helped = numbers()
        .filter((value) => value !== 2)
        .map((value) => value * 10)
        .toArray();
      const stack = new AsyncDisposableStack();
      stack.disposeAsync();
      const result = [helped.join(), stack.disposed].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("10,30,true"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("10,20,30,true"))).message).toContain(THREW);
    });
  });

  describe("reads the tag that every built-in iterator inherits", () => {
    const getSource = (expected: string) => `
      const iterator = ""[Symbol.iterator]();
      delete Object.getPrototypeOf(iterator)[Symbol.toStringTag];
      const result = Object.prototype.toString.call(iterator);
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("[object Iterator]"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("[object Object]"))).message).toContain(THREW);
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

    it("stops at a locale-sensitive method and at a computed date string outside ECMA-262's formats", async () => {
      expect(
        (await checkScript('new Date("abcd".length * 1000).toLocaleString("de-DE");')).message,
      ).toContain("tla-ts can't");
      expect((await checkScript('Date.parse("Thu Jan 01 " + 1970);')).message).toContain(
        "tla-ts can't",
      );
      expect((await checkScript('"I".toLocaleLowerCase("tr");')).message).toContain("tla-ts can't");
    });
  });

  describe("reads a date string outside ECMA-262's formats that the program writes as the host does", () => {
    const getSource = (expected: string) => `
      const result = [
        new Date("10/31/2010 08:00").getTime(),
        Date.parse("-000000-03-31T00:45Z"),
        new Date({}).getTime(),
        Date.parse("Thu, 01 Jan 1970 00:00:00 GMT+0100"),
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource(`${Date.parse("10/31/2010 08:00")},NaN,NaN,-3600000`)))
          .message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource(`${Date.parse("10/31/2010 08:00")},NaN,NaN,NaN`))).message,
      ).toContain(THREW);
    });
  });

  describe("joins the elements' toLocaleString with their locales and options, as ECMA-402 does", () => {
    const getSource = (expected: string) => `
      const seen: string[] = [];
      const element = {
        toLocaleString(...args: unknown[]) {
          seen.push(args.length + ":" + String(args[0]));
          return "e";
        },
      };
      const result = [
        [undefined, element, null, element].toLocaleString("zh", {}),
        Array.prototype.toLocaleString.call({ length: 2, 0: element, 1: element }),
        new Uint8Array(2).subarray(0, 0).toLocaleString(),
        ({ toString: () => "plain" }).toLocaleString(),
        [true, "x"].toLocaleString(),
        seen.join(" "),
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource(",e,,e|e,e||plain|true,x|2:zh 2:zh 2:undefined 2:undefined")))
          .message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource(",e,,e|e,e||plain|true,x|1:zh 1:zh 0:undefined 0:undefined")))
          .message,
      ).toContain(THREW);
    });

    it("formats an element whose toLocaleString reads the host's locale as the host does", async () => {
      expect(
        (
          await checkScript(
            'if ([1234.5].toLocaleString() !== "1,234.5") throw new Error("other");',
          )
        ).message,
      ).toBeUndefined();
      expect(
        (await checkScript('if ([1234.5].toLocaleString() !== "1234.5") throw new Error("other");'))
          .message,
      ).toContain(THREW);
    });

    it("stops at an element whose toLocaleString formats a value the program computes", async () => {
      expect(
        (await checkScript('[new Date("abcd".length * 1000)].toLocaleString("de-DE");')).message,
      ).toContain("tla-ts can't");
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

  describe("awaits each result of a for-await statement's iterator", () => {
    const getSource = (expected: string) => `
      const log: string[] = [];
      async function* numbers() {
        yield 1;
        yield await Promise.resolve(2);
      }
      const closing = {
        [Symbol.asyncIterator]() {
          return {
            next: async () => ({ value: "c", done: false }),
            return: async () => {
              log.push("closed");
              return {};
            },
          };
        },
      };
      async function main() {
        for await (const value of numbers()) log.push(String(value));
        for await (const value of [Promise.resolve("a"), "b"]) log.push(value);
        for await (const value of closing) {
          log.push(value);
          break;
        }
        log.push("after");
      }
      main().then(() => {
        if (log.join() !== "${expected}") throw new Error(log.join());
      });
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("1,2,a,b,c,closed,after"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("1,2,a,b,c,after"))).message).toContain(THREW);
    });
  });

  describe("disposes a using declaration's resources once its scope completes", () => {
    const getSource = (expected: string) => `
      const log: string[] = [];
      const resource = (name: string) => ({
        [Symbol.dispose]() {
          log.push("dispose " + name);
        },
      });
      {
        using first = resource("a"),
          second = resource("b");
        using none = null;
        log.push("body");
      }
      function returning() {
        using held = resource("c");
        return "ret";
      }
      log.push(returning());
      for (using each of [resource("d1"), resource("d2")]) log.push("iter");
      for (using head = resource("e"), unused = null; !log.includes("for"); ) log.push("for");
      try {
        using throwing = {
          [Symbol.dispose]() {
            throw new Error("g");
          },
        };
        throw new Error("body");
      } catch (error) {
        log.push(error.constructor.name + ":" + error.error.message + "/" + error.suppressed.message);
      }
      try {
        using bad = 1 as unknown as Disposable;
      } catch (error) {
        log.push(error.constructor.name);
      }
      const result = log.join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (
          await checkScript(
            getSource(
              "body,dispose b,dispose a,dispose c,ret,iter,dispose d1,iter,dispose d2,for,dispose e,SuppressedError:g/body,TypeError",
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
              "body,dispose a,dispose b,dispose c,ret,iter,dispose d1,iter,dispose d2,for,dispose e,SuppressedError:g/body,TypeError",
            ),
          )
        ).message,
      ).toContain(THREW);
    });
  });

  describe("awaits the disposal of an await using declaration's resources", () => {
    const getSource = (expected: string) => `
      const log: string[] = [];
      const resource = (name: string) => ({
        async [Symbol.asyncDispose]() {
          await null;
          log.push("dispose " + name);
        },
      });
      const syncOnly = {
        [Symbol.dispose]() {
          log.push("sync");
        },
      };
      async function run() {
        {
          await using first = resource("a"),
            second = syncOnly;
          await using none = undefined;
          log.push("body");
        }
        for (await using each of [resource("c")]) log.push("iter");
        for await (await using each of [resource("d")]) log.push("iter2");
        log.push("end");
      }
      run().then(() => {
        if (log.join() !== "${expected}") throw new Error(log.join());
      });
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("body,sync,dispose a,iter,dispose c,iter2,dispose d,end")))
          .message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource("body,dispose a,sync,iter,dispose c,iter2,dispose d,end")))
          .message,
      ).toContain(THREW);
    });

    const getModule = (expected: string) => `
      const log: string[] = [];
      {
        await using held = {
          async [Symbol.asyncDispose]() {
            log.push("disposed");
          },
        };
        log.push("body");
      }
      if (log.join() !== "${expected}") throw new Error(log.join());
    `;

    it("agrees with Node where a module's code awaits the disposal", async () => {
      expect((await checkModule(getModule("body,disposed"))).message).toBeUndefined();
    });

    it("rejects another result where a module's code awaits the disposal", async () => {
      expect((await checkModule(getModule("body"))).message).toContain(THREW);
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

  describe("throws what a promise capability's reject function throws", () => {
    const getSource = (expected: string) => `
      class Rejecting {
        constructor(executor: (resolve: () => void, reject: () => void) => void) {
          executor(
            () => {},
            () => {
              throw new Error("from reject");
            },
          );
        }
        static resolve() {
          throw new Error("from resolve");
        }
      }
      let caught = "none";
      try {
        Promise.race.call(Rejecting, [1]);
      } catch (error) {
        caught = (error as Error).message;
      }
      if (caught !== "${expected}") throw new Error(caught);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("from reject"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("none"))).message).toContain(THREW);
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

  // The realm has Temporal only where the host that compiles the script has it.
  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "runs a named time zone from the host's recorded table",
    () => {
      const getSource = (expected: string) => `
      const zoned = new Temporal.ZonedDateTime(1588402800_000_000_000n, "America/Vancouver");
      const gap = Temporal.ZonedDateTime.from({
        year: 2020,
        month: 3,
        day: 8,
        hour: 2,
        minute: 30,
        timeZone: "America/Vancouver",
      });
      const fold = Temporal.PlainDateTime.from("2020-11-01T01:30").toZonedDateTime("America/Vancouver", {
        disambiguation: "later",
      });
      const later = new Temporal.ZonedDateTime(2200000000_000_000_000n, "America/Vancouver");
      const link = new Temporal.ZonedDateTime(0n, "Asia/Calcutta");
      let rejected = "none";
      try {
        new Temporal.ZonedDateTime(0n, "Mars/Olympus");
      } catch (error) {
        rejected = (error as Error).name;
      }
      const result = [
        zoned.offset,
        gap.toString(),
        fold.offset,
        String(zoned.getTimeZoneTransition("next")),
        later.offset,
        link.timeZoneId,
        link.equals(new Temporal.ZonedDateTime(0n, "Asia/Kolkata")),
        rejected,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        expect(
          (
            await checkScript(
              getSource(
                "-07:00|2020-03-08T03:30:00-07:00[America/Vancouver]|-08:00|2020-11-01T01:00:00-08:00[America/Vancouver]|-07:00|Asia/Calcutta|true|RangeError",
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
                "-07:00|2020-03-08T03:30:00-07:00[America/Vancouver]|-07:00|2020-11-01T01:00:00-08:00[America/Vancouver]|-07:00|Asia/Calcutta|true|RangeError",
              ),
            )
          ).message,
        ).toContain(THREW);
      });

      it("stops at a time zone that the table leaves out", async () => {
        const source = 'new Temporal.ZonedDateTime(0n, ["Europe", "Oslo"].join("/"));';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "runs the calendars other than ISO 8601",
    () => {
      const getSource = (expected: string) => `
      const hebrew = Temporal.PlainDate.from({ year: 5784, monthCode: "M05L", day: 30, calendar: "hebrew" });
      const reiwa = Temporal.PlainDate.from({ era: "reiwa", eraYear: 1, month: 5, day: 1, calendar: "japanese" });
      const umalqura = Temporal.PlainDate.from("2024-03-11[u-ca=islamic-umalqura]");
      const coptic = Temporal.PlainYearMonth.from({ year: 1740, month: 13, calendar: "coptic" });
      const persian = Temporal.PlainMonthDay.from({ monthCode: "M12", day: 30, calendar: "persian" });
      let rejected = "none";
      try {
        Temporal.PlainDate.from({ year: 5785, monthCode: "M05L", day: 1, calendar: "hebrew" }, { overflow: "reject" });
      } catch (error) {
        rejected = (error as Error).name;
      }
      const result = [
        hebrew.toString(),
        hebrew.month,
        hebrew.monthsInYear,
        hebrew.add({ years: 1 }).monthCode,
        hebrew.until("2027-01-05[u-ca=hebrew]", { largestUnit: "years" }).toString(),
        reiwa.subtract({ days: 1 }).era,
        reiwa.subtract({ days: 1 }).eraYear,
        umalqura.year + "-" + umalqura.month + "-" + umalqura.day,
        umalqura.daysInMonth,
        coptic.daysInMonth,
        coptic.toString(),
        persian.toString(),
        rejected,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        const expected =
          "2024-03-10[u-ca=hebrew]|6|13|M06|P2Y9M26D|heisei|31|1445-9-1|30|5|2024-09-06[u-ca=coptic]|1972-03-20[u-ca=persian]|RangeError";
        expect((await checkScript(getSource(expected))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected =
          "2024-03-10[u-ca=hebrew]|6|13|M06|P2Y9M26D|heisei|31|1445-9-1|30|6|2024-09-06[u-ca=coptic]|1972-03-20[u-ca=persian]|RangeError";
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "runs the Chinese and Dangi calendars from the years that the host's table records",
    () => {
      const getSource = (expected: string) => `
      const date = Temporal.PlainDate.from({ year: 2023, monthCode: "M02L", day: 29, calendar: "chinese" });
      const dangi = Temporal.PlainDate.from("2023-03-22[u-ca=dangi]");
      const monthDay = Temporal.PlainMonthDay.from({ monthCode: "M09L", day: 30, calendar: "chinese" });
      let rejected = "none";
      try {
        Temporal.PlainMonthDay.from({ monthCode: "M01L", day: 1, calendar: "chinese" }, { overflow: "reject" });
      } catch (error) {
        rejected = (error as Error).name;
      }
      const result = [
        date.toString(),
        date.month,
        date.monthsInYear,
        date.daysInYear,
        date.era,
        date.add({ years: 1 }).monthCode,
        date.add({ months: 13 }).toString(),
        date.until("2025-06-01[u-ca=chinese]", { largestUnit: "years" }).toString(),
        dangi.monthCode,
        dangi.day,
        monthDay.toString(),
        monthDay.monthCode,
        rejected,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        const expected =
          "2023-04-19[u-ca=chinese]|3|13|384||M02|2024-05-07[u-ca=chinese]|P2Y2M6D|M02L|1|1972-11-05[u-ca=chinese]|M09|RangeError";
        expect((await checkScript(getSource(expected))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected =
          "2023-04-19[u-ca=chinese]|3|13|384||M02|2024-05-07[u-ca=chinese]|P2Y2M6D|M02L|1|1972-11-05[u-ca=chinese]|M09L|RangeError";
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });

      it("stops at a year that the host's table leaves out", async () => {
        const source =
          'Temporal.PlainDate.from({ year: 3000, month: 1, day: 1, calendar: "chinese" });';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "formats Temporal's toLocaleString through the host's recorded English patterns",
    () => {
      const getSource = (expected: string) => `
      const date = new Temporal.PlainDate(2024, 12, 26);
      const time = new Temporal.PlainTime(14, 5, 9, 321);
      const instant = Temporal.Instant.from("2024-12-26T11:46:40.321Z");
      const read: string[] = [];
      const options = new Proxy(
        { month: "long" },
        {
          get: (target, key) => {
            read.push(String(key));
            return Reflect.get(target, key);
          },
        },
      );
      let errors = "";
      for (const make of [
        () => date.toLocaleString("en", { month: "longer" } as unknown as Intl.DateTimeFormatOptions),
        () => date.toLocaleString("en", { timeStyle: "short" }),
        () => time.toLocaleString("en", { dateStyle: "short" }),
        () => Temporal.PlainDate.prototype.toLocaleString.call(time),
      ]) {
        try {
          make();
        } catch (error) {
          errors += (error as Error).name + ";";
        }
      }
      const result = [
        date.toLocaleString(),
        date.toLocaleString("en", options),
        read.join(","),
        time.toLocaleString("en-US", { hourCycle: "h23", hour: "numeric" }),
        instant.toLocaleString("en", { dateStyle: "full", timeStyle: "short" }),
        errors,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;
      const read =
        "localeMatcher,calendar,numberingSystem,hour12,hourCycle,timeZone,weekday,era,year,month,day,dayPeriod,hour,minute,second,fractionalSecondDigits,timeZoneName,formatMatcher,dateStyle,timeStyle";

      it("agrees with Node", async () => {
        const expected = `12/26/2024|December|${read}|14|Thursday, December 26, 2024 at 11:46 AM|RangeError;TypeError;TypeError;TypeError;`;
        expect((await checkScript(getSource(expected))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected = `12/26/2024|December|${read}|14|Thursday, December 26, 2024 at 11:46 PM|RangeError;TypeError;TypeError;TypeError;`;
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });

      it("stops at a locale other than English for an object that the host's Intl doesn't format", async () => {
        const source = 'new Temporal.PlainDate(2024, 12, [26].length).toLocaleString("de");';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "formats the Temporal objects that a program's literals make through the host's Intl",
    () => {
      const getSource = (expected: string) => `
      const date = new Temporal.PlainDate(2021, 8, 4);
      let error = "none";
      try {
        new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(date);
      } catch (caught) {
        error = (caught as Error).name;
      }
      try {
        new Intl.DurationFormat("en", { hours: "numeric", minutes: "long" });
      } catch (caught) {
        error += (caught as Error).name;
      }
      const result = [
        date.toLocaleString("de-AT", { dateStyle: "long" }),
        new Intl.DateTimeFormat("en-US", { dateStyle: "short" }).format(date),
        Temporal.Instant.fromEpochMilliseconds(0).toLocaleString("en-US", { timeZone: "UTC", timeStyle: "short" }),
        new Intl.DurationFormat("en", { style: "long" }).format({ hours: 1, minutes: 2 }),
        Temporal.Duration.from({ hours: 1 }).toLocaleString("en"),
        Intl.supportedValuesOf("calendar").includes("chinese"),
        error,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        const expected =
          "4. August 2021|8/4/21|12:00 AM|1 hour, 2 minutes|1 hr|true|TypeErrorRangeError";
        expect((await checkScript(getSource(expected))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected =
          "4. August 2021|8/4/21|12:00 AM|1 hour, 2 minute|1 hr|true|TypeErrorRangeError";
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });

      it("stops at a Temporal object that the program's literals don't make", async () => {
        const source =
          'new Temporal.PlainDate(2021, 8, 4).add({ days: [1].length }).toLocaleString("de-AT");';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "reads the time zones that Node takes, by their links and names joined of parts",
    () => {
      const getSource = (expected: string) => `
      const zone = new Temporal.ZonedDateTime(0n, "Asia/Calcutta");
      let rejected = "none";
      try {
        new Temporal.ZonedDateTime(0n, "Etc/GMT-" + "0" + 1);
      } catch (error) {
        rejected = (error as Error).name;
      }
      const result = [
        zone.timeZoneId,
        zone.equals(new Temporal.ZonedDateTime(0n, "asia/kolkata")),
        new Temporal.ZonedDateTime(0n, "Etc/GMT-" + 14).timeZoneId,
        rejected,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        const expected = "Asia/Calcutta|true|Etc/GMT-14|RangeError";
        expect((await checkScript(getSource(expected))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected = "Asia/Calcutta|false|Etc/GMT-14|RangeError";
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });

      it("stops at a joined name that the host's table leaves out", async () => {
        const source = 'new Temporal.ZonedDateTime(0n, "Etc/GMT-" + "1x");';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe("lays Intl out as ECMA-402 does, without its locale data", () => {
    const getSource = (expected: string) => `
      let errors = "";
      for (const run of [
        () => Reflect.apply(Intl.PluralRules, undefined, []),
        () => Intl.ListFormat.prototype.format.call({}, []),
        () => Intl.supportedValuesOf("colors" as "unit"),
        () => Intl.getCanonicalLocales([1 as unknown as string]),
        () => Reflect.getOwnPropertyDescriptor(Intl.NumberFormat.prototype, "format")?.get?.call(5),
        () => Intl.Collator.supportedLocalesOf([], { localeMatcher: "first" as "lookup" }),
        () => Intl.getCanonicalLocales("en_US"),
      ]) {
        try {
          run();
        } catch (error) {
          errors += (error as Error).name + ";";
        }
      }
      const result = [
        Object.prototype.toString.call(Intl),
        Intl.Collator.length,
        Intl.DisplayNames.length,
        Intl.Locale.name,
        Object.getOwnPropertyNames(Intl.Locale.prototype).length,
        Object.prototype.toString.call(Intl.Segmenter.prototype),
        Intl.getCanonicalLocales().length,
        Intl.Collator.supportedLocalesOf([]).length,
        Intl.getCanonicalLocales(["EN-us", "en-US", "art-lojban"]).join(),
        Intl.ListFormat.supportedLocalesOf(["art-lojban", "en-US"], { localeMatcher: "lookup" }).join(),
        errors,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      const expected =
        "[object Intl]|0|2|Locale|22|[object Intl.Segmenter]|0|0|en-US,jbo|en-US|TypeError;TypeError;RangeError;TypeError;TypeError;RangeError;RangeError;";
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const expected =
        "[object Intl]|0|2|Locale|22|[object Intl.Segmenter]|0|0|en-US,jbo|jbo,en-US|TypeError;TypeError;RangeError;TypeError;TypeError;RangeError;RangeError;";
      expect((await checkScript(getSource(expected))).message).toContain(THREW);
    });

    it("stops at a constructor whose options the host's table leaves out", async () => {
      const source = 'new Intl.DurationFormat("en", { numberingSystem: ["ar", "ab"].join("") });';
      expect((await checkScript(source)).message).toContain("tla-ts can't");
    });

    it("stops at a locale that the program doesn't write", async () => {
      const source = 'Intl.getCanonicalLocales(["de", "AT"].join("-"));';
      expect((await checkScript(source)).message).toContain("tla-ts can't");
    });
  });

  describe("constructs the Intl objects whose options read no locale data", () => {
    const getSource = (expected: string) => `
      const read: string[] = [];
      const options = new Proxy(
        {},
        {
          get: (target, key) => {
            read.push(String(key));
            return Reflect.get(target, key);
          },
        },
      );
      const collator = new Intl.Collator(["EN-us"], options);
      class Lists extends Intl.ListFormat {}
      let errors = "";
      for (const run of [
        () => new Intl.Segmenter([], { granularity: "line" as "word" }),
        () => new Intl.DisplayNames([], {} as Intl.DisplayNamesOptions),
        () => new Intl.RelativeTimeFormat([], { numberingSystem: "ab" }),
        () => new Intl.ListFormat([], 5 as Intl.ListFormatOptions),
        () => Intl.Collator.prototype.resolvedOptions.call(new Intl.Segmenter()),
      ]) {
        try {
          run();
        } catch (error) {
          errors += (error as Error).name + ";";
        }
      }
      const result = [
        read.join(),
        collator instanceof Intl.Collator,
        Object.getPrototypeOf(new Lists()) === Lists.prototype,
        Reflect.apply(Intl.Collator, undefined, []) instanceof Intl.Collator,
        errors,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;
    const read = "usage,localeMatcher,collation,numeric,caseFirst,sensitivity,ignorePunctuation";

    it("agrees with Node", async () => {
      const expected = `${read}|true|true|true|RangeError;TypeError;RangeError;TypeError;TypeError;`;
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const expected = `${read}|true|true|true|RangeError;TypeError;TypeError;TypeError;TypeError;`;
      expect((await checkScript(getSource(expected))).message).toContain(THREW);
    });

    it("stops at a method, which reads locale data", async () => {
      const source = 'new Intl.Collator().compare(String.fromCharCode(120), "b");';
      expect((await checkScript(source)).message).toContain("tla-ts can't");
    });
  });

  describe("constructs an Intl.DateTimeFormat from its options", () => {
    const getSource = (expected: string) => `
      const read: string[] = [];
      const options = new Proxy(
        {},
        {
          get: (target, key) => {
            read.push(String(key));
            return Reflect.get(target, key);
          },
        },
      );
      const format = new Intl.DateTimeFormat(["en-US"], options);
      let errors = "";
      for (const run of [
        () => new Intl.DateTimeFormat([], { dateStyle: "short", hour: "numeric" }),
        () => new Intl.DateTimeFormat([], { calendar: "ab" }),
        () => new Intl.DateTimeFormat([], { fractionalSecondDigits: 4 as 3 }),
        () => new Intl.DateTimeFormat([], { timeZone: "+01:00:30" }),
        () => Intl.DateTimeFormat.prototype.formatToParts.call({}),
      ]) {
        try {
          run();
        } catch (error) {
          errors += (error as Error).name + ";";
        }
      }
      const result = [
        read.join(),
        format instanceof Intl.DateTimeFormat,
        Reflect.apply(Intl.DateTimeFormat, {}, []) instanceof Intl.DateTimeFormat,
        errors,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;
    const read =
      "localeMatcher,calendar,numberingSystem,hour12,hourCycle,timeZone,weekday,era,year,month,day,dayPeriod,hour,minute,second,fractionalSecondDigits,timeZoneName,formatMatcher,dateStyle,timeStyle";

    it("agrees with Node", async () => {
      const expected = `${read}|true|true|TypeError;RangeError;RangeError;RangeError;TypeError;`;
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const expected = `${read}|true|true|TypeError;RangeError;TypeError;RangeError;TypeError;`;
      expect((await checkScript(getSource(expected))).message).toContain(THREW);
    });

    it("stops at a format of a date that the host's table leaves out", async () => {
      const source =
        'new Intl.DateTimeFormat("de", { timeZone: "UTC" }).format(Date.UTC([2024].length));';
      expect((await checkScript(source)).message).toContain("tla-ts can't");
    });
  });

  describe("answers Intl's methods from the host's Intl for the literals a program writes", () => {
    const getSource = (expected: string) => `
      const format = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
      const parts = format.formatToParts(-1234.5).map((part) => part.type).join(",");
      const list = new Intl.ListFormat("en-US", { type: "disjunction" });
      const time = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
      const locale = new Intl.Locale("en", { region: "GB" });
      const dates = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });
      const words = [...new Intl.Segmenter("en-US", { granularity: "word" }).segment("Hi there")];
      let errors = "";
      for (const run of [
        () => new Intl.NumberFormat("en-US", { style: "currency" }),
        () => new Intl.NumberFormat("en-US", { maximumFractionDigits: 101 }),
        () => new Intl.ListFormat("en-US").format(["a", 1 as unknown as string]),
        () => time.format(1, "fortnight" as "day"),
      ]) {
        try {
          run();
        } catch (error) {
          errors += (error as Error).name + ";";
        }
      }
      const result = [
        format.format(-1234.5),
        parts,
        (12345.678).toLocaleString("en-US"),
        format.resolvedOptions().minimumFractionDigits,
        list.format(["a", "b", "c"]),
        time.format(-1, "day"),
        new Intl.Collator("en-US").compare("a", "B"),
        locale.toString(),
        locale.maximize().toString(),
        dates.format(0),
        words.filter((word) => word.isWordLike).map((word) => word.segment).join("+"),
        errors,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      const expected =
        "-1.234,50\\u00a0€|minusSign,integer,group,integer,decimal,fraction,literal,currency|12,345.678|2|a, b, or c|yesterday|-1|en-GB|en-Latn-GB|Jan 1, 1970|Hi+there|TypeError;RangeError;TypeError;RangeError;";
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const expected =
        "-1.234,50\\u00a0€|minusSign,integer,group,integer,decimal,fraction,literal,currency|12,345.678|2|a, b, or c|tomorrow|-1|en-GB|en-Latn-GB|Jan 1, 1970|Hi+there|TypeError;RangeError;TypeError;RangeError;";
      expect((await checkScript(getSource(expected))).message).toContain(THREW);
    });

    it("stops at a value that the program doesn't write", async () => {
      const source = 'new Intl.NumberFormat("en-US").format(Math.PI);';
      expect((await checkScript(source)).message).toContain("tla-ts can't");
    });

    // The host's table holds a Collator's compare of each pair of the strings a program writes,
    // within its 5,000 entries: 40 strings make 1,600 pairs, and 80 make 6,400.
    const getCompareSource = (count: number) => `
      const words = [${Array.from({ length: count }, (_, index) => `"w${index}"`).join(", ")}];
      if (new Intl.Collator("en").compare(words[1], words[2]) !== -1) throw new Error("compare");`;

    it("compares the strings of a program whose pairs the table holds", async () => {
      expect((await checkScript(getCompareSource(40))).message).toBeUndefined();
    });

    it("stops at a compare of a program whose pairs the table can't hold", async () => {
      expect((await checkScript(getCompareSource(80))).message).toContain("tla-ts can't");
    });
  });

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "formats dates that a program computes and chains legacy Intl objects",
    () => {
      const getSource = (expected: string) => `
      const format = new Intl.DateTimeFormat("en", { hour: "numeric", dayPeriod: "long" });
      const hours: string[] = [];
      for (let hour = 9; hour < 24; hour += 6) hours.push(format.format(Date.UTC(2017, 11, 12, hour)));
      const chained = Intl.NumberFormat.call(Object.create(Intl.NumberFormat.prototype));
      const symbol = Object.getOwnPropertySymbols(chained)[0];
      const result = [
        hours.join(","),
        symbol.description,
        Intl.NumberFormat.prototype.resolvedOptions.call(chained).locale,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        const expected =
          "9 in the morning,3 in the afternoon,9 at night|IntlLegacyConstructedSymbol|en-US";
        expect((await checkScript(getSource(expected))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected =
          "9 in the morning,3 in the afternoon,9 in the evening|IntlLegacyConstructedSymbol|en-US";
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });

      it("stops at a format of the time now", async () => {
        expect((await checkScript("new Intl.DateTimeFormat().format();")).message).toContain(
          "tla-ts can't",
        );
      });
    },
  );

  // The host's answers for many locales and options, as Effect's DateTime records them, repeat the
  // same options and the same answers, which the table names once each, and a lookup of any of them
  // gives Node's answer.
  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "answers each locale and options of a DateTimeFormat as Node does, from a shared table",
    () => {
      const getSource = (expected: string) => `
      const locales = ["en-US", "en-GB", "de", "fr", "ja"];
      const options = [{}, { hour: "numeric" }, { timeZone: "UTC" }, { hour12: false, timeZone: "UTC" }] as const;
      const result = locales
        .flatMap((locale) =>
          options.map((option) => {
            const resolved = new Intl.DateTimeFormat(locale, option).resolvedOptions();
            return [resolved.locale, resolved.hourCycle ?? "-", resolved.timeZone].join(" ");
          }),
        )
        .join("|");
      if (result !== "${expected}") throw new Error(result);
    `;
      const getExpected = () =>
        ["en-US", "en-GB", "de", "fr", "ja"]
          .flatMap((locale) =>
            [{}, { hour: "numeric" }, { timeZone: "UTC" }, { hour12: false, timeZone: "UTC" }].map(
              (option) => {
                const resolved = new Intl.DateTimeFormat(
                  locale,
                  option as Intl.DateTimeFormatOptions,
                ).resolvedOptions();
                return [resolved.locale, resolved.hourCycle ?? "-", resolved.timeZone].join(" ");
              },
            ),
          )
          .join("|");

      it("agrees with Node", async () => {
        expect((await checkScript(getSource(getExpected()))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected = getExpected().replace("en-GB", "en-AU");
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "runs the locale-sensitive methods of arrays and strings as ECMA-402 does",
    () => {
      const getSource = (expected: string) => `
      const lengths = [{ toLocaleString: (...args: unknown[]) => String(args.length) }].toLocaleString();
      const result = [
        [1234.5, 6].toLocaleString("de-DE"),
        new Int8Array([7]).toLocaleString("en"),
        lengths,
        "a".localeCompare("B", "en"),
        "i".toLocaleUpperCase("tr"),
        "I".toLocaleLowerCase("en"),
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        expect((await checkScript(getSource("1.234,5,6|7|2|-1|İ|i"))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkScript(getSource("1.234,5,6|7|0|-1|İ|i"))).message).toContain(THREW);
      });

      it("stops at a case mapping of a string that the program doesn't write", async () => {
        const source = 'String.fromCharCode(105).toLocaleUpperCase("tr");';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "records the Intl objects of subclasses, computed option names, and locales the host gives back",
    () => {
      const getSource = (expected: string) => `
      const key = "style";
      class Formatter extends Intl.NumberFormat {}
      const result = [
        new Formatter("de-DE").format(1234.5),
        new Intl.NumberFormat("en", { [key]: "percent" }).format(0.5),
        new Intl.NumberFormat("en").format("abc"),
        Intl.getCanonicalLocales(new Intl.NumberFormat().resolvedOptions().locale).join(),
        new Intl.NumberFormat("en", { style: "currency", currency: "USD", currencySign: "accounting", signDisplay: "never" }).format(-5),
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        expect(
          (await checkScript(getSource("1.234,5|50%|NaN|en-US|$5.00"))).message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkScript(getSource("1.234,5|50%|NaN|en-US|($5.00)"))).message).toContain(
          THREW,
        );
      });

      it("stops at a locale that the program joins of parts", async () => {
        const source = 'new Intl.NumberFormat(["d", "e"].join("")).format(1);';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "gives Date's locale strings through Intl.DateTimeFormat",
    () => {
      const getSource = (expected: string) => `
      const date = new Date(0);
      const result = [
        date.toLocaleString("en-US", { timeZone: "UTC" }),
        date.toLocaleDateString("en-US", { month: "long" }),
        date.toLocaleTimeString("en-US", { hour: "numeric" }),
        new Date(Number.NaN).toLocaleString("en-US"),
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        expect(
          (await checkScript(getSource("1/1/1970, 12:00:00 AM|January|12 AM|Invalid Date")))
            .message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect(
          (await checkScript(getSource("1/1/1970, 12:00:00 PM|January|12 AM|Invalid Date")))
            .message,
        ).toContain(THREW);
      });

      it("stops at a time value that the program doesn't write", async () => {
        const source = 'new Date("abcd".length * 1000).toLocaleString("en-US");';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "records the values that a program's arithmetic of literals makes",
    () => {
      const getSource = (expected: string) => `
      const result = [
        new Intl.NumberFormat("en").format(2 ** 10),
        new Intl.DurationFormat("en").format({ years: 2 ** 32 - 1 }),
        new Intl.NumberFormat("en").format(Number.MAX_SAFE_INTEGER),
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        const expected = "1,024|4,294,967,295 yrs|9,007,199,254,740,991";
        expect((await checkScript(getSource(expected))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected = "1,024|4,294,967,295 yrs|9,007,199,254,740,990";
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });

      it("stops at a value that arithmetic of a computed value makes", async () => {
        const source = 'new Intl.NumberFormat("en").format("abc".length ** 10);';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "throws a range's TypeError for a Temporal object and a time value before its RangeError",
    () => {
      const getSource = (expected: string) => `
      const format = new Intl.DateTimeFormat("en");
      let errors = "";
      for (const run of [
        () => format.formatRange({ valueOf: () => Number.NaN }, new Temporal.PlainDate(1970, 1, 1)),
        () => format.formatRange(Number.NaN, 0),
      ]) {
        try {
          run();
        } catch (error) {
          errors += (error as Error).name + ";";
        }
      }
      if (errors !== "${expected}") throw new Error(errors);
    `;

      it("agrees with Node", async () => {
        expect((await checkScript(getSource("TypeError;RangeError;"))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkScript(getSource("RangeError;RangeError;"))).message).toContain(THREW);
      });

      it("stops at a range of time values that the program doesn't write", async () => {
        const source = 'new Intl.DateTimeFormat("de").formatRange(0, "abcd".length * 1000);';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  // HostIntl's table holds at most 5,000 answers, and an object's answers go in only where all of
  // them fit, so a range of every pair of a program's numbers, for each locale it may take, stops
  // past 32 of them. Past the bound the compile computes no more of an object's answers, which for
  // thousands of numbers took more memory than the compile has.
  describe("records the host's Intl answers to its table's bound, and stops past it", () => {
    const getSource = (count: number, expected: string) => `
      const values = [${Array.from({ length: count }, (_, index) => index + 1).join(", ")}];
      const range = new Intl.NumberFormat().formatRange(1, values.length > 1 ? 2 : 1);
      if (range !== "${expected}") throw new Error(range);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(32, "1–2"))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource(32, "1-2"))).message).toContain(THREW);
    });

    it.each([33, 3000])("stops at a range of %i numbers, past the bound", async (count) => {
      expect((await checkScript(getSource(count, "1–2"))).message).toContain(
        "tla-ts can't model a value the host's Intl table leaves out",
      );
    });
  });

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "formats the Temporal objects that a program computes through the host's recorded English patterns",
    () => {
      const getSource = (expected: string) => `
      const date = new Temporal.PlainDate(2000, 5, [2].length);
      let error = "none";
      try {
        new Intl.DateTimeFormat("en", { month: "long" }).format(date.toPlainYearMonth());
      } catch (caught) {
        error = (caught as Error).name;
      }
      const result = [
        new Intl.DateTimeFormat("en").format(date),
        new Intl.DateTimeFormat("en", { month: "long" }).format(date.withCalendar("gregory").toPlainYearMonth()),
        new Intl.DateTimeFormat("en", { hour: "numeric" }).format(new Temporal.PlainTime([3].length)),
        error,
      ].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        expect(
          (await checkScript(getSource("5/1/2000|May|1 AM|RangeError"))).message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkScript(getSource("5/1/2000|May|1 PM|RangeError"))).message).toContain(
          THREW,
        );
      });

      it("stops at a locale whose patterns the table leaves out", async () => {
        const source =
          'new Intl.DateTimeFormat("de").format(new Temporal.PlainDate(2000, 5, [2].length));';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe.runIf(Reflect.has(globalThis, "Temporal"))(
    "throws a RangeError where a Temporal object's calendar isn't its English formatter's",
    () => {
      const getSource = (expected: string) => `
      const calendar = ["greg", "ory"].join("");
      let errors = "";
      for (const make of [
        () => new Temporal.PlainDate(2000, 5, 2, "hebrew").toLocaleString(),
        () => new Temporal.PlainDate(2000, 5, 2, "hebrew").toPlainYearMonth().toLocaleString("en"),
        () => new Temporal.PlainDate(2000, 5, 2, "hebrew").toLocaleString("en", { timeStyle: "short" }),
      ]) {
        try {
          make();
        } catch (error) {
          errors += (error as Error).name + ";";
        }
      }
      const result = [new Temporal.PlainDate(2000, 5, 2, calendar).toLocaleString(), errors].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

      it("agrees with Node", async () => {
        const expected = "5/2/2000|RangeError;RangeError;TypeError;";
        expect((await checkScript(getSource(expected))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        const expected = "5/2/2000|RangeError;RangeError;RangeError;";
        expect((await checkScript(getSource(expected))).message).toContain(THREW);
      });

      it("stops at a calendar option", async () => {
        const source =
          'new Temporal.PlainDate(2000, 5, [2].length).toLocaleString("en", { calendar: "hebrew" });';
        expect((await checkScript(source)).message).toContain("tla-ts can't");
      });
    },
  );

  describe("gives each error V8's own stack accessor", () => {
    const getSource = (expected: string) => `
      const error = new Error("m");
      const own = Object.getOwnPropertyDescriptor(error, "stack");
      const other = Object.getOwnPropertyDescriptor(new TypeError("t"), "stack");
      const set = new Error("s");
      set.stack = "mine";
      const result = [
        Object.getOwnPropertyNames(error).join(),
        Object.getOwnPropertyNames(new AggregateError([])).join(),
        typeof own?.get,
        own?.get === other?.get && own?.set === other?.set,
        JSON.stringify(own?.get?.name),
        own?.enumerable,
        set.stack,
        "stack" in Error.prototype,
      ].join("|");
      if (result !== '${expected}') throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (
          await checkScript(
            getSource('stack,message|stack,errors|function|true|""|false|mine|false'),
          )
        ).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource('message|stack,errors|function|true|""|false|mine|false')))
          .message,
      ).toContain(THREW);
    });

    it("stops where a script reads a frame, whose location a host gives it", async () => {
      expect(
        (await checkScript('if (new Error("m").stack === undefined) throw 1;')).message,
      ).toContain("tla-ts can't tell the location Node gives this file");
    });
  });

  // Each program's stack text, as Node 26 writes it for node /tla-ts/stack.ts.
  describe("writes an error's stack as Node 26 does", () => {
    const cases = [
      {
        name: "the top level of an entry module and the frames Node runs it from",
        program: 'const result = new Error("m").stack;',
        expected:
          "Error: m\n    at file:///tla-ts/stack.ts:1:16\n    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)\n    at async node:internal/modules/esm/loader:650:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:105:5)",
      },
      {
        name: "a named function's frame and an anonymous function's location",
        program:
          'function named() { return [1].map(() => new Error(""))[0]; }\nconst result = named().stack;',
        expected:
          "Error\n    at file:///tla-ts/stack.ts:1:41\n    at Array.map (<anonymous>)\n    at named (file:///tla-ts/stack.ts:1:31)\n    at file:///tla-ts/stack.ts:2:16\n    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)\n    at async node:internal/modules/esm/loader:650:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:105:5)",
      },
      {
        name: "a method's frame by its receiver's type and the key it's called by",
        program:
          'const key = "~effect/Effect/stackProbe";\nconst probe = { [key]: function stackProbe() { return new Error(); } };\nError.stackTraceLimit = 1;\nconst result = probe[key]().stack;',
        expected:
          "Error\n    at Object.stackProbe [as ~effect/Effect/stackProbe] (file:///tla-ts/stack.ts:2:55)",
      },
      {
        name: "a class's methods, a constructor called by new, and a default one",
        program:
          "class Base { error: Error; constructor() { this.error = new Error(); } static make() { return new Derived(); } }\nclass Derived extends Base {}\nconst result = Base.make().error.stack;",
        expected:
          "Error\n    at new Base (file:///tla-ts/stack.ts:1:57)\n    at new Derived (file:///tla-ts/stack.ts:2:1)\n    at Base.make (file:///tla-ts/stack.ts:1:95)\n    at file:///tla-ts/stack.ts:3:21\n    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)\n    at async node:internal/modules/esm/loader:650:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:105:5)",
      },
      {
        name: "the frames a built-in shows and those it hides",
        program:
          "function cb(this: unknown) { return new Error(); }\nconst result = [cb].map((f) => f.call(new Map()))[0].stack;",
        expected:
          "Error\n    at Map.cb (file:///tla-ts/stack.ts:1:37)\n    at file:///tla-ts/stack.ts:2:34\n    at Array.map (<anonymous>)\n    at file:///tla-ts/stack.ts:2:21\n    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)\n    at async node:internal/modules/esm/loader:650:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:105:5)",
      },
      {
        name: "a generator's body above its next",
        program:
          'function* steps() { yield new Error("g"); }\nError.stackTraceLimit = 1;\nconst named = steps().next().value.stack;\nError.stackTraceLimit = 10;\nconst result = named + "|" + (function* () { yield new Error(); })().next().value.stack;',
        expected:
          "Error: g\n    at steps (file:///tla-ts/stack.ts:1:27)|Error\n    at file:///tla-ts/stack.ts:5:52\n    at Generator.next (<anonymous>)\n    at file:///tla-ts/stack.ts:5:70\n    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)\n    at async node:internal/modules/esm/loader:650:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:105:5)",
      },
      {
        name: "the frame of a promise job's function",
        program:
          'let result = "";\nPromise.resolve().then(function job() { result = new Error().stack ?? ""; });\nawait null;',
        expected: "Error\n    at job (file:///tla-ts/stack.ts:2:50)",
      },
      {
        name: "Error.stackTraceLimit and the header of an error that a program renames",
        program:
          'Error.stackTraceLimit = 0;\nconst zero = new Error("z").stack;\n(Error as { stackTraceLimit: unknown }).stackTraceLimit = "3";\nconst none = new Error("z").stack;\nError.stackTraceLimit = 1.9;\nconst late = new Error("a");\nlate.message = "b";\nlate.name = "N";\nconst result = [zero, none, late.stack].join("|");',
        expected: "Error: z||N: b\n    at file:///tla-ts/stack.ts:6:14",
      },
    ];
    const getSource = (program: string, expected: string) =>
      `${program}\nif (result !== ${JSON.stringify(expected)}) throw new Error(result);`;

    for (const entry of cases) {
      it(`agrees with Node on ${entry.name}`, async () => {
        expect(
          (await checkModule(getSource(entry.program, entry.expected))).message,
        ).toBeUndefined();
      });

      it(`rejects another result for ${entry.name}`, async () => {
        const wrong = entry.expected.replace(
          /:(\d+)\b(?!.*:\d+:\d+)/s,
          (_, column) => `:${Number(column) + 1}`,
        );
        expect((await checkModule(getSource(entry.program, wrong))).message).toContain(THREW);
      });
    }

    it("stops at what tla-ts can't tell of a frame", async () => {
      const stops = [
        [
          "const o = { get g() { return new Error(); } };\no.g.stack;",
          "the position V8 gives this frame",
        ],
        [
          "function* steps() { yield new Error(); }\nsteps().next().value.stack;",
          "the constructor name V8 gives this object",
        ],
        [
          "async function f() { await null; return new Error(); }\n(await f()).stack;",
          "tla-ts can't",
        ],
        ["const f = [() => new Error()][0];\nf().stack;", "the name V8 infers for this function"],
        [
          "Error.prepareStackTrace = () => 1;\nnew Error().stack;",
          "a program's Error.prepareStackTrace",
        ],
      ];
      for (const [source, stop] of stops) {
        expect((await checkModule(source)).message).toContain(stop);
      }
    });
  });

  describe("keeps an error that ESCore throws exact but for the message Node writes", () => {
    const getSource = (expected: string) => `
      let caught: unknown;
      try {
        (null as unknown as { x: number }).x;
      } catch (error) {
        caught = error;
      }
      let rethrown = "";
      try {
        try {
          [].reduce(() => 0);
        } catch (error) {
          throw error;
        }
      } catch (error) {
        rethrown = (error as Error).name;
      }
      const error = caught as Error;
      const result = [error instanceof TypeError, error.name, error.constructor === TypeError, rethrown].join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("true|TypeError|true|TypeError"))).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("true|TypeError|true|RangeError"))).message).toContain(
        THREW,
      );
    });

    it("stops where a program reads the message or lists the error's keys", async () => {
      const reads = [
        "error.message",
        "String(error)",
        "Object.keys(error)",
        "JSON.stringify(error)",
      ];
      for (const read of reads) {
        const source = `try { (null as unknown as Record<string, number>)[{} as unknown as string]; } catch (error) { ${read}; }`;
        expect((await checkScript(source)).message).toContain(
          "tla-ts can't read the message that Node writes for an error it throws",
        );
      }
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

  describe("defines a static method named constructor, which TypeScript parses as a constructor", () => {
    const getSource = (expected: string) => `
      const A = class {
        static constructor() { return 1; }
        x = 0;
        constructor() { this.x = 2; }
      } as unknown as { new (): { x: number }; constructor(): number; prototype: object };
      const B = class {
        constructor() {}
        static constructor(value: number) { return value * 2; }
      } as unknown as { constructor(value: number): number };
      const result = [
        A.constructor(),
        new A().x,
        Object.getOwnPropertyNames(A).join(),
        A.constructor.name,
        (A.prototype as { constructor: unknown }).constructor === A,
        B.constructor(4),
        String(A.constructor),
        Object.getOwnPropertyDescriptor(A, "constructor")?.enumerable,
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (
          await checkScript(
            getSource(
              "1,2,length,name,prototype,constructor,constructor,true,8,constructor() { return 1; },false",
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
              "1,2,length,name,prototype,constructor,constructor,false,8,constructor() { return 1; },false",
            ),
          )
        ).message,
      ).toContain(THREW);
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

  // A .js file, as Node's type stripping rejects a function declaration that an if clause is.
  describe("scopes an if clause's function declaration to a block of its own outside strict mode", () => {
    const getSource = (expected: string) => `
      const result = (function () {
        let shadowed = 1;
        if (true) function shadowed() {}
        if (false);
        else function shadowed() {}
        return String(shadowed);
      })();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("1"), false, "", "spec.js")).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource("function shadowed() {}"), false, "", "spec.js")).message,
      ).toContain(THREW);
    });
  });

  describe("assigns each key of a for-in statement to the identifier let outside strict mode", () => {
    const getSource = (expected: string) => `
      var let;
      for (let in { key: 1 });
      const inner = (function () {
        var let;
        for (let in { first: 1, last: 2 });
        return let;
      })();
      const result = [let, inner].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("key,last"), false)).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource("key,first"), false)).message).toContain(THREW);
    });
  });

  describe("runs a var's initializer in a for-in head before its expression, as Annex B does", () => {
    const getSource = (expected: string) => `
      let effects = 0;
      let stored;
      for (var key = (++effects, -1) in ((stored = key), { first: 0, last: 1 }));
      for (var named = function () {} in {});
      const result = [stored, effects, key, named.name].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("-1,1,last,named"), false)).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect((await checkScript(getSource(",1,last,named"), false)).message).toContain(THREW);
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

  // Node runs a .ts file with its types stripped to whitespace.
  describe("gives a function's source text, of a script a TLA+ string can hold or not", () => {
    const getSource = (text: string, expected: string) => `
      const f = (a: number) => a + 1;
      const g = () => "${text}";
      const result = [String(f), String(g)].join("|");
      if (result !== '(a        ) => a + 1|() => "${text}"' + "${expected}") throw new Error(result);
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

  // Node runs a .ts file with its types stripped to whitespace, as its stripTypeScriptTypes gives,
  // and rejects the syntax that only a transform could remove.
  describe("starts a static method's source text after static, as V8 does", () => {
    const getSource = (expected: string) => `
      class Point {
        static make(n: number): number { return n; }
        public static async load(): Promise<void> {}
        static *keys() {}
        static get origin(): number { return 0; }
      }
      const origin = Object.getOwnPropertyDescriptor(Point, "origin")!.get!;
      const result = JSON.stringify([Point.make, Point.load, Point.keys, origin].map(String));
      if (result !== ${JSON.stringify(expected)}) throw new Error(result);
    `;
    const expected = JSON.stringify([
      "make(n        )         { return n; }",
      "async load()                {}",
      "*keys() {}",
      "get origin()         { return 0; }",
    ]);

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource(expected.replace("make(", "static make(")))).message,
      ).toContain(THREW);
    });
  });

  describe("gives each function the source text that Node strips its types from", () => {
    const program = [
      "const arrow = <T,>(value: T, rest?: number): T => value;",
      "class Box<T> implements Iterable<T> {",
      "  private readonly items: T[] = [];",
      "  declare tag: string;",
      "  public add(item: T): this { this.items.push(item!); return this; }",
      "  get size(): number { return this.items.length; }",
      "  set size(value: number) {}",
      "  *[Symbol.iterator](): Iterator<T> { yield* this.items; }",
      "}",
      "const object = { get first(): number { return 1; }, method<T>(this: unknown, value: T) { return value as T; } };",
      "function generic<T extends object = {}>(value: T): asserts value is T {}",
      'const getter = Object.getOwnPropertyDescriptor(Box.prototype, "size")!.get!;',
      'const result = [arrow, Box, Box.prototype.add, getter, Box.prototype[Symbol.iterator], Object.getOwnPropertyDescriptor(object, "first")!.get!, object.method, generic].map(String);',
    ].join("\n");
    const expected = [
      "(value   , rest         )    => value",
      "class Box                           {\n                   items      = [];\n                      \n         add(item   )       { this.items.push(item ); return this; }\n  get size()         { return this.items.length; }\n  set size(value        ) {}\n  *[Symbol.iterator]()              { yield* this.items; }\n}",
      "add(item   )       { this.items.push(item ); return this; }",
      "get size()         { return this.items.length; }",
      "*[Symbol.iterator]()              { yield* this.items; }",
      "get first()         { return 1; }",
      "method   (               value   ) { return value     ; }",
      "function generic                       (value   )                     {}",
    ];
    const getSource = (texts: string[]) =>
      `${program}\nif (JSON.stringify(result) !== ${JSON.stringify(JSON.stringify(texts))}) throw new Error(JSON.stringify(result));`;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const wrong = expected.map((text) => text.replaceAll(/ +/g, " "));
      expect((await checkScript(getSource(wrong))).message).toContain(THREW);
    });

    it("rejects an enum and a namespace as Node does", async () => {
      expect((await checkScript("enum Color { Red }")).message).toContain(
        "TypeScript enum is not supported in strip-only mode",
      );
      expect((await checkScript("namespace N { export const x = 1; }")).message).toContain(
        "TypeScript namespace declaration is not supported in strip-only mode",
      );
      expect((await checkScript("namespace N { export type T = 1; }")).message).toBeUndefined();
    });

    it.each([
      ["an object's", "const holder = { get a(PARAMETER) { return 1; } };\nholder.a;"],
      ["a class's", "class Holder { get a(PARAMETER) { return 1; } }\nnew Holder().a;"],
    ])("rejects a parameter of %s getter as Node does, but this", async (_title, source) => {
      expect((await checkScript(source.replace("PARAMETER", "value = null"))).message).toContain(
        "A `get` accessor cannot have parameters",
      );
      expect(
        (await checkScript(source.replace("PARAMETER", "this: unknown"))).message,
      ).toBeUndefined();
    });
  });

  describe("keeps a date's local time as a host in UTC does", () => {
    const getSource = (expected: string) => `
      const day = new Date(86400000);
      const result = [String(day), day.toTimeString(), day.getHours(), day.getTimezoneOffset(), new Date(1970, 0, 2).getTime()].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      const expected =
        "Fri Jan 02 1970 00:00:00 GMT+0000 (Coordinated Universal Time),00:00:00 GMT+0000 (Coordinated Universal Time),0,0,86400000";
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      const expected = "Fri Jan 02 1970 00:00:00 GMT+0000,00:00:00 GMT+0000,0,0,86400000";
      expect((await checkScript(getSource(expected))).message).toContain(THREW);
    });

    describe.runIf(Reflect.has(globalThis, "Temporal"))("gives the host's time zone", () => {
      it("agrees with Node", async () => {
        expect(
          (await checkScript('if (Temporal.Now.timeZoneId() !== "UTC") throw new Error();'))
            .message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect(
          (await checkScript('if (Temporal.Now.timeZoneId() !== "Etc/UTC") throw new Error();'))
            .message,
        ).toContain(THREW);
      });
    });
  });

  describe("throws V8's message for an error that ESCore throws itself", () => {
    const getSource = (expected: string) => `
declare const undeclared: number;
const read = (run: () => unknown) => {
  try {
    run();
    return "none";
  } catch (error) {
    return \`\${(error as Error).constructor.name}: \${(error as Error).message}\`;
  }
};
const nothing = null as unknown as { x: number };
const result = [
  read(() => undeclared),
  read(() => nothing.x),
  read(() => (nothing as unknown as Record<symbol, number>)[Symbol("d")]),
  read(() => { (undefined as unknown as { x: number }).x = 1; }),
  read(() => { late; let late = 1; }),
  read(() => { const fixed = 1; (fixed as number) = 2; }),
  read(() => "a".repeat(-1.5)),
  read(() => String.fromCodePoint(65.5)),
  read(() => [].reduce((a: number) => a)),
  read(() => (1n as unknown as number) + 1),
  read(() => 1n / 0n),
  read(() => \`\${Symbol("q")}\`),
  read(() => String.prototype.trim.call(null)),
  read(() => Object.keys(null as unknown as object)),
  read(() => Object.setPrototypeOf(null, {})),
].join("|");
      if (result !== ${JSON.stringify(expected)}) throw new Error(result);
    `;
    const expected =
      "ReferenceError: undeclared is not defined|TypeError: Cannot read properties of null (reading 'x')|TypeError: Cannot read properties of null (reading 'Symbol(d)')|TypeError: Cannot set properties of undefined (setting 'x')|ReferenceError: Cannot access 'late' before initialization|TypeError: Assignment to constant variable.|RangeError: Invalid count value: -1.5|RangeError: Invalid code point 65.5|TypeError: Reduce of empty array with no initial value|TypeError: Cannot mix BigInt and other types, use explicit conversions|RangeError: Division by zero|TypeError: Cannot convert a Symbol value to a string|TypeError: String.prototype.trim called on null or undefined|TypeError: Cannot convert undefined or null to object|TypeError: Object.setPrototypeOf called on null or undefined";

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource(expected.replace("(reading 'x')", "(reading x)")))).message,
      ).toContain(THREW);
    });
  });

  describe("throws V8's message for a refused write, an iteration, and a typed array's bounds", () => {
    const getSource = (expected: string) => `
const read = (run: () => unknown) => {
  try {
    run();
    return "none";
  } catch (error) {
    return (error as Error).message;
  }
};
type Loose = Record<string | symbol, unknown>;
const frozen = Object.freeze({ a: 1 }) as Loose;
const closed = Object.preventExtensions({}) as Loose;
const getter = { get a() { return 1; } } as Loose;
const number = 5 as unknown as number[];
const result = [
  read(() => { frozen.a = 2; }),
  read(() => { closed.b = 1; }),
  read(() => { getter.a = 2; }),
  read(() => { (Object.freeze([]) as number[]).push(1); }),
  read(() => Object.defineProperty(frozen, "a", { value: 2 })),
  read(() => [...number]),
  read(() => { for (const item of number) void item; }),
  read(() => Math.max(...number)),
  read(() => new Uint8Array(new ArrayBuffer(4), 8)),
  read(() => new Int32Array(new ArrayBuffer(4), 2)),
  read(() => new Uint8Array(4).set([1], -1)),
  read(() => new Uint8Array(-1)),
].join("|");
      if (result !== ${JSON.stringify(expected)}) throw new Error(result);
    `;
    const expected =
      "Cannot assign to read only property 'a' of object '#<Object>'|Cannot add property b, object is not extensible|Cannot set property a of #<Object> which has only a getter|Cannot add property 0, object is not extensible|Cannot redefine property: a|number is not iterable|number is not iterable|Spread syntax requires ...iterable[Symbol.iterator] to be a function|Start offset 8 is outside the bounds of the buffer|start offset of Int32Array should be a multiple of 4|offset is out of bounds|Invalid typed array length: -1";

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource(expected.replace("number is", "5 is")))).message,
      ).toContain(THREW);
    });
  });

  describe("names a callee that isn't callable by its text, as V8 does", () => {
    const getSource = (expected: string) => `
const read = (run: () => unknown) => {
  try {
    run();
    return "none";
  } catch (error) {
    return (error as Error).message;
  }
};
const box = { f: 1, inner: { g: "x" } } as unknown as { f: () => void; inner: { g: () => void } };
const value = 5 as unknown as () => void;
const Made = 1 as unknown as new () => object;
const result = [read(() => box.f()), read(() => box.inner.g()), read(() => value()), read(() => new Made()), read(() => box.f?.())].join("|");
      if (result !== ${JSON.stringify(expected)}) throw new Error(result);
    `;
    const expected =
      "box.f is not a function|box.inner.g is not a function|value is not a function|Made is not a constructor|box.f is not a function";

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(expected))).message).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource(expected.replace("value is", "value() is")))).message,
      ).toContain(THREW);
    });
  });

  describe("names the part of ECMAScript that ESCore leaves out where it stops", () => {
    it("stops at Atomics.wait with no agent to notify it", async () => {
      const result = await checkScript(
        "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);",
      );
      expect(result.message).toContain(
        "tla-ts can't model Atomics.wait with no agent to notify it",
      );
    });
  });

  describe("stops where a program reads what the host picks at random or reads from its clock", () => {
    const RANDOM = "tla-ts can't run Math.random, whose value the host picks at random";
    const CLOCK = "tla-ts can't read the host's clock, whose time each run reads anew";

    it("stops at Math.random, which Node's runs of this script throw at about half of the time", async () => {
      const result = await checkScript('if (Math.random() >= 0.5) throw new Error("high");');
      expect(result.message).toContain(RANDOM);
    });

    it.each([
      ["Date.now", "Date.now() % 2 === 0"],
      ["the time of a Date that new Date makes", "new Date().getTime() % 2 === 0"],
      ["Date called as a function", 'Date().includes(":00 ")'],
    ])("stops at %s, which reads the time of the run", async (_, condition) => {
      const result = await checkScript(`if (${condition}) throw new Error("even");`);
      expect(result.message).toContain(CLOCK);
    });

    describe("runs a program that names Math.random and the time without reading either", () => {
      const getSource = (expected: string) => `
        const pick = () => Math.random();
        const now = new Date();
        const day = new Date(86400000);
        const result = [typeof pick, now instanceof Date, Object.prototype.toString.call(now), day.getUTCDate(), day.toISOString(), Date.UTC(1970, 0, 2)].join();
        if (result !== "${expected}") throw new Error(result);
      `;

      it("agrees with Node", async () => {
        expect(
          (
            await checkScript(
              getSource("function,true,[object Date],2,1970-01-02T00:00:00.000Z,86400000"),
            )
          ).message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect(
          (
            await checkScript(
              getSource("function,true,[object Date],2,1970-01-02T00:00:00.000Z,86400001"),
            )
          ).message,
        ).toContain(THREW);
      });
    });

    describe("keeps the time Date.now gives where a program only stores, passes, and returns it", () => {
      const getSource = (expected: string) => `
        const time = Date.now();
        const box = { time };
        const pass = (value: number) => value;
        const day = new Date(pass(time));
        const result = [typeof time, typeof box.time, [time].length, day instanceof Date, typeof new Date(Date.now())].join();
        if (result !== "${expected}") throw new Error(result);
      `;

      it("agrees with Node", async () => {
        expect(
          (await checkScript(getSource("number,number,1,true,object"))).message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkScript(getSource("number,number,1,false,object"))).message).toContain(
          THREW,
        );
      });
    });

    it.each([
      ["a comparison", "Date.now() > 0"],
      ["arithmetic", "Date.now() + 1 === 0"],
      ["an increment", "(() => { let time = Date.now(); time++; return time === 0; })()"],
      ["a string", '`${Date.now()}` === ""'],
      ["a branch", "Date.now() ? false : true"],
      ["an equality", "Date.now() === Date.now()"],
      ["JSON", 'JSON.stringify([Date.now()]) === "[0]"'],
      ["a property key", '({ [Date.now()]: 1 }).hasOwnProperty("0")'],
      ["Number.isInteger", "!Number.isInteger(Date.now())"],
      ["a Date's time value", "new Date(Date.now()).getTime() === 0"],
    ])("stops where %s reads the time Date.now gives", async (_, condition) => {
      const result = await checkScript(`if (${condition}) throw new Error("read");`);
      expect(result.message).toContain(CLOCK);
    });

    it.runIf(Reflect.has(globalThis, "Temporal"))(
      "stops at Temporal.Now.instant, which reads the time of the run",
      async () => {
        const result = await checkScript(
          "if (Temporal.Now.instant().epochMilliseconds % 2 === 0) throw new Error();",
        );
        expect(result.message).toContain(CLOCK);
      },
    );

    it("stops at a WeakRef's target after the job that kept it, which Node may collect", async () => {
      const result = await checkModule(`
        const ref = new WeakRef({});
        setTimeout(() => {
          if (ref.deref() === undefined) throw new Error("collected");
        });
      `);
      expect(result.message).toContain(
        "tla-ts can't tell whether the host collected a WeakRef's target after the job that kept it",
      );
    });

    describe("reads a WeakRef's target in the job that keeps it", () => {
      const getSource = (expected: string) => `
        const target = { label: "kept" };
        const ref = new WeakRef(target);
        const result = [ref.deref() === target, ref.deref()?.label].join();
        if (result !== "${expected}") throw new Error(result);
      `;

      it("agrees with Node", async () => {
        expect((await checkScript(getSource("true,kept"))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkScript(getSource("false,kept"))).message).toContain(THREW);
      });
    });

    it("stops where a registry holds a target, whose collection runs its callback", async () => {
      const result = await checkScript(`
        const registry = new FinalizationRegistry(() => {
          throw new Error("collected");
        });
        registry.register({}, "held");
      `);
      expect(result.message).toContain(
        "tla-ts can't tell when the host collects a registered target, which runs the registry's callback",
      );
    });

    describe("throws the TypeError of a registry's register that holds no target", () => {
      const getSource = (expected: string) => `
        const registry = new FinalizationRegistry(() => {});
        let kind = "none";
        try {
          registry.register(1 as unknown as object, "held");
        } catch (error) {
          kind = (error as Error).constructor.name;
        }
        const result = [kind, registry.unregister({})].join();
        if (result !== "${expected}") throw new Error(result);
      `;

      it("agrees with Node", async () => {
        expect((await checkScript(getSource("TypeError,false"))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkScript(getSource("none,false"))).message).toContain(THREW);
      });
    });

    it("stops where an Atomics.waitAsync's timeout runs a reaction, which Node may exit before", async () => {
      const result = await checkModule(`
        const shared = new Int32Array(new SharedArrayBuffer(4));
        Atomics.waitAsync(shared, 0, 0, 10).value.then((value) => {
          throw new Error(String(value));
        });
      `);
      expect(result.message).toContain(
        "tla-ts can't tell whether the host times out this wait, which it may leave as it exits",
      );
    });

    it("stops where a notify wakes an Atomics.waitAsync, whose promise Node resolves in a task", async () => {
      const result = await checkModule(`
        const shared = new Int32Array(new SharedArrayBuffer(4));
        let seen = "none";
        Atomics.waitAsync(shared, 0, 0).value.then((value) => {
          seen = value;
        });
        Atomics.notify(shared, 0);
        await Promise.resolve();
        if (seen !== "none") throw new Error(seen);
      `);
      expect(result.message).toContain(
        "tla-ts can't tell when the host resolves a wait that a notify wakes, which it does in a task of its own",
      );
    });

    describe("runs an Atomics.waitAsync that times out at once or finds another value", () => {
      const getSource = (expected: string) => `
        const shared = new Int32Array(new SharedArrayBuffer(4));
        const first = Atomics.waitAsync(shared, 0, 0, 0);
        const second = Atomics.waitAsync(shared, 0, 1, 10);
        const result = [first.async, first.value, second.async, second.value, Atomics.notify(shared, 0)].join();
        if (result !== "${expected}") throw new Error(result);
      `;

      it("agrees with Node", async () => {
        expect(
          (await checkModule(getSource("false,timed-out,false,not-equal,0"))).message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkModule(getSource("false,timed-out,false,ok,0"))).message).toContain(
          THREW,
        );
      });
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

  // Node runs no JSX, which a bundler compiles to the calls that TypeScript emits for it, here by
  // the factories that the file's pragmas name.
  describe("runs a file of JSX as the calls that TypeScript emits for it", () => {
    const getSource = (expected: string) => `/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */
const Fragment = "frag";
const h = (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) =>
  \`\${String(type)}(\${props === null ? "" : Object.keys(props).join("+")}:\${children.join(",")})\`;
const label = "t";
const view = (
  <div id="a" title={label}>
    {1}
    {" "}
    <span>x</span>
    <>y</>
  </div>
);
if (view !== "${expected}") throw new Error(view);
`;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("div(id+title:1, ,span(:x),frag(:y))"), false, "", "spec.tsx"))
          .message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource("div(id+title:1,span(:x),frag(:y))"), false, "", "spec.tsx"))
          .message,
      ).toContain(THREW);
    });
  });

  // A .jsx file is JavaScript with JSX, which compiles as a .tsx file does.
  describe("runs a file of JavaScript's JSX as the calls that TypeScript emits for it", () => {
    const getSource = (expected: string) => `/** @jsxRuntime classic */
/** @jsx h */
const h = (type, props, ...children) => \`\${type}(\${props === null ? "" : Object.keys(props).join("+")}:\${children.join(",")})\`;
const view = <p id="a">{1}<b>x</b></p>;
if (view !== "${expected}") throw new Error(view);
`;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("p(id:1,b(:x))"), false, "", "spec.jsx")).message,
      ).toBeUndefined();
    });

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource("p(id:b(:x))"), false, "", "spec.jsx")).message,
      ).toContain(THREW);
    });
  });

  describe("runs an array literal of thousands of elements", () => {
    const elements = Array.from({ length: 5000 }, (_, index) =>
      index === 2500 ? '...["x", "y"]' : index === 100 ? "" : String(index % 10),
    ).join(", ");
    const getSource = (expected: string) => `
      const list = [${elements}];
      const result = [list.length, list[99], 100 in list, list[2500], list[2501], list[2502], list[4999]].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("5001,9,false,x,y,1,8"))).message).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect((await checkScript(getSource("5001,9,false,x,y,2,8"))).message).toContain(THREW);
    }, 600_000);
  });

  describe("joins an array of thousands of elements", () => {
    const getSource = (expected: string) => `
      const list = [${Array.from({ length: 5000 }, (_, index) => index % 7).join(", ")}];
      const result = [list.join("-").length, list.join().slice(-9)].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("9999,4,5,6,0,1"))).message).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect((await checkScript(getSource("9999,4,5,6,0,2"))).message).toContain(THREW);
    }, 600_000);
  });

  describe("defines a class of thousands of elements", () => {
    const body = Array.from(
      { length: 1000 },
      (_, index) =>
        `f${index} = ${index}; #p${index} = ${index * 2}; m${index}() { return this.#p${index}; } static s${index}() { return ${index * 3}; }`,
    ).join("\n");
    const getSource = (expected: string) => `
      class C {
        ${body}
        static ready = 0;
        static { C.ready = 7; }
        get g() { return this.#p999 + this.f999; }
      }
      const c = new C() as unknown as Record<string, () => number>;
      const methods = C as unknown as Record<string, () => number>;
      const result = [C.ready, c.f0, c.f999, c.m500(), methods.s999(), c.g, Object.keys(c).length, Object.getOwnPropertyNames(C.prototype).length].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("7,0,999,1000,2997,2997,1000,1002"))).message,
      ).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect((await checkScript(getSource("7,0,999,1000,2997,2997,1000,1001"))).message).toContain(
        THREW,
      );
    }, 600_000);
  });

  describe("serializes thousands of keys, elements, and replacer names to JSON", () => {
    const getSource = (expected: string) => `
      const replacer: number[] = [];
      for (let index = 0; index < 4096; index++) replacer.push(index);
      const list: (number | undefined)[] = [];
      for (let index = 0; index < 3000; index++) list.push(index % 3 === 0 ? undefined : index);
      const wide: Record<string, number> = {};
      for (let index = 0; index < 3000; index++) wide["k" + index] = index;
      const result = [
        JSON.stringify({ foopy: "FAIL", "4093": 17 }, replacer),
        JSON.stringify(list).length,
        JSON.stringify(list, null, 1).length,
        JSON.stringify(wide).length,
        JSON.stringify(wide).slice(-12),
        JSON.stringify(list).slice(0, 12),
      ].join();
      if (result !== '${expected}') throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource('{"4093":17},14263,20264,36781,k2999":2999},[null,1,2,nu')))
          .message,
      ).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource('{"4093":17},14263,20264,36782,k2999":2999},[null,1,2,nu')))
          .message,
      ).toContain(THREW);
    }, 600_000);
  });

  describe("fills an array of thousands of elements", () => {
    const getSource = (expected: string) => `
      const list = new Array<number>(5000).fill(3);
      list.fill(1, 2, 4900);
      const result = [list.length, list[1], list[2], list[4899], list[4900], list.join("").length, list.join("").slice(-4)].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource("5000,3,1,1,3,5000,3333"))).message).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect((await checkScript(getSource("5000,3,1,1,1,5000,3333"))).message).toContain(THREW);
    }, 600_000);
  });

  describe("visits the present elements of an array of thousands", () => {
    const getSource = (expected: string) => `
      const list = new Array<number>(5000).fill(2);
      delete list[10];
      delete list[4000];
      const result = [
        list.reduce((total, item) => total + item, 0),
        list.reduceRight((total, item) => total + item),
        list.indexOf(2, 11),
        list.lastIndexOf(2, 4000),
        list.map((item) => item * 2).filter((item) => item === 4).length,
        ([] as number[]).concat(list, list).length,
        list.some((_, index) => index === 4999),
        list.every((item) => item === 2),
      ].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkScript(getSource("9996,9996,11,3999,4998,10000,true,true"))).message,
      ).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect(
        (await checkScript(getSource("9996,9996,11,4000,4998,10000,true,true"))).message,
      ).toContain(THREW);
    }, 600_000);
  });

  describe("gives a static method's source text from the token after static", () => {
    const getSource = (expected: string) => `
      class A {
        static m() { return 1; }
        static async n() {}
        static /* c */ get g() { return 1; }
        static *gen() {}
        m2() {}
        static async *ag() {}
        static #p() {}
        static pm() { return A.#p; }
      }
      const getter = Object.getOwnPropertyDescriptor(A, "g")?.get;
      const result = [A.m, A.n, getter, A.gen, A.prototype.m2, A.ag, A.pm()].map(String).join("|");
      if (result !== "${expected}") throw new Error(result);
    `;

    it("agrees with Node", async () => {
      expect(
        (
          await checkScript(
            getSource(
              "m() { return 1; }|async n() {}|get g() { return 1; }|*gen() {}|m2() {}|async *ag() {}|#p() {}",
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
              "static m() { return 1; }|async n() {}|get g() { return 1; }|*gen() {}|m2() {}|async *ag() {}|#p() {}",
            ),
          )
        ).message,
      ).toContain(THREW);
    });
  });

  describe("runs a script of thousands of statements and global vars", () => {
    const getSource = (expected: number) => `
      let count = 0;
      ${Array.from({ length: 3000 }, (_, index) => `var global${index};\ncount += ${index % 3};`).join("\n")}
      if (count !== ${expected} || global2999 !== undefined) throw new Error(String(count));
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(3000), false)).message).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect((await checkScript(getSource(2999), false)).message).toContain(THREW);
    }, 600_000);
  });

  describe("compiles a program whose strings run to a million characters", () => {
    // Escapes in a string's source and characters that a TLA+ string can't hold, so that the
    // program's source text and the code units of a string are each one long definition.
    const getSource = (escapes: number, wides: number, expected: number) => `
      const escaped = "${'ab\\n\\"'.repeat(escapes)}";
      const wide = "${"é".repeat(wides)}";
      if (escaped.length + wide.length !== ${expected}) throw new Error(String(escaped.length));
    `;

    it("agrees with Node", async () => {
      expect((await checkScript(getSource(300_000, 20_000, 1_220_000))).message).toBeUndefined();
    }, 600_000);

    it("rejects another result", async () => {
      expect((await checkScript(getSource(300_000, 20_000, 1_220_001))).message).toContain(THREW);
    }, 600_000);

    it("compiles it on the stack that test262's runner gives Node", async () => {
      const compiler = new Worker(
        `const { register } = require("node:module");
        const { parentPort, workerData } = require("node:worker_threads");
        register("data:text/javascript," + encodeURIComponent(\`export const resolve = (specifier, context, next) =>
          next(specifier, context).catch((error) => (specifier.startsWith(".") ? next(specifier + ".ts", context) : Promise.reject(error)));\`));
        Promise.all([
          import(workerData.source + "/typescript/spec/compile.ts"),
          import(workerData.source + "/typescript/spec/prepare.ts"),
        ]).then(([compile, prepare]) => {
          try {
            compile.compileToEscore(workerData.program, "spec.ts", prepare.prepareRuntime(workerData.directory), false);
            parentPort.postMessage("compiled");
          } catch (error) {
            parentPort.postMessage(error.message);
          }
        });`,
        {
          eval: true,
          workerData: {
            source: pathToFileURL(join(import.meta.dirname, "../../src")).href,
            directory: join(import.meta.dirname, "../../ecmascript"),
            program: `"use strict";\n${getSource(300_000, 200_000, 1_400_000)}`,
          },
          resourceLimits: { stackSizeMb: 4 },
        },
      );
      const message = await new Promise((resolve) => compiler.once("message", resolve));
      await compiler.terminate();
      expect(message).toBe("compiled");
    }, 600_000);
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

  // Node throws a SyntaxError as it parses a program with an early error, and runs nothing of it.
  describe("rejects the early errors of the program's own file, as Node does", () => {
    // A program whose last statement throws where total holds other than 1.
    const getSource = (statement: string) =>
      `"use strict";\nconst box = { total: 1 };\nlet total = 1;\n${statement};\nif (total !== 1) throw new Error("total");\n`;

    describe("an assignment to eval in strict mode", () => {
      it("agrees with Node", async () => {
        expect(() => new Script(getSource("eval = 2"))).toThrow(SyntaxError);
        expect((await checkScript(getSource("eval = 2"), false)).message).toContain(
          "SyntaxError: Unexpected eval or arguments in strict mode",
        );
      });

      it("rejects another result", async () => {
        expect(() => runInNewContext(getSource("total = 2"))).toThrow("total");
        expect((await checkScript(getSource("total = 2"), false)).message).toContain(THREW);
      });
    });

    describe("a delete of a name in strict mode", () => {
      it("agrees with Node", async () => {
        expect(() => new Script(getSource("delete total"))).toThrow(SyntaxError);
        expect((await checkScript(getSource("delete total"), false)).message).toContain(
          "SyntaxError: Delete of an unqualified identifier in strict mode.",
        );
      });

      it("rejects another result", async () => {
        expect(() => runInNewContext(getSource("delete box.total"))).not.toThrow();
        expect((await checkScript(getSource("delete box.total"), false)).message).toBeUndefined();
      });
    });

    // Node's verdict on a script's or a module's syntax, as it loads it: whether it strips its
    // types and parses it.
    const isNodeParsed = (source: string, isModule: boolean) => {
      try {
        const stripped = stripTypeScriptTypes(source);
        if (isModule) {
          return (
            spawnSync(process.execPath, ["--input-type=module", "--check"], { input: stripped })
              .status === 0
          );
        }
        new Script(stripped);
        return true;
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        return false;
      }
    };

    // The programs that today's compiler's tests rejected as SyntaxErrors, each a script or a
    // module, which V8's parse rejects as Node loads them.
    const REJECTED: [string, string, boolean][] = [
      ["a malformed regular expression", "const pattern = /[$$]/v;", false],
      [
        "a var that redeclares a function in its block",
        "{\n  function step() {}\n  var step = 1;\n}",
        false,
      ],
      [
        "a function that redeclares a catch parameter",
        "try {} catch (error) {\n  function error() {}\n}",
        false,
      ],
      [
        "two functions with one name in a block in strict mode",
        '"use strict";\n{\n  function step() {}\n  function step() {}\n}',
        false,
      ],
      [
        "a generator and a function with one name in a block",
        "{\n  function* step() {}\n  function step() {}\n}",
        false,
      ],
      [
        "a function as an if's branch in strict mode",
        '"use strict";\nif (true) function step() {}',
        false,
      ],
      [
        "a labelled function as the body of a loop",
        "while (false) label: function step() {}",
        false,
      ],
      ["an arrow that names a parameter twice", "const step = (a: number, a: number) => a;", false],
      [
        "a function that names a parameter twice in strict mode",
        '"use strict";\nfunction step(a: number, a: number) {\n  return a;\n}',
        false,
      ],
      ["a class as the body of an if", "if (true) class Step {}", false],
      ["a function as the body of a loop", "while (false) function step() {}", false],
      [
        "a private name in a pattern",
        "class Box {\n  #size = 1;\n  read() {\n    const { #size: size } = this;\n  }\n}",
        false,
      ],
      ["an escape in new.target", "function make() {\n  return new.t\\u0061rget;\n}", false],
      [
        "assigning arguments in strict mode",
        '"use strict";\nfunction make() {\n  [arguments] = [[]];\n}',
        false,
      ],
      [
        "an export name with a lone surrogate",
        'function step() {}\nexport { step as "\\uD83D" };',
        true,
      ],
      ["an import call that -= assigns", "import('') -= 1;", false],
      ["an import call that **= assigns", "(import('')) **= 1;", false],
      ["an import call that ++ increments", "import('')++;", false],
      ["an import call that -- decrements", "--import('');", false],
      ["a named back reference to a missing group", "var pattern = /(?<a>.)\\k<b>/u;", false],
      [
        "await in an arrow's parameters",
        "export {};\nasync () => { (a = await/r/g) => {}; };",
        true,
      ],
      ["await as a rest parameter", "export {};\nasync (a = (...await) => {}) => {};", true],
      ["an undeclared private name", "export {};\nclass C { x = this.#foo; }", true],
      ["arguments in a field", "export {};\nvar C = class { x = () => arguments; };", true],
      ["arguments in a static block", "export {};\nclass C { static { arguments; } }", true],
      ["super's private name", "export {};\nclass C { #x() {} m() { super.#x(); } }", true],
      [
        "a private name in a class's heritage",
        "export {};\nvar C = class extends class { x = this.#foo; } { #foo; };",
        true,
      ],
      ["a module's repeated function", "export {};\nfunction x() {}\nfunction x() {}", true],
      ["an import of eval", 'export {};\nimport eval from "./missing.js";', true],
      [
        "an import of arguments",
        'export {};\nimport { x as arguments } from "./missing.js";',
        true,
      ],
      [
        "an import's repeated attribute",
        'export {};\nimport x from "./missing.json" with { type: "json", type: "json" };',
        true,
      ],
      [
        "a labelled function as a with statement's body",
        "with ({}) label: function step() {}",
        false,
      ],
      ["a let as a with statement's body", "with ({}) let x = 1;", false],
      ["a let pattern as a with statement's body", "with ({}) let\n[x] = [1];", false],
      ["a with statement in strict mode", '"use strict";\nwith ({}) {}', false],
    ];

    // Of a TypeScript file, Node's type stripping rejects a with statement and a function as an
    // if's branch before V8 parses it, with its own SyntaxError.
    describe.each(REJECTED)("rejects %s, as V8's parse does", (_, source, isModule) => {
      it("agrees with Node", async () => {
        expect(isNodeParsed(source, isModule)).toBe(false);
        const result = isModule ? await checkModule(source) : await checkScript(source, false);
        expect(result.message).toMatch(/SyntaxError(?: \[ERR_INVALID_TYPESCRIPT_SYNTAX\])?: /);
      });
    });

    // V8 places this SyntaxError on line 0, outside the file.
    describe("rejects a rest element's initializer in a for-await-of, as V8's parse does", () => {
      const getSource = (pattern: string) =>
        `async function walk() {\n  for await (const [...${pattern}] of []) {}\n}\nwalk();\n`;

      it("agrees with Node", async () => {
        expect(isNodeParsed(getSource("[x] = []"), false)).toBe(false);
        expect((await checkScript(getSource("[x] = []"), false)).message).toContain(
          "SyntaxError: Invalid left-hand side in for-await-of loop: Must have a single binding.",
        );
      });

      it("runs the rest element without one", async () => {
        expect(isNodeParsed(getSource("[x]"), false)).toBe(true);
        expect((await checkScript(getSource("[x]"), false)).message).toBeUndefined();
      });
    });

    describe("runs a module that V8's parse accepts", () => {
      const getSource = (expected: number) =>
        `export {};\nvar box = { await: 1 };\nbox.await = box.await + 1;\nif (box.await !== ${expected}) throw new Error("seen " + box.await);\n`;

      it("agrees with Node", async () => {
        expect(isNodeParsed(getSource(2), true)).toBe(true);
        expect((await checkModule(getSource(2))).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkModule(getSource(3))).message).toContain(THREW);
      });
    });

    describe("runs a script that V8's parse accepts", () => {
      const getSource = (expected: number) =>
        `function make() {\n  function step() { return 1; }\n  var step = 2;\n  return step;\n}\nif (make() !== ${expected}) throw new Error("make");\n`;

      it("agrees with Node", async () => {
        expect(isNodeParsed(getSource(2), false)).toBe(true);
        expect(() => runInNewContext(getSource(2))).not.toThrow();
        expect((await checkScript(getSource(2), false)).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect(() => runInNewContext(getSource(1))).toThrow("make");
        expect((await checkScript(getSource(1), false)).message).toContain(THREW);
      });
    });

    // TypeScript reports a var in a catch block that redeclares the catch's parameter, which Annex
    // B allows and Node runs.
    // TypeScript's parser reads a let that a line break follows as a declaration, where it's a with
    // statement's body, which JavaScript reads as the name let.
    // A .js file, as Node's type stripping rejects a with statement.
    describe("reads a let that a line break follows in a with statement as a name", () => {
      const getSource = (expected: string) =>
        `var seen = [];\nvar scope = { get let() { seen.push("read"); return 1; } };\nwith (scope) let // ASI\n{}\nwith (scope) let\nx = 2;\nif (seen.join() + x !== "${expected}") throw new Error(seen.join() + x);\n`;

      it("agrees with Node", async () => {
        expect(() => runInNewContext(getSource("read,read2"))).not.toThrow();
        expect(
          (await checkScript(getSource("read,read2"), false, "", "spec.js")).message,
        ).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect((await checkScript(getSource("2"), false, "", "spec.js")).message).toContain(THREW);
      });
    });

    describe("a redeclaration that Annex B allows", () => {
      const getCaught = (expected: number) =>
        `try { throw 1; } catch (caught) { var caught = 2; if (caught !== ${expected}) throw new Error("caught"); }\n`;

      it("agrees with Node", async () => {
        expect(() => runInNewContext(getCaught(2))).not.toThrow();
        expect((await checkScript(getCaught(2), false)).message).toBeUndefined();
      });

      it("rejects another result", async () => {
        expect(() => runInNewContext(getCaught(1))).toThrow("caught");
        expect((await checkScript(getCaught(1), false)).message).toContain(THREW);
      });
    });
  });

  // The realm's recursions over its intrinsics run as loops, so it starts within a small stack.
  it("starts ESCore's realm within a 1 MB stack", async () => {
    const shallow = new Worker(
      `const { register } = require("node:module");
      const { parentPort, workerData } = require("node:worker_threads");
      // HACK: Node strips the types of tla-ts's sources, whose imports leave out the extension.
      register("data:text/javascript," + encodeURIComponent(\`export const resolve = (specifier, context, next) =>
        next(specifier, context).catch((error) => (specifier.startsWith(".") ? next(specifier + ".ts", context) : Promise.reject(error)));\`));
      import(workerData.source + "/typescript/spec/prepare.ts").then((prepare) => {
        try {
          prepare.prepareRuntime(workerData.directory);
          parentPort.postMessage({ name: undefined, message: undefined });
        } catch (error) {
          parentPort.postMessage({ name: error.name, message: error.message });
        }
      });`,
      {
        eval: true,
        workerData: {
          source: pathToFileURL(join(import.meta.dirname, "../../src")).href,
          directory: join(import.meta.dirname, "../../ecmascript"),
        },
        resourceLimits: { stackSizeMb: 1 },
      },
    );
    const thrown = await new Promise<{ name?: string; message?: string }>((resolve) =>
      shallow.once("message", resolve),
    );
    await shallow.terminate();
    expect(thrown).toEqual({ name: undefined, message: undefined });
  }, 300_000);
});

// test262's includes that tla-ts compiles from a TypeScript port, run on ESCore and in Node, where
// the port must behave as the include does. A port that reads its error's stack runs in a module,
// whose location in a stack Node gives as test262's runner does, and one that passes its global
// this runs in a script.
describe("ports test262's harness includes", () => {
  const readPort = (name: string) =>
    readFileSync(join(import.meta.dirname, "../conformance", name), "utf8");
  const getNodeError = (source: string) => {
    try {
      runInNewContext(stripTypeScriptTypes(source));
      return undefined;
    } catch (error) {
      return String(error);
    }
  };

  // The part of test262's assert that the shells call.
  const ASSERT = `
    const assert = {
      sameValue(actual: unknown, expected: unknown, message?: string) {
        if (!Object.is(actual, expected)) throw new Error(\`\${message ?? ""} \${String(actual)} !== \${String(expected)}\`);
      },
    };
  `;

  describe("SpiderMonkey's Set shell", () => {
    const port = ASSERT + readPort("test262-sm-set-shell.ts");
    const uses = `
      assertSetContainsExactOrderedItems(new Set([3, 1, 2]), [3, 1, 2]);
      const like = new SetLike([1, 2]);
      const keys = like.keys();
      const first = keys.next();
      if (like.size !== 2 || !like.has(2) || like.has(3) || first.value !== 1) throw new Error("SetLike");
      const log: unknown[] = [];
      const logged = LoggingProxy({ a: 1 }, log);
      if (logged.proxy.a !== 1 || log.join() !== "[[get]],a") throw new Error(log.join());
      let isRejected = false;
      try {
        keys.return();
      } catch (error) {
        isRejected = String(error).includes("|return|");
      }
      if (!isRejected) throw new Error("return");
    `;

    it("checks a Set's items in order and logs a proxy's reads", async () => {
      expect(getNodeError(port + uses)).toBeUndefined();
      expect((await checkScript(port + uses)).message).toBeUndefined();
    });

    it("rejects a Set whose items come in another order", async () => {
      const wrong = "assertSetContainsExactOrderedItems(new Set([1, 2]), [2, 1]);";
      expect(getNodeError(port + wrong)).toContain("Element at index 0:");
      expect((await checkScript(port + wrong)).message).toContain(THREW);
    });
  });

  describe("SpiderMonkey's TypedArray shell", () => {
    const port = ASSERT + readPort("test262-sm-typed-array-shell.ts");
    const uses = `
      const shared = sharedTypedArrayConstructors[1];
      const array = new shared([1, 2, 3]);
      if (!(array.buffer instanceof SharedArrayBuffer) || array[2] !== 3) throw new Error("shared");
      if (shared.name !== "Uint8Array" || shared.BYTES_PER_ELEMENT !== 1) throw new Error("name");
      if (anyTypedArrayConstructors.length !== 2 * typedArrayConstructors.length) throw new Error("any");
      if (!isSharedConstructor(shared) || isSharedConstructor(Uint8Array)) throw new Error("isShared");
      if (!isUnsignedConstructor(shared) || isFloatConstructor(shared)) throw new Error("kind");
      if (!isFloatConstructor(Float64Array) || isUnsignedConstructor(Int8Array)) throw new Error("float");
    `;

    it("makes a shared constructor of each typed array's and tells their kinds", async () => {
      expect(getNodeError(port + uses)).toBeUndefined();
      expect((await checkScript(port + uses)).message).toBeUndefined();
    });

    it("tells that a signed array's constructor isn't unsigned", async () => {
      const wrong = 'if (isUnsignedConstructor(Int8Array)) throw new Error("unsigned");';
      expect(getNodeError(port + wrong)).toBeUndefined();
      expect((await checkScript(port + wrong)).message).toBeUndefined();
      const asserted = 'if (!isUnsignedConstructor(Int8Array)) throw new Error("signed");';
      expect(getNodeError(port + asserted)).toContain("signed");
      expect((await checkScript(port + asserted)).message).toContain(THREW);
    });
  });

  describe("testIntl.js", () => {
    const port =
      "class Test262Error extends Error {}\n" +
      "function assert(value: unknown, message?: string) { if (value !== true) throw new Test262Error(message); }\n" +
      readPort("test262-test-intl.ts");
    const uses = `
      const names: string[] = [];
      testWithIntlConstructors((Constructor: { name: string }) => names.push(Constructor.name));
      if (names.slice(0, 3).join() !== "Collator,NumberFormat,DateTimeFormat") throw new Error(names.join());
      if (!isCanonicalizedStructurallyValidLanguageTag("de-DE")) throw new Error("de-DE");
      if (isCanonicalizedStructurallyValidLanguageTag("DE-de")) throw new Error("DE-de");
      if (getLocaleBaseName("en-US-u-va-posix") !== "en-US") throw new Error("baseName");
      if (getInvalidLanguageTags().indexOf("x-") === -1) throw new Error("invalid");
    `;

    it("runs a test on each service constructor and tells canonical language tags", async () => {
      expect(getNodeError(port + uses)).toBeUndefined();
      expect((await checkScript(port + uses)).message).toBeUndefined();
    }, 120_000);

    it("rejects a tag that isn't canonical", async () => {
      const wrong =
        'if (!isCanonicalizedStructurallyValidLanguageTag("de-de")) throw new Error("de-de");';
      expect(getNodeError(port + wrong)).toContain("de-de");
      expect((await checkScript(port + wrong)).message).toContain(THREW);
    }, 120_000);
  });

  describe("SpiderMonkey's Math shell", () => {
    const port = readPort("test262-sm-math-shell.ts");
    const near = `
      assertNear(Math.cbrt(27), 3);
      assertNear(-0, 0);
      assertNear(ONE_PLUS_EPSILON, 1);
      let isRejected = false;
      try {
        assertNear(1.5, 1);
      } catch (error) {
        isRejected = String(error).includes("expected a number near 1");
      }
      if (!isRejected) throw new Error("assertNear accepted 1.5 near 1");
    `;

    it("accepts a number near the expected one and rejects one far from it", async () => {
      expect(getNodeError(port + near)).toBeUndefined();
      expect((await checkModule(port + near)).message).toBeUndefined();
    });

    it("rejects a number two representable values away", async () => {
      const far = "assertNear(1 + 2 * Number.EPSILON, 1);";
      expect(getNodeError(port + far)).toContain("expected a number near 1");
      expect((await checkModule(port + far)).message).toContain(THREW);
    });
  });
});
