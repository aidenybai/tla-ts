import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ts from "@typescript/typescript6";
import { check, type CheckResult, formatValue } from "../../src";
import { describe, expect, it } from "vite-plus/test";
import { printModule } from "../../src/printer";
import { compile } from "../../src/typescript/compile";
import { printRegions } from "../../src/typescript/regions";

const checkModel = (source: string) => check(compile(source));

const getTrace = (result: CheckResult) =>
  result.violation?.trace.map((step) =>
    Object.fromEntries(
      Object.entries(step.state).map(([name, value]) => [name, formatValue(value)]),
    ),
  );

describe("actions", () => {
  it("reads a variable's new value after assigning it", async () => {
    const result = await checkModel(`
      let count = 1;
      export const step = () => {
        if (count > 10) return;
        count = count + 1;
        count *= 2;
      };
      export const isNotFour = () => count !== 4;
    `);
    expect(getTrace(result)).toEqual([{ count: "1" }, { count: "4" }]);
  });

  it("disables an action on a path that changes nothing", async () => {
    const result = await checkModel(`
      let isOpen = false;
      let openings = 0;
      export const open = () => {
        if (isOpen || openings >= 2) return;
        isOpen = true;
        openings++;
      };
      export const close = () => {
        if (!isOpen) return;
        isOpen = false;
      };
    `);
    expect(result.status).toBe("deadlock");
    expect(result.distinctStates).toBe(5);
  });

  it("keeps the assignments before a return", async () => {
    const result = await checkModel(`
      let first = 0;
      let second = 0;
      export const step = () => {
        if (first > 0) return;
        first = 1;
        if (second === 0) return;
        second = 1;
      };
    `);
    expect(result.status).toBe("deadlock");
    expect(getTrace(result)).toEqual([
      { first: "0", second: "0" },
      { first: "1", second: "0" },
    ]);
  });

  it("chooses every value of a parameter's type", async () => {
    const result = await checkModel(`
      let count = 0;
      export const add = (amount: 1 | 2) => {
        if (count >= 3) return;
        count += amount;
      };
      export const isNotThree = () => count !== 3;
    `);
    expect(getTrace(result)).toEqual([{ count: "0" }, { count: "1" }, { count: "3" }]);
  });

  it("starts a variable without an initializer at every value of its type", async () => {
    const result = await checkModel(`
      let isOn: boolean;
      export const toggle = () => {
        isOn = !isOn;
      };
    `);
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      4,
      2,
    ]);
  });

  it("chooses a parameter from the set its first guard checks", async () => {
    const result = await checkModel(`
      let pending = new Set([1, 2, 3]);
      export const handle = (message: number) => {
        if (!pending.has(message)) return;
        pending.delete(message);
      };
    `);
    expect([result.status, result.distinctStates]).toEqual(["deadlock", 8]);
  });

  it("translates switch statements", async () => {
    const result = await checkModel(`
      let phase: "idle" | "running" | "done" = "idle";
      export const advance = () => {
        switch (phase) {
          case "idle":
            phase = "running";
            break;
          case "running":
            phase = "done";
            break;
          default:
            return;
        }
      };
    `);
    expect([result.status, result.distinctStates]).toEqual(["deadlock", 3]);
  });

  it("inlines a helper that changes state", async () => {
    const result = await checkModel(`
      /** @noDeadlock */
      let count = 0;
      const bump = () => {
        count++;
      };
      export const step = () => {
        if (count >= 4) return;
        bump();
        bump();
      };
      export const isEven = () => count % 2 === 0;
    `);
    expect([result.status, result.distinctStates]).toEqual(["success", 3]);
  });

  it("chooses a parameter from a set that an earlier guard's parameter picks", async () => {
    const result = await checkModel(`
      let value = 0;
      const getTargets = (step: number) => new Set([value + step, value - step]);
      export const move = (step: number, target: number) => {
        if (!new Set([1, 2]).has(step)) return;
        if (!getTargets(step).has(target)) return;
        if (target < 0 || target > 3) return;
        value = target;
      };
    `);
    expect([result.status, result.distinctStates]).toEqual(["success", 4]);
  });

  it("counts successors like a spec that writes the negated guard as conjuncts", async () => {
    const getGenerated = async (guard: string) =>
      (
        await checkModel(`
          let isLeft = false;
          let isRight = false;
          const isClear = () => !isLeft || !isRight;
          export const setLeft = () => {
            ${guard}
            isLeft = true;
          };
        `)
      ).generatedStates;
    expect(await getGenerated("if (!isClear()) return;")).toBe(
      await getGenerated("if (isClear()) {} else return;"),
    );
  });

  it("changes a value through a Map lookup", async () => {
    const result = await checkModel(`
      type Key = "a" | "b";
      let held = new Map<Key, Set<0 | 1>>([["a", new Set()], ["b", new Set()]]);
      export const take = (key: Key, item: 0 | 1) => {
        held.get(key)!.add(item);
      };
    `);
    expect([result.status, result.distinctStates]).toEqual(["success", 16]);
  });

  it("inlines local functions and functions passed by name", async () => {
    const result = await checkModel(`
      type Seat = 1 | 2 | 3;
      let taken = new Set<Seat>();
      const isTaken = (seat: Seat) => taken.has(seat);
      export const sit = (seat: Seat) => {
        const isNeighbor = (other: Seat) => other === seat + 1 || other === seat - 1;
        if ([...taken].some(isNeighbor) || isTaken(seat)) return;
        taken.add(seat);
      };
      export const isSpread = () => !([1, 2] as Seat[]).every(isTaken);
    `);
    expect([result.status, result.distinctStates]).toEqual(["deadlock", 5]);
  });

  it("stops the check when an action throws", async () => {
    const result = await checkModel(`
      let count = 0;
      export const step = () => {
        if (count === 2) throw new Error("count reached two");
        count++;
      };
    `);
    expect(result.status).toBe("error");
    expect(result.failure?.message).toContain("count reached two");
  });
});

describe("top-level statements", () => {
  it("run once before the first step", async () => {
    const result = await checkModel(`
      let count = 0;
      count += 5;
      export const step = () => {
        if (count >= 7) return;
        count++;
      };
      export const isBelowSeven = () => count < 7;
    `);
    expect(getTrace(result)).toEqual([{ count: "5" }, { count: "6" }, { count: "7" }]);
  });

  it("run helpers that change state", async () => {
    const result = await checkModel(`
      let count = 0;
      const add = (amount: number) => {
        count += amount;
      };
      add(2);
      add(3);
    `);
    expect(getTrace(result)).toEqual([{ count: "5" }]);
  });

  it("read a constant as it was where the code declares it", async () => {
    const result = await checkModel(`
      let count = 1;
      const before = count;
      count = 2;
      if (before !== 1) throw new Error("before changed");
    `);
    expect(result.status).toBe("deadlock");
    expect(getTrace(result)).toEqual([{ count: "2" }]);
  });

  it("may be none in a script that declares functions that read objects", async () => {
    const result = await checkModel(`
      function isSame(left: unknown, right: unknown) {
        return Object.is(left, right);
      }
    `);
    expect(result.status).toBe("deadlock");
  });

  it("run a call that needs statements before the call it is the first argument of", async () => {
    const getSource = (expected: boolean) => `
      let checked = 0;
      function check(value: unknown, expected: unknown) {
        if (value !== expected) throw new Error("unexpected");
        checked++;
      }
      function isThrown() {
        try {
          throw new TypeError("thrown");
        } catch {
          return true;
        }
      }
      check(isThrown(), ${expected});
    `;
    expect(getTrace(await checkModel(getSource(true)))).toEqual([{ checked: "1" }]);
    expect((await checkModel(getSource(false))).failure?.message).toContain("unexpected");
  });

  it("pass a built-in function to a call as a value", async () => {
    const result = await checkModel(`
      function check(left: unknown, right: unknown) {
        const box = {};
        if (left !== right) throw new Error("different");
      }
      check(Reflect.has, Reflect.has);
    `);
    expect(result.status).toBe("deadlock");
  });

  it("run array callbacks that change state as loops", async () => {
    const result = await checkModel(`
      let calls = 0;
      const list = [1, 2, 3];
      let kept = list.filter((value) => {
        calls++;
        return value > 1;
      });
      let isAll = list.every((value) => {
        calls++;
        return value < 2;
      });
      let total = list.reduce((sum, value) => {
        calls++;
        return sum + value;
      });
      let thrown = "none";
      try {
        const empty: number[] = [];
        empty.reduce((sum, value) => {
          calls++;
          return sum + value;
        });
      } catch (error) {
        thrown = error instanceof TypeError ? "TypeError" : "other";
      }
      const boxes = list.map((value) => ({ value }));
      if (boxes[0] === boxes[1] || boxes[2].value !== 3) throw new Error("boxes");
    `);
    expect(getTrace(result)?.[0]).toMatchObject({
      calls: "7",
      kept: "<<2, 3>>",
      isAll: "FALSE",
      total: "6",
      thrown: '"TypeError"',
    });
  });

  it("run array-like callbacks that change state as loops", async () => {
    const result = await checkModel(`
      let calls = 0;
      const object = { 0: 11, 1: 12, length: 2 };
      let isAll = Array.prototype.every.call(object, (value: unknown) => {
        calls++;
        return value === 11;
      });
    `);
    expect(getTrace(result)?.[0]).toMatchObject({ calls: "2", isAll: "FALSE" });
  });

  it("skip the holes of an array-like object in callbacks that change state", async () => {
    const result = await checkModel(`
      let seen = "";
      const object: { [key: string]: unknown } = Object.create({ 1: 6 });
      object[0] = 11;
      object[5] = 10;
      object.length = 20;
      Array.prototype.forEach.call(object, (value: unknown, index: number) => {
        seen = seen + index + ":" + value + ",";
      });
    `);
    expect(getTrace(result)?.[0]).toMatchObject({ seen: '"0:11,1:6,5:10,"' });
  });

  it("make the objects of a parameter's default", async () => {
    const result = await checkModel(`
      let total = 0;
      const add = ({ x, y } = { x: 4, y: 5 }) => {
        total += x + y;
      };
      add();
      add({ x: 1, y: 1 });
    `);
    expect(getTrace(result)?.[0]?.total).toBe("11");
  });

  it("run setters as statements", async () => {
    const result = await checkModel(`
      let total = 0;
      const counter = {
        set add(value: number) {
          total += value;
        },
      };
      for (let i = 0; i < 3; i++) {
        counter.add = i;
      }
    `);
    expect(getTrace(result)?.[0]?.total).toBe("3");
  });

  it("treat a var as a let, even when declared again", async () => {
    const result = await checkModel(`
      var count = 1;
      var count = 2;
      count++;
    `);
    expect(getTrace(result)).toEqual([{ count: "3" }]);
  });

  it("run a loop that builds a string as deep as a loop of numbers", async () => {
    const result = await checkModel(`
      let text = "";
      let count = 0;
      while (count < 1200) {
        text += ".";
        count++;
      }
      if (text.length !== 1200) throw new Error("built");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stop the check when a loop throws, though nothing reads what it changes", async () => {
    await expect(
      checkModel(`
        const list = [1, 2];
        for (const value of list) {
          if (value === 2) throw new Error("two");
        }
      `),
    ).rejects.toThrow("two");
  });

  it("stop the check when an array-like object passes a callback a value of another type", async () => {
    const result = await checkModel(`
      const object: { [key: string]: unknown } = { 0: 11, 1: "abc", length: 2 };
      let isAll = Array.prototype.every.call(object, (value: number) => value === 11);
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't pass a value to a callback parameter of another type",
    );
  });

  it("reject an assignment inside an expression that reads its variable first", () => {
    expect(() =>
      compile(`
        let x = 0;
        let same = x !== (x = 1);
      `),
    ).toThrow("Unsupported operator: =");
  });

  it("reject properties of a value of type any in a script with objects", () => {
    expect(() =>
      compile(`
        const box = {};
        function Shape() {}
        Shape.prototype.inner = { sides: 4 };
        Shape.prototype.inner.sides = 3;
      `),
    ).toThrow("Give this value a type to use its properties");
  });

  it("stop the check at a setter it can't call, before what follows", async () => {
    const result = await checkModel(`
      let count = 0;
      const holder: { [key: string]: unknown } = {};
      Object.defineProperty(holder, "single", {
        set: function (value: unknown) {
          count = 2;
        },
      });
      Object.defineProperty(holder, "arrow", {
        set: (value: unknown) => {
          count = 1;
        },
      });
      holder.arrow = 1;
      if (count !== 1) throw new Error("the setter didn't run");
    `);
    expect(result.failure?.message).toContain("tla-ts can't call setters");
  });

  it("stop the check at a getter it can't call, though nothing reads what it gives", async () => {
    const result = await checkModel(`
      const holder: { [key: string]: unknown } = {};
      Object.defineProperty(holder, "length", {
        get() {
          holder[2] = "two";
          return 3;
        },
      });
      let joined = Array.prototype.join.call(holder, ",");
    `);
    expect(result.failure?.message).toContain("tla-ts can't call getters");
  });

  it("throws a getter's error that a parameter pattern reads, though nothing uses it", async () => {
    const result = await checkModel(`
      const object = {
        get poisoned(): number {
          throw new Error("poisoned");
        },
      };
      const take = ({ poisoned }: { poisoned: number }) => {};
      take(object);
    `);
    expect(result.failure?.message).toContain("poisoned");
  });

  it("throws a getter's error that a call reads, though the statement drops its value", async () => {
    const result = await checkModel(`
      const holder: { poisoned?: number } = {};
      Object.defineProperty(holder, "poisoned", {
        get: function () {
          throw new TypeError();
        },
      });
      function read() {
        return holder.poisoned;
      }
      read();
    `);
    expect(result.failure?.message).toContain("new TypeError()");
  });

  it("throws a getter's error that a declaration reads, though nothing reads it", async () => {
    const result = await checkModel(`
      const holder: { poisoned?: number } = {};
      Object.defineProperty(holder, "poisoned", {
        get: function () {
          throw new TypeError();
        },
      });
      function read() {
        var value = holder.poisoned;
      }
      read();
    `);
    expect(result.failure?.message).toContain("new TypeError()");
  });

  it("run the value of a call that a callback's statement drops", async () => {
    const result = await checkModel(`
      const object = {};
      ["z"].forEach(function () {
        Object.freeze(Array.prototype.forEach);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("call a private method that a getter returns", async () => {
    const result = await checkModel(`
      let calls = 0;
      class Counter {
        #count(step: number) {
          calls = calls + step;
        }
        get count() {
          return this.#count;
        }
      }
      new Counter().count(2);
    `);
    expect(getTrace(result)?.[0]).toMatchObject({ calls: "2" });
  });

  it("stop the check when an object lacks a private name it reads", async () => {
    const result = await checkModel(`
      class Counter {
        #x = 1;
        static read(object: Counter) {
          return object.#x;
        }
      }
      const other = { x: 1 };
      let read = Counter.read(other as unknown as Counter);
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't throw the TypeError of reading a private name an object lacks",
    );
  });

  it("stop the check when they throw", async () => {
    const result = await checkModel(`
      let count = 1;
      count++;
      if (count === 2) throw new Error("count is two");
    `);
    expect(result.status).toBe("error");
    expect(result.failure?.message).toContain("count is two");
  });
});

describe("values", () => {
  it("updates records by key", async () => {
    const result = await checkModel(`
      type Account = "alice" | "bob";
      let balances: Record<Account, number> = { alice: 10, bob: 10 };
      export const transfer = (from: Account, to: Account, amount: 1 | 2 | 3 | 4 | 5) => {
        balances[from] -= amount;
        balances[to] += amount;
      };
      export const noOverdraft = () => balances.alice >= 0 && balances.bob >= 0;
      export const isConserved = () => balances.alice + balances.bob === 20;
    `);
    expect(result.violation?.name).toBe("noOverdraft");
    expect(result.violation?.trace).toHaveLength(4);
  });

  it("filters and quantifies over sets", async () => {
    const result = await checkModel(`
      type Digit = 1 | 2 | 3;
      let seen = new Set<Digit>();
      export const see = (digit: Digit) => {
        seen.add(digit);
      };
      export const isConsistent = () =>
        [...seen].filter((digit) => digit > 1).length <= 2 &&
        seen.values().every((digit) => digit >= 1) &&
        new Set([...seen].map((digit) => digit * 2)).size === seen.size;
    `);
    expect([result.status, result.distinctStates]).toEqual(["success", 8]);
  });

  it("adds and deletes Map entries", async () => {
    const result = await checkModel(`
      type Key = "a" | "b";
      let owners = new Map<Key, 0 | 1>();
      export const own = (key: Key, value: 0 | 1) => {
        owners.set(key, value);
      };
      export const remove = (key: Key) => {
        if (!owners.has(key)) return;
        owners.delete(key);
      };
      export const isSmall = () => owners.size <= 2;
    `);
    expect([result.status, result.distinctStates]).toEqual(["success", 9]);
  });

  it("pushes to and shifts from arrays", async () => {
    const result = await checkModel(`
      let queue: number[] = [];
      let received: number[] = [];
      let sent = 0;
      export const send = () => {
        if (sent >= 3) return;
        queue.push(sent);
        sent++;
      };
      export const receive = () => {
        if (queue.length === 0) return;
        const message = queue.shift()!;
        received = [...received, message];
      };
      export const isInOrder = () => received.every((message, index) => message === index);
    `);
    expect(result.status).toBe("deadlock");
    expect(result.distinctStates).toBe(10);
  });

  it("compiles records with numeric keys to functions", async () => {
    const result = await checkModel(`
      type Id = 1 | 2;
      let isOn: Record<Id, boolean> = { 1: false, 2: true };
      export const toggle = (id: Id) => {
        isOn = { ...isOn, [id]: !isOn[id] };
      };
      export const isNotAllOn = () => !(isOn[1] && isOn[2]);
    `);
    expect(getTrace(result)).toEqual([{ isOn: "<<FALSE, TRUE>>" }, { isOn: "<<TRUE, TRUE>>" }]);
  });

  it("matches JavaScript's remainder, division, and strings", async () => {
    const result = await checkModel(`
      let count = 0;
      export const step = () => {
        count = 1 - count;
      };
      /** @assume */
      export const isLikeJavaScript = () =>
        -7 % 3 === -1 &&
        7 % -3 === 1 &&
        Math.trunc(-7 / 2) === -3 &&
        Math.floor(-7 / 2) === -4 &&
        \`\${"a"}-\${1}\` === "a-1";
    `);
    expect(result.status).toBe("success");
  });

  it("computes the operators on the 32 bits of integers", async () => {
    const result = await checkModel(`
      export const isLikeJavaScript = () =>
        (-1431655766 & 1431655765) === 0 &&
        (-2147483647 | 1) === -2147483647 &&
        (-2147483647 ^ 1) === -2147483647 - 1 &&
        ~2147483647 === -2147483647 - 1 &&
        (1073741824 << 1) === -2147483647 - 1 &&
        (-5 << 33) === -10 &&
        (-987654321 >> 31) === -1 &&
        (-5 >>> 1) === 2147483645 &&
        (-5 >>> 31) === 1 &&
        (5 >>> 32) === 5;
    `);
    expect(result.status).toBe("success");
  });

  it("stops where >>> gives an integer that TLC can't hold", async () => {
    const result = await checkModel(`
      const box = { value: -1 };
      box.value = box.value >>> 0;
    `);
    expect(result.failure?.message).toContain("tla-ts can't hold -1 >>> 0 in an integer");
  });

  it("assigns with the compound forms of %, **, and the bitwise operators", async () => {
    const result = await checkModel(`
      let value = 12;
      value &= 10;
      value |= 3;
      value <<= 28;
      value >>= 4;
      value >>>= 6;
      value %= 1000;
      value **= 2;
      let negative = -7;
      negative %= 3;
      if (value !== 20736 || negative !== -1) throw new Error("compound");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("raises to a negative power, and stops where a script of integers can't hold the power", async () => {
    const result = await checkModel(`
      const exponent = -5;
      if ((-1) ** 3 !== -1 || 1 ** exponent !== 1 || (-1) ** exponent !== -1) {
        throw new Error("power");
      }
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(
        "const exponent = -1;\nconst value = 2 ** exponent;\nif (value > 5) throw new Error();",
      ),
    ).rejects.toThrow("tla-ts can't represent this value");
    await expect(
      checkModel(
        "const exponent = -1;\nconst value = Math.pow(0, exponent);\nif (value > 5) throw new Error();",
      ),
    ).rejects.toThrow("tla-ts can't represent Infinity in this script");
  });

  it("multiplies with Math.imul and reads a literal past 32 bits as ToInt32 does", async () => {
    const result = await checkModel(`
      const hash = (seed: number, value: number) => Math.imul(seed ^ value, 0x01000193);
      if (Math.imul(-2147483647, 3) !== -2147483645 || Math.imul(65537, 65537) !== 131073) {
        throw new Error("imul");
      }
      if (hash(3, 5) !== 100665714 || Math.imul(7, 0x85ebca6b) !== -1452111635) {
        throw new Error("hash");
      }
      if ((0x85ebca6b ^ 0) !== -2048144789) throw new Error("literal");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts the objects that a bitwise operator takes in order", async () => {
    const result = await checkModel(`
      const log = { text: "" };
      const left = { valueOf() { log.text += "L"; return 6; } };
      const right = { valueOf() { log.text += "R"; return "3"; } };
      // @ts-ignore
      const result = left ^ right;
      if (result !== 5 || log.text !== "LR") throw new Error("order");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts an object in an error's message before it makes the error", async () => {
    const result = await checkModel(`
      const value: { [key: string]: unknown } = { valueOf: () => 1 };
      // @ts-ignore
      if (value << 1 !== 3) throw new Error("got " + (value << 1));
    `);
    expect(result.failure?.message).toContain("got 2");
  });

  it("runs a call in an error's message before it makes the error", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      const text: string = "abc";
      if (text.split(/b/).length !== 3) throw new Error("got " + text.split(/b/).length);
    `);
    expect(result.failure?.message).toContain("got 2");
  });

  it("runs a comma's operands in order as statements", async () => {
    const result = await checkModel(`
      let total = 0;
      for (let low = 0, high = 3; low < 3; low++, high--) total += high - low;
      let first = 0;
      let second = 0;
      (first = 1), (second = first + 1);
      if (total !== 3 || second !== 2) throw new Error("got " + total + " " + second);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts what a compound assignment reads from a variable of type any", async () => {
    const result = await checkModel(`
      const marker = NaN;
      let value: any = true;
      // @ts-ignore
      value *= true;
      if (value !== 1) throw new Error("boolean");
      value = new String("3");
      value >>>= 1;
      if (value !== 1) throw new Error("wrapper");
      value = 1;
      value += "a";
      if (value !== "1a") throw new Error("string");
      value = { valueOf: () => 7 };
      value <<= 2;
      if (value !== 28) throw new Error("object");
      value = null;
      // @ts-ignore
      value -= undefined;
      if (value === value) throw new Error("NaN");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("passes a private setter what a compound or logical assignment makes of its getter's value", async () => {
    const getSource = (added: number, stored: number, either: number) => `
      class Counter {
        #seen = 4;
        get #field() {
          return this.#seen + 1;
        }
        set #field(value: number) {
          this.#seen = value * 10;
        }
        add() {
          return (this.#field += 2);
        }
        either() {
          return (this.#field ||= 9);
        }
        seen() {
          return this.#seen;
        }
      }
      const counter = new Counter();
      const expected: number[] = [${added}, ${stored}, ${either}];
      if (counter.add() !== expected[0] || counter.seen() !== expected[1]) throw new Error("add");
      if (counter.either() !== expected[2] || counter.seen() !== 70) throw new Error("or");
    `;
    expect((await checkModel(getSource(7, 70, 71))).failure).toBeUndefined();
    expect((await checkModel(getSource(70, 70, 71))).failure?.message).toContain("add");
    expect((await checkModel(getSource(7, 7, 71))).failure?.message).toContain("add");
    expect((await checkModel(getSource(7, 70, 9))).failure?.message).toContain("or");
  });

  it("writes a property in a logical assignment only where its value doesn't decide", async () => {
    const getSource = (either: number, nullish: number, fixed: number) => `
      class Counter {
        #field = 1;
        either() {
          return (this.#field ||= 9);
        }
      }
      const echo = (value: unknown) => value;
      const expected: number = ${either};
      const counter = new Counter();
      if (counter.either() !== expected) throw new Error("or");
      const box: { count?: number | null } = { count: null };
      box.count ??= 4;
      if (box.count !== ${nullish}) throw new Error("nullish");
      const fixed: { count: number } = { count: 2 };
      Object.defineProperty(fixed, "count", { writable: false });
      if (echo((fixed.count ||= 0)) !== ${fixed}) throw new Error("fixed");
    `;
    expect((await checkModel(getSource(1, 4, 2))).failure).toBeUndefined();
    expect((await checkModel(getSource(9, 4, 2))).failure?.message).toContain("or");
    expect((await checkModel(getSource(1, 5, 2))).failure?.message).toContain("nullish");
    expect((await checkModel(getSource(1, 4, 0))).failure?.message).toContain("fixed");
  });

  it("runs a function whose statements assign its parameters in its expressions", async () => {
    const getSource = (compound: number, increment: number, declared: number) => `
      function increment(value: number) {
        return (value += 1);
      }
      function after(value: number) {
        return value++;
      }
      function doubled(value: number) {
        const twice = (value *= 2);
        return twice + value;
      }
      const expected: number[] = [${compound}, ${increment}, ${declared}];
      if (increment(1) !== expected[0]) throw new Error("compound");
      if (after(1) !== expected[1]) throw new Error("increment");
      if (doubled(2) !== expected[2]) throw new Error("declared");
    `;
    expect((await checkModel(getSource(2, 1, 8))).failure).toBeUndefined();
    await expect(checkModel(getSource(1, 1, 8))).rejects.toThrow("compound");
    await expect(checkModel(getSource(2, 2, 8))).rejects.toThrow("increment");
    await expect(checkModel(getSource(2, 1, 4))).rejects.toThrow("declared");
  });

  it("runs an assignment inside another's value first where it writes another name", async () => {
    const getSource = (nested: number, stored: number, count: number) => `
      function sum(first: number, second: number, third: number) {
        return (first += second += third);
      }
      let count = 0;
      const box: { stored?: number } = {};
      box.stored = count += 2;
      const expected: number[] = [${nested}, ${stored}, ${count}];
      if (sum(10, 20, 30) !== expected[0]) throw new Error("nested");
      if (box.stored !== expected[1] || count !== expected[2]) throw new Error("stored");
    `;
    expect((await checkModel(getSource(60, 2, 2))).failure).toBeUndefined();
    expect((await checkModel(getSource(50, 2, 2))).failure?.message).toContain("nested");
    expect((await checkModel(getSource(60, 0, 2))).failure?.message).toContain("stored");
    expect((await checkModel(getSource(60, 2, 0))).failure?.message).toContain("stored");
    expect(() =>
      compile(`
        let value = 1;
        function grow() {
          return (value += value += 1);
        }
        if (grow() !== 3) throw new Error("self");
      `),
    ).toThrow("Unsupported operator: +=");
  });

  it("gives what a compound assignment to a property writes, as its value", async () => {
    const getSource = (field: number, property: number, element: number, typed: number) => `
      class Counter {
        #field = 1;
        add() {
          return (this.#field += 2);
        }
        value() {
          return this.#field;
        }
      }
      const counter = new Counter();
      const echo = (value: unknown) => value;
      const field: number = ${field};
      const property: number = ${property};
      const element: number = ${element};
      const typed: number = ${typed};
      if (counter.add() !== field || counter.value() !== 3) throw new Error("private");
      const box: { count: number } = { count: 1 };
      if (echo((box.count *= 5)) !== property || box.count !== 5) throw new Error("property");
      const list = [1, 2];
      const index = 1;
      if ((list[index] -= 4) !== element || list[1] !== -2) throw new Error("element");
      const bytes = new Uint8Array(1);
      if (echo((bytes[0] += 300)) !== typed || bytes[0] !== 44) throw new Error("typed");
    `;
    expect((await checkModel(getSource(3, 5, -2, 300))).failure).toBeUndefined();
    expect((await checkModel(getSource(1, 5, -2, 300))).failure?.message).toContain("private");
    expect((await checkModel(getSource(3, 1, -2, 300))).failure?.message).toContain("property");
    expect((await checkModel(getSource(3, 5, 2, 300))).failure?.message).toContain("element");
    expect((await checkModel(getSource(3, 5, -2, 44))).failure?.message).toContain("typed");
  });
});

describe("bounds", () => {
  it("chooses a number from -3 to 3", async () => {
    const result = await checkModel(`
      let total = 0;
      export const add = (amount: number) => {
        if (total !== 0) return;
        total = amount;
      };
      /** @noDeadlock */
      export const isAboveMinimum = () => total > -3;
    `);
    expect(getTrace(result)).toEqual([{ total: "0" }, { total: "-3" }]);
  });

  it("chooses a string from three", async () => {
    const result = await checkModel(`
      let names = new Set<string>();
      export const add = (name: string) => {
        names.add(name);
      };
      /** @noDeadlock */
      export const isSmall = () => names.size < 3;
    `);
    expect(result.status).toBe("invariant-violation");
    expect(result.distinctStates).toBe(8);
  });

  it("starts an array at every length up to 3", async () => {
    const result = await checkModel(`
      let bits!: (0 | 1)[];
      /** @noDeadlock */
      export const isShort = () => bits.length <= 3;
    `);
    expect(result.status).toBe("success");
    expect(result.distinctStates).toBe(1 + 2 + 4 + 8);
  });
});

describe("calls", () => {
  it("reports a throw for some argument of a function that reads no state", async () => {
    const result = await checkModel(`
      export const clamp = (value: number, low: number, high: number) => {
        if (low > high) throw new Error("low is above high");
        return Math.min(Math.max(value, low), high);
      };
    `);
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toContain('"low is above high"');
  });

  it("passes a function that returns for every argument", async () => {
    const result = await checkModel(`
      export const clamp = (value: number, low: 0 | 1, high: 2 | 3) => {
        if (low > high) throw new Error("low is above high");
        return Math.min(Math.max(value, low), high);
      };
    `);
    expect(result.status).toBe("success");
  });

  it("calls a boolean function with parameters without asserting it", async () => {
    const result = await checkModel(`
      let count = 0;
      export const step = () => {
        count = 1 - count;
      };
      export const isBelow = (limit: 1 | 2) => count < limit;
    `);
    expect(result.status).toBe("success");
  });

  it("sorts, reverses, and splices an array that a model holds", async () => {
    const getSource = (expected: string) => `
      let values: number[] = [3, 1, 2];
      export const step = () => {
        values.sort();
        values.reverse();
        values.splice(0, 1);
      };
      export const isKnown = () => ["3,1,2", "${expected}", "1", ""].includes(values.join(","));
    `;
    expect((await checkModel(getSource("2,1"))).status).toBe("success");
    expect((await checkModel(getSource("1,2"))).status).toBe("invariant-violation");
  });

  it("truncates an array whose length a model sets", async () => {
    const getSource = (expected: string) => `
      let values: number[] = [3, 1, 2];
      export const step = () => {
        values.length = values.length > 0 ? values.length - 1 : 0;
      };
      export const isKnown = () => ["3,1,2", "${expected}", "3", ""].includes(values.join(","));
    `;
    expect((await checkModel(getSource("3,1"))).status).toBe("success");
    expect((await checkModel(getSource("1,2"))).status).toBe("invariant-violation");
  });

  it("truncates an array whose length a script sets, and stops where it would leave holes", async () => {
    const result = await checkModel(`
      const x = [1, 2, 3, 4];
      x.length = 2;
      const arr = [1, 2, 3];
      let visited = 0;
      arr.forEach((value: number) => {
        visited += value;
        arr.length = 2;
      });
      if (x.join(",") !== "1,2" || visited !== 3) throw new Error("truncated");
      x.length = 3;
    `);
    expect(result.failure?.message).toContain("tla-ts can't lengthen an array");
  });

  it("reports an index out of range in a function that reads state", async () => {
    const result = await checkModel(`
      let queue: number[] = [];
      export const push = (value: 1 | 2) => {
        if (queue.length > 0) return;
        queue.push(value);
      };
      export const getFirst = () => queue[0]!;
    `);
    expect(result.status).toBe("error");
    expect(result.failure?.message).toContain("out of bounds");
  });

  it("passes a local function to a local function that calls it", async () => {
    const getSource = (expected: number) => `
      const twice = (items: number[], offset: number): number[] => {
        const shift = (value: number) => value + offset;
        const run = (each: (value: number) => number, value: number) => each(each(value));
        return items.map((item) => run(shift, item));
      };
      const result = twice([1, 2], 10);
      if (result[0] !== ${expected} || result[1] !== 22) throw new Error("twice");
    `;
    expect((await checkModel(getSource(21))).failure).toBeUndefined();
    await expect(checkModel(getSource(20))).rejects.toThrow("twice");
  });

  it("calls a local function that calls itself, with the names it reads as they are then", async () => {
    const getSource = (expected: number) => `
      const run = (): number => {
        let base = 1;
        const down = (index: number): number => (index <= 0 ? base : down(index - 1));
        const first = down(2);
        base = 5;
        return first * 10 + down(2);
      };
      if (run() !== ${expected}) throw new Error("run");
    `;
    expect((await checkModel(getSource(15))).failure).toBeUndefined();
    await expect(checkModel(getSource(11))).rejects.toThrow("run");
  });

  it("calls local functions that call each other from statements", async () => {
    const result = await checkModel(`
      let result = 0;
      const parity = (value: number): number => {
        const isEven = (n: number): boolean => (n === 0 ? true : isOdd(n - 1));
        const isOdd = (n: number): boolean => {
          if (n === 0) return false;
          return isEven(n - 1);
        };
        const factorial = (k: number): number => {
          if (k <= 1) return 1;
          return k * factorial(k - 1);
        };
        return isEven(value) ? factorial(value) : 0;
      };
      result = parity(4);
      if (result !== 24 || parity(3) !== 0) throw new Error("parity");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("changes an array around a local function that calls itself", async () => {
    const getSource = (expected: number) => `
      const outer = (limit: number): number => {
        const seen = [0];
        const add = (index: number): number => {
          seen.push(index);
          return index >= limit ? seen.length : add(index + 1);
        };
        return add(0);
      };
      const total = outer(2);
      if (total !== ${expected}) throw new Error("total");
    `;
    expect((await checkModel(getSource(4))).failure).toBeUndefined();
    await expect(checkModel(getSource(5))).rejects.toThrow("total");
  });

  it("rejects catching a throw from a local function that calls itself", () => {
    expect(() =>
      compile(`
        const outer = (limit: number): number => {
          const rec = (k: number): number => {
            if (k > limit) throw new Error("big");
            return rec(k + 1);
          };
          return rec(0);
        };
        let caught = false;
        try {
          outer(2);
        } catch {
          caught = true;
        }
        if (!caught) throw new Error("caught");
      `),
    ).toThrow("Inside try, call a function that throws as its own statement");
  });

  it("ends a case with a block that returns", async () => {
    const getSource = (expected: string) => `
      const describe = (value: number): string => {
        const name = (current: number) => {
          switch (current) {
            case 0: {
              const zero = "zero";
              return zero;
            }
            default: {
              throw new Error("other");
            }
          }
        };
        return value === 0 ? name(value) : "other";
      };
      if (describe(0) !== "${expected}" || describe(1) !== "other") throw new Error("describe");
    `;
    expect((await checkModel(getSource("zero"))).failure).toBeUndefined();
    await expect(checkModel(getSource("one"))).rejects.toThrow("describe");
  });

  it("maps with a local function that a name holds", async () => {
    const result = await checkModel(`
      const scale = (items: number[]): number[] => {
        const factor = 3;
        const times = (value: number) => value * factor;
        return items.map(times);
      };
      const result = scale([1, 2]);
      if (result[0] !== 3 || result[1] !== 6) throw new Error("scale");
    `);
    expect(result.failure).toBeUndefined();
  });
  it("run a call in a property's value after the reads that evaluate before it", async () => {
    const result = await checkModel(`
      const state = { count: 1, label: "" };
      const bump = () => {
        state.count++;
        return { text: String(state.count) };
      };
      state.label = \`\${state.count}:\${bump().text}:\${state.count}\`;
      if (state.label !== "1:2:2") throw new Error("label");
      let target = { v: "a" };
      const first = target;
      const other = { v: "z" };
      const swap = () => {
        target = other;
        return { text: "s" };
      };
      target.v = \`\${swap().text}\`;
      if (first.v !== "s" || other.v !== "z") throw new Error("swap");
      const table: Record<string, string> = { a: "", b: "" };
      let key = "a";
      const turn = () => {
        key = "b";
        return { text: "t" };
      };
      table[key] = \`\${turn().text}\${key}\`;
      if (table.a !== "tb" || table.b !== "") throw new Error("table");
    `);
    expect(result.status).toBe("deadlock");
  });

  it("branch on a short-circuit whose right operand calls a function that makes objects", async () => {
    const result = await checkModel(`
      const cursor = { index: 1 };
      const read = (source: string, at: number) =>
        source[at] === "\\\\" ? { text: "word", length: 2 } : source[at] === "+" ? { text: "plus", length: 1 } : undefined;
      const first = read("x\\\\in", cursor.index) ?? read("+a", 0);
      if (first?.text !== "word") throw new Error("first");
      const second = read("+a", cursor.index) ?? read("+a", 0);
      if (second?.text !== "plus") throw new Error("second");
      const third = cursor.index > 0 ? read("--", 0) : read("+a", 0);
      if (third !== undefined) throw new Error("third");
    `);
    expect(result.status).toBe("deadlock");
  });
});

describe("calls tla-ts can't compile", () => {
  it("chooses any value of the call's type in an action", async () => {
    const result = await checkModel(`
      let roll = 0;
      export const reroll = () => {
        if (roll !== 0) return;
        roll = Math.random();
      };
      /** @noDeadlock */
      export const isAboveMinimum = () => roll > -3;
    `);
    expect(getTrace(result)).toEqual([{ roll: "0" }, { roll: "-3" }]);
  });

  it("chooses any value of a method call on a value it can't compile", async () => {
    const result = await checkModel(`
      let time = 0;
      export const tick = () => {
        if (time !== 0) return;
        time = new Date().getTime();
      };
      /** @noDeadlock */
      export const isAboveMinimum = () => time > -3;
    `);
    expect(result.status).toBe("invariant-violation");
  });

  it("calls a check with every value of the call's type", async () => {
    const result = await checkModel(`
      export const getShare = (total: 0 | 6) => {
        const people = Math.round(total);
        if (people === 0) throw new Error("no people");
        return Math.floor(total / people);
      };
    `);
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toContain('"no people"');
  });

  it("chooses any value of a function that only a declaration file declares", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/unknowns/cart.ts");
    const result = await check(compile(readFileSync(path, "utf8"), path));
    expect(result.status).toBe("invariant-violation");
    expect(getTrace(result)).toEqual([{ total: "0" }, { total: "-3" }]);
  });
});

describe("definitions", () => {
  it("compiles recursive helpers", async () => {
    const result = await checkModel(`
      const factorial = (value: number): number => (value <= 1 ? 1 : value * factorial(value - 1));
      let count = 0;
      export const step = () => {
        if (count >= 4) return;
        count++;
      };
      export const isSmall = () => factorial(count) <= 6;
    `);
    expect(result.violation?.name).toBe("isSmall");
    expect(getTrace(result)?.at(-1)).toEqual({ count: "4" });
  });

  it("compiles a namespace's functions and constants as helpers, not actions", async () => {
    const result = await checkModel(`
      namespace limits {
        export const max = 3;
        export function clamp(value: number) {
          return value > max ? max : value;
        }
      }
      let count = limits.clamp(5);
      export const step = () => {
        if (count <= 0) return;
        count--;
      };
    `);
    expect([result.status, result.distinctStates]).toEqual(["deadlock", 4]);
  });

  it("compiles a namespace that merges with a function", async () => {
    const result = await checkModel(`
      function check(value: number) {
        if (value !== 2) throw new Error("not two");
      }
      namespace check {
        export function isPositive(value: number) {
          if (value <= 0) throw new Error("not positive");
        }
      }
      let count = 2;
      check(count);
      count = -1;
      check.isPositive(count);
    `);
    expect(result.failure?.message).toContain("not positive");
  });

  it("throws a class without compiling it", async () => {
    const result = await checkModel(`
      class CountError extends Error {}
      let count = 1;
      if (count === 1) throw new CountError("count is one");
    `);
    expect(result.failure?.message).toContain("count is one");
  });

  it("rejects a function of another file that shares an object it changes", () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/aliasing.ts");
    expect(() => compile(readFileSync(path, "utf8"), path)).toThrow(
      "first would share an object that changes in place, so copy it",
    );
  });

  it("runs the files a script imports first, in the order they import each other", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/ordered.ts");
    const source = readFileSync(path, "utf8");
    expect((await check(compile(source, path))).failure).toBeUndefined();
    const wrong = await check(compile(source.replace("!== 12", "!== 2"), path));
    expect(wrong.failure?.message).toContain("out of order");
  });

  it("changes the state of another file", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/totaling.ts");
    const source = readFileSync(path, "utf8");
    const result = await check(compile(source, path));
    expect([result.status, result.distinctStates]).toEqual(["deadlock", 4]);
    const violated = await check(compile(source.replace("<= 3", "<= 2"), path));
    expect(violated.status).toBe("invariant-violation");
  });

  it("constructs a class that another file declares", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/stepping.ts");
    const source = readFileSync(path, "utf8");
    expect((await check(compile(source, path))).failure).toBeUndefined();
    const wrong = await check(compile(source.replace("!== 7", "!== 8"), path));
    expect(wrong.failure?.message).toContain("stepped");
  });

  it("skips the code of a class that a file names only as a type", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/chain-typing.ts");
    const source = readFileSync(path, "utf8");
    expect((await check(compile(source, path))).failure).toBeUndefined();
    const wrong = await check(compile(source.replace("!== 2", "!== 3"), path));
    expect(wrong.failure?.message).toContain("linked");
  });

  it("runs nothing of a file that a file imports only types from", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/leveling.ts");
    const source = readFileSync(path, "utf8");
    expect((await check(compile(source, path))).failure).toBeUndefined();
    const wrong = await check(compile(source.replace("!== 2", "!== 3"), path));
    expect(wrong.failure?.message).toContain("leveled");
  });

  it("compiles constants and functions imported from other files", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/counter.ts");
    const result = await check(compile(readFileSync(path, "utf8"), path));
    expect([result.status, result.distinctStates]).toEqual(["deadlock", 5]);
  });
});

describe("tags", () => {
  const ticker = (tag: string) => `
    /** @noDeadlock */
    let count = 0;
    ${tag}
    export const tick = () => {
      if (count >= 3) return;
      count++;
    };
    /** @eventually */
    export const reachesThree = () => count === 3;
  `;

  it("checks eventually with weak fairness", async () => {
    expect((await checkModel(ticker("/** @fair */"))).status).toBe("success");
    expect((await checkModel(ticker(""))).status).toBe("liveness-violation");
  });

  it("checks a step property against the state before the step", async () => {
    const result = await checkModel(`
      let count = 0;
      export const step = () => {
        count = count === 2 ? 0 : count + 1;
      };
      /** @always */
      export const neverDecreases = (before: { count: number }) => count >= before.count;
    `);
    expect(result.status).toBe("liveness-violation");
    expect(result.violation?.name).toBe("neverDecreases");
  });

  it("passes the state before a step as a value", async () => {
    const result = await checkModel(`
      interface State { count: number }
      let count = 0;
      export const step = () => {
        count = count === 2 ? 0 : count + 1;
      };
      const isGrowing = (from: State, to: State) => to.count >= from.count;
      /** @always */
      export const neverDecreases = (before: State) => isGrowing(before, { count });
    `);
    expect(result.violation?.name).toBe("neverDecreases");
  });

  it("checks a temporal property for every parameter value", async () => {
    const result = await checkModel(`
      type Proc = 1 | 2;
      let waiting = new Set<Proc>();
      let served = new Set<Proc>();
      /** @fair */
      export const arrive = (proc: Proc) => {
        if (waiting.has(proc) || served.has(proc)) return;
        waiting.add(proc);
      };
      /** @fair */
      export const serve = (proc: Proc) => {
        if (!waiting.has(proc)) return;
        waiting.delete(proc);
        served.add(proc);
      };
      /** @fair */
      export const leave = (proc: Proc) => {
        if (!served.has(proc)) return;
        served.delete(proc);
      };
      const isServed = (proc: Proc) => served.has(proc);
      /** @alwaysEventually */
      export const isServedOften = (proc: Proc) => served.has(proc);
      /** @leadsTo isServed */
      export const isWaiting = (proc: Proc) => waiting.has(proc);
    `);
    expect(result.status).toBe("success");
  });

  it("reduces states with a symmetric type", async () => {
    const getDistinctStates = async (tag: string) =>
      (
        await checkModel(`
          ${tag}
          type Proc = "p1" | "p2";
          let busy = new Set<Proc>();
          export const start = (proc: Proc) => {
            busy.add(proc);
          };
        `)
      ).distinctStates;
    expect(await getDistinctStates("")).toBe(4);
    expect(await getDistinctStates("/** @symmetric */")).toBe(3);
  });

  it("starts only in states that satisfy an initial predicate", async () => {
    const result = await checkModel(`
      let low: 0 | 1 | 2;
      let high: 0 | 1 | 2;
      export const swap = () => {
        [low, high] = [high, low];
      };
      /** @initially */
      export const isOrdered = () => low < high;
    `);
    expect([result.status, result.distinctStates]).toEqual(["success", 6]);
  });

  it("stops exploring past a constraint", async () => {
    const result = await checkModel(`
      let count = 0;
      export const step = () => {
        count++;
      };
      /** @constraint */
      export const isSmall = () => count <= 2;
    `);
    expect([result.status, result.distinctStates]).toEqual(["success", 3]);
  });

  it("checks assumptions before the search", async () => {
    const result = await checkModel(`
      const LIMIT = 0;
      let count = 0;
      export const step = () => {
        count = 1 - count;
      };
      /** @assume */
      export const isPositive = () => LIMIT > 0;
    `);
    expect(result.status).toBe("assumption-violation");
  });
});

describe("errors", () => {
  it("keeps a binding in a catch that a function in the catch captures", async () => {
    const result = await checkModel(`
      var probe: () => unknown, other: () => unknown, x: unknown;
      try {
        throw "inside";
      } catch (x) {
        probe = function () { return x; };
      }
      try {
        throw null;
      } catch (_) {
        let x = "block";
        other = function () { return x; };
      }
      x = "outside";
      if (x !== "outside" || probe() !== "inside" || other() !== "block") throw new Error("missed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reports type errors", () => {
    expect(() => compile(`let count = 0;\nexport const step = () => { count = "one"; };`)).toThrow(
      /Type 'string' is not assignable to type 'number'/,
    );
  });

  it("rejects a parameter without a finite type", () => {
    expect(() =>
      compile(`let count = 0;\nexport const run = (step: () => number) => { count += step(); };`),
    ).toThrow("spec.ts:2:21 () => number isn't finite");
  });

  it("fails the check where an action writes past the end of an array", async () => {
    const result = await check(
      compile(`let values = [1];\nexport const step = () => { values[2] = 3; };`),
    );
    expect(result.failure?.message).toContain("TLA+ sequences can't have holes");
  });

  it("fails the check where with() would throw a RangeError", async () => {
    const result = await check(
      compile(
        `let values = [1];\nexport const step = () => { values = values.with(values.length, 3); };`,
      ),
    );
    expect(result.failure?.message).toContain("tla-ts can't throw the RangeError of with()");
  });

  it("fails the check where defineProperty takes an array that isn't in the heap", async () => {
    const result = await check(
      compile(
        `const values: object = [0].slice(1);\nObject.defineProperty(values, "0", { value: 1 });\nlet result = 1;`,
      ),
    );
    expect(result.failure?.message).toContain("tla-ts can't use <<>> as an object here");
  });

  it("reads an array past its end from Array.prototype", async () => {
    const result = await check(
      compile(
        `Object.defineProperty(Array.prototype, "1", { get: () => 7, configurable: true });\nconst values: number[] = [5];\nif (values[1] !== 7 || !(1 in values) || values[2] !== undefined) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("fails the check where an array method makes an array through a script's constructor", async () => {
    const result = await check(
      compile(
        `const values = [1];\nObject.defineProperty(values, "constructor", { value: Object });\nconst copied = values.map((value) => value + 1);`,
      ),
    );
    expect(result.failure?.message).toContain(
      "tla-ts can't make an array through a constructor that a script gives",
    );
  });

  it("rejects an array in the heap where it's read as a value", () => {
    expect(() =>
      compile(
        `const values = [1];\nObject.defineProperty(values, "0", { value: 2 });\nconst copy = values;`,
      ),
    ).toThrow(
      "spec.ts:3:14 Use an array that tla-ts holds as an object only through its properties",
    );
  });

  it("rejects division without rounding", () => {
    expect(() =>
      compile(`let count = 8;\nexport const halve = () => { count = count / 2; };`),
    ).toThrow("spec.ts:2:38 Write division as Math.floor(a / b) or Math.trunc(a / b)");
  });

  it("rejects for-in loops over values that aren't objects", () => {
    expect(() =>
      compile(
        `let count = 0;\nexport const step = () => {\n  for (const key in { a: 1 }) count++;\n};`,
      ),
    ).toThrow("spec.ts:3:21 for-in iterates only objects");
  });

  it("rejects typeof on an unknown value beside @symmetric values", () => {
    expect(() =>
      compile(
        `/** @symmetric */\ntype Name = "a" | "b";\nconst getType = (value: unknown) => typeof value;\nlet kind = getType(1);`,
      ),
    ).toThrow("spec.ts:3:37 typeof can't tell a @symmetric value from a function");
  });

  it("rejects Object.is on objects", () => {
    expect(() => compile(`let isSame = Object.is([1], [1]);`)).toThrow(
      "spec.ts:1:14 TLA+ compares objects by value, not by identity",
    );
  });

  it.each([
    ["a malformed regular expression", "const pattern = /[$$]/v;"],
    [
      "a var that redeclares a function in its block",
      "{\n  function step() {}\n  var step = 1;\n}",
    ],
    [
      "a function that redeclares a catch parameter",
      "try {} catch (error) {\n  function error() {}\n}",
    ],
    ["two functions with one name in a block", "{\n  function step() {}\n  function step() {}\n}"],
    ["a class as the body of an if", "if (true) class Step {}"],
    ["a function as the body of a loop", "while (false) function step() {}"],
    [
      "a private name in a pattern",
      "class Box {\n  #size = 1;\n  read() {\n    const { #size: size } = this;\n  }\n}",
    ],
    ["an escape in new.target", "function make() {\n  return new.t\\u0061rget;\n}"],
    ["assigning arguments", "function make() {\n  [arguments] = [[]];\n}"],
    ["an export name with a lone surrogate", 'function step() {}\nexport { step as "\\uD83D" };'],
  ])("rejects %s as a SyntaxError", (_, source) => {
    expect(() => compile(source)).toThrow(/^spec\.ts:\d+:\d+ SyntaxError: /);
  });

  it("accepts a var beside a function in a function body", () => {
    expect(() =>
      compile("function make() {\n  function step() {}\n  var step = 1;\n}"),
    ).not.toThrow(/SyntaxError/);
  });

  it.each([
    [
      "a local that a function returns while a closure keeps it",
      "let saved = () => 0;\nconst make = () => {\n  const items: number[] = [];\n  saved = () => items.push(1);\n  return items;\n};\nlet size = make().length;",
    ],
    [
      "a local that a function returns and then changes in a finally block",
      "const make = () => {\n  const items: number[] = [];\n  try {\n    return items;\n  } finally {\n    items.push(1);\n  }\n};\nlet size = make().length;",
    ],
    [
      "a parameter that a function changes and returns to JSON",
      "const fill = (items: number[]) => {\n  items.push(1);\n  return items;\n};\nconst list: number[] = [];\nlet size = JSON.stringify(fill(list)).length + list.length;",
    ],
    [
      "a local of an outer function that an inner function returns",
      "const make = () => {\n  const items: number[] = [];\n  const get = () => {\n    return items;\n  };\n  const other = get();\n  items.push(1);\n  return other.length;\n};\nlet size = make();",
    ],
  ])("rejects %s, as the caller would share it", (_, source) => {
    expect(() => compile(source)).toThrow("items would share an object that changes in place");
  });

  it.each([
    [
      "an array that a heap object holds, changes through it, and goes to JSON",
      "const run = () => {\n  const items: number[] = [];\n  const wrapped = { inner: items };\n  const text = JSON.stringify(wrapped);\n  wrapped.inner.push(1);\n  return items.length + text.length;\n};\nlet size = run();",
    ],
    [
      "an array that a function puts in a heap object that goes to JSON",
      "const wrap = (inner: number[]) => ({ inner });\nconst run = () => {\n  const items: number[] = [];\n  const wrapped = wrap(items);\n  const text = JSON.stringify(wrapped);\n  wrapped.inner.push(1);\n  return items.length + text.length;\n};\nlet size = run();",
    ],
  ])("rejects %s, as changing it would show through the other name", (_, source) => {
    expect(() => compile(source)).toThrow("items would share an object that changes in place");
  });

  it("shares a heap object's field while another field changes in place", async () => {
    const result = await checkModel(`
      const box = { seen: new Set<number>(), list: [1, 2] };
      const pair = { names: box.list };
      box.seen.add(2);
      if (!box.seen.has(2) || pair.names.join() !== "1,2") throw new Error("fields");
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      compile(
        "const box = { seen: new Set<number>() };\nconst copy = box.seen;\nbox.seen.add(2);\nlet size = copy.size;",
      ),
    ).toThrow("box.seen would share an object that changes in place");
    expect(() =>
      compile(
        "const items = new Set<number>();\nconst box = { kept: items };\nconst wrap = { inner: box.kept };\nwrap.inner.add(3);\nlet size = items.size;",
      ),
    ).toThrow("box.kept would share an object that changes in place");
  });

  it("changes an object that a call makes, and returns a local in an object literal", async () => {
    const result = await checkModel(`
      interface Spot {
        line: number;
        range: number;
      }
      const getSpot = (line: number): Spot => ({ line, range: 0 });
      const readField = (line: number) => {
        const spot = getSpot(line);
        spot.range = line * 2;
        return { name: "field", spot };
      };

      let count = 0;

      export const tick = () => {
        count = count === 1 ? 0 : 1;
      };

      export const isCorrect = () => readField(3).spot.range === 6 && readField(3).spot.line === 3;
    `);
    expect(result.failure).toBeUndefined();
    expect(result.status).toBe("success");
  });

  it("rejects a local that a returned object literal holds while an array keeps it", () => {
    const source = `
      const make = () => {
        const items: number[] = [];
        const kept = [items];
        items.push(1);
        return { items, size: kept[0].length };
      };

      let count = 0;

      export const tick = () => {
        count = make().size;
      };
    `;
    expect(() => compile(source)).toThrow("items would share an object that changes in place");
  });

  it("returns a local that closures the function only calls change", async () => {
    const result = await checkModel(`
      const build = (size: number) => {
        const items: number[] = [];
        const add = (value: number) => {
          items.push(value);
        };
        const fill = () => {
          for (let index = 0; index < size; index++) add(index * 2);
        };
        fill();
        return items;
      };

      let count = 0;

      export const tick = () => {
        count = count === 1 ? 0 : 1;
      };

      export const isCorrect = () => build(3).length === 3 && build(3)[2] === 4;
    `);
    expect(result.failure).toBeUndefined();
    expect(result.status).toBe("success");
  });

  it.each([
    [
      "a local that a closure changes where the function passes the closure on",
      "const make = () => {\n  const items: number[] = [];\n  const add = (value: number) => {\n    items.push(value);\n  };\n  [1].forEach(add);\n  return items;\n};\nlet size = make().length;",
    ],
    [
      "a local that an async closure changes",
      "const make = () => {\n  const items: number[] = [];\n  const add = async () => {\n    items.push(1);\n  };\n  add();\n  return items;\n};\nlet size = make().length;",
    ],
  ])("rejects %s, as the closure may run after the return", (_, source) => {
    expect(() => compile(source)).toThrow("items would share an object that changes in place");
  });

  it("returns a local that a function changes, as the caller holds its only name", async () => {
    const result = await checkModel(`
      const build = (size: number) => {
        const items: number[] = [];
        for (let index = 0; index < size; index++) items.push(index * 2);
        return items;
      };

      let count = 0;

      export const tick = () => {
        count = count === 1 ? 0 : 1;
      };

      export const isCorrect = () => build(3).length === 3 && build(3)[2] === 4;
    `);
    expect(result.failure).toBeUndefined();
    expect(result.status).toBe("success");
  });

  it.each([
    [
      "an array that a heap object shares and that then changes",
      "const box = { list: [1] };\nlet list = box.list;\nlist.push(2);\nlet size = box.list.length;",
      "would share an object that changes in place",
    ],
    [
      "a callback that changes state and types its array as an object",
      "let calls = 0;\nconst list = [1, 2];\nconst isTwo = (value: number, index: number, array: { length: number }) => {\n  calls++;\n  return array.length === 2;\n};\nlet isAll = list.every(isTwo);",
      "Type a callback's array parameter as an array",
    ],
    [
      "this in a function inside a method",
      "const box = {\n  read() {\n    const inner = function (this: unknown) {\n      return this;\n    };\n    return inner();\n  },\n};\nlet value = box.read();",
      "Unsupported expression: this",
    ],
  ])("rejects %s in a script", (_, source, message) => {
    expect(() => compile(source)).toThrow(message);
  });

  it("runs the function that a call's callee holds, by its value", async () => {
    const result = await checkModel(`
      let count = 0;
      const counter = {
        step: 2,
        increment() {
          count += this.step;
        },
      };
      const add = (amount: number) => {
        count += amount;
      };
      const double = (amount: number) => {
        count += 2 * amount;
      };
      let operation: (amount: number) => void = add;
      operation(3);
      operation = double;
      operation(1);
      const other = { step: 5, increment: counter.increment };
      other.increment();
      const get = { read() { return 1; } }.read;
      const read = get();
      for (let index = 0; index < 2; index++) operation(1);
      if (count !== 14 || read !== 1) throw new Error("count");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("makes the generator or runs the async function that a callee holds", async () => {
    const result = await checkModel(`
      let callCount = 0;
      const obj = {
        *generate(first: number) {
          if (first !== 42) throw new Error("generate");
          callCount = callCount + 1;
        },
        async run(first: number) {
          if (first !== 7) throw new Error("run");
          callCount = callCount + 10;
        },
      };
      const generate = obj.generate;
      generate(42).next();
      const run = obj.run;
      await run(7);
      if (callCount !== 11) throw new Error("count");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads the length and the name of the function that a value holds", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      function two(first: number, second: number) {
        holder.count = first * second;
      }
      const restOne = (first: number, ...rest: number[]) => {
        holder.count = first + rest.length;
      };
      let ref: (first: number, second: number) => void;
      ref = (first: number, second = 39) => {
        holder.count = first + second;
      };
      if (ref.length !== 1) throw new Error("default");
      ref = two;
      if (ref.length !== 2) throw new Error("plain");
      const chosen = holder.count > 5 ? two : restOne;
      if (chosen.length !== 1) throw new Error("rest");
      if (chosen.name !== "restOne" || ref.name !== "two") throw new Error("name");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads a Date's fields from its time value", async () => {
    const result = await checkModel(`
      const same = (actual: unknown, expected: unknown) => {
        if (!Object.is(actual, expected)) throw new Error("same");
      };
      const date = new Date(2016, 6, 5, 13, 4, 5, 6);
      same(date.getFullYear(), 2016);
      same(date.getMonth(), 6);
      same(date.getDate(), 5);
      same(date.getDay(), 2);
      same(date.getUTCHours(), 13);
      same(date.getMinutes(), 4);
      same(date.getSeconds(), 5);
      same(date.getMilliseconds(), 6);
      same(new Date(1900, 1, 29).getMonth(), 2);
      same(new Date(99, 0).getFullYear(), 1999);
      same(new Date(-1).getUTCFullYear(), 1969);
      same(new Date(NaN).getDate(), NaN);
      same(new Date(275760, 8, 13, 0, 0, 0, 1).getTime(), NaN);
      same(new Date(new Date(7)).getTime(), 7);
      same(Object.prototype.toString.call(new Date(0)), "[object Date]");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("sets a Date's fields and gives its new time value", async () => {
    const result = await checkModel(`
      const same = (actual: unknown, expected: unknown) => {
        if (!Object.is(actual, expected)) throw new Error("same");
      };
      const date = new Date(1970, 0, 5);
      const hours = date.setHours(-1);
      same(hours, 3 * 86400000 + 23 * 3600000);
      same(date.getDate(), 4);
      date.setMinutes(61, 2, 3);
      same(date.getTime(), 4 * 86400000 + 62003);
      date.setMonth(0, 20);
      same(date.getDate(), 20);
      const invalid = new Date(NaN);
      const nothing = invalid.setHours(1);
      same(nothing, NaN);
      invalid.setFullYear(1970);
      same(invalid.getTime(), 0);
      invalid.setTime(12);
      same(invalid.getUTCMilliseconds(), 12);
      const far = new Date(0);
      far.setFullYear(2016, 6, 5);
      same(far.getDay(), 2);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a Date method's TypeError on another receiver and toISOString's RangeError", async () => {
    const getSource = (receiver: string) => `
      const throws = (run: () => void, isType: boolean) => {
        let caught = false;
        try {
          run();
        } catch (error) {
          caught = isType ? error instanceof TypeError : error instanceof RangeError;
        }
        if (!caught) throw new Error("throws");
      };
      const getUTCSeconds = Date.prototype.getUTCSeconds;
      const valid = new Date(-1);
      const invalid = new Date(NaN);
      throws(function () {
        getUTCSeconds.call(${receiver});
      }, true);
      throws(function () {
        invalid.toISOString();
      }, false);
      const text = valid.toISOString();
      if (text !== "1969-12-31T23:59:59.999Z") throw new Error("text");
    `;
    expect((await checkModel(getSource("{}"))).failure).toBeUndefined();
    expect((await checkModel(getSource("0"))).failure).toBeUndefined();
    expect((await checkModel(getSource("valid"))).failure?.message).toContain("throws");
  });

  it("makes a Date that reads the clock but stops where something reads its time", async () => {
    const result = await checkModel(`
      const now = new Date(Date.now());
      if (typeof now !== "object" || !(now instanceof Date)) throw new Error("date");
      const later = new Date();
      const year = later.getFullYear();
      if (year < 0) throw new Error("year");
    `);
    expect(result.failure?.message).toContain("tla-ts can't read the clock");
  });

  it("gives Date.UTC's time value where it fits TLC's integers", async () => {
    const result = await checkModel(`
      const same = (actual: unknown, expected: unknown) => {
        if (!Object.is(actual, expected)) throw new Error("same");
      };
      same(Date.UTC(1970, 0, 25, 20, 31, 23, 647), 2147483647);
      same(Date.UTC(70, 12, -364), 0);
      same(Date.UTC(1970, Infinity), NaN);
      const late = Date.UTC(2016, 6);
      same(late > 0, true);
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't hold a time value this far from 1970 in a number",
    );
  });

  it("tells whether a value inherits from a built-in constructor's prototype", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const orphan = Object.create(null) as object;
      const list = [1, 2];
      const add = (value: number) => value;
      if (!(holder instanceof Object) || holder instanceof Array) throw new Error("object");
      if (!(list instanceof Array) || !(list instanceof Object)) throw new Error("array");
      if (!(add instanceof Function) || orphan instanceof Object) throw new Error("other");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("keeps an array literal's holes, which methods skip or read through the prototype", async () => {
    const result = await checkModel(`
      const holey = [1, 2, , 4];
      if (holey.length !== 4 || 2 in holey || holey[2] !== undefined) throw new Error("hole");
      if (holey.at(2) !== undefined || holey.indexOf(undefined) !== -1) throw new Error("read");
      let visited = 0;
      holey.forEach(() => {
        visited += 1;
      });
      if (visited !== 3 || holey.filter(() => true).length !== 3) throw new Error("skip");
      if (holey.findIndex((value) => value === undefined) !== 2) throw new Error("find");
      Array.prototype[2] = 9;
      if (holey.at(2) !== 9 || holey.indexOf(9) !== 2) throw new Error("inherited");
    `);
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(`
      const holey = [1, , 3];
      let visited = 0;
      holey.forEach(() => {
        visited += 1;
      });
      if (visited !== 3) throw new Error("visited");
    `);
    expect(wrong.failure?.message).toContain("visited");
  });

  it("passes an array that the heap holds to a callback that never reads its array parameter", async () => {
    const result = await checkModel(`
      let seen = 0;
      function callback(value: unknown, position: number, array: unknown[]) {
        seen += 1;
        return position !== 1;
      }
      const holey = [0, , 2];
      if (!holey.every(callback) || seen !== 2) throw new Error("every");
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      compile(
        "let seen = 0;\nfunction callback(value: unknown, position: number, array: unknown[]) {\n  seen += array.length;\n  return true;\n}\nconst holey = [0, , 2];\nholey.every(callback);",
      ),
    ).toThrow("Type a callback's array parameter as an array");
  });

  it("searches an array-like object whose length and elements getters answer", async () => {
    const getSource = (expected: number) => `
      const arr: number[] = [20];
      const like: Record<string, unknown> = {};
      const holed: Record<string, unknown> = { 2: 2, length: 20 };
      Object.defineProperty(arr, "0", {
        get: function () {
          arr[1] = 1;
          return 0;
        },
        configurable: true,
      });
      if (arr.indexOf(1) !== -1) throw new Error("indexOf");
      if (arr.lastIndexOf(0) !== 0) throw new Error("lastIndexOf");
      if (arr.includes(1) !== true) throw new Error("includes");
      Object.defineProperty(like, "length", {
        get: function () {
          like[2] = "length";
          return 3;
        },
        configurable: true,
      });
      if (Array.prototype.indexOf.call(like, "length") !== 2) throw new Error("length");
      if (Array.prototype.lastIndexOf.call(like, "length", -2) !== -1) throw new Error("from");
      let isSeen = false;
      Array.prototype.forEach.call(like, (value: unknown, position: number) => {
        if (position === 2 && value === "length") isSeen = true;
      });
      if (!isSeen) throw new Error("forEach");
      Object.defineProperty(holed, "0", {
        get: function () {
          delete (Object.prototype as Record<string, unknown>)[1];
          return 0;
        },
        configurable: true,
      });
      (Object.prototype as Record<string, unknown>)[1] = 1;
      if (Array.prototype.indexOf.call(holed, 1) !== -1) throw new Error("hole");
      if (Array.prototype.indexOf.call(holed, 2, -18) !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(-1))).failure?.message).toContain("unexpected");
  });

  it("runs the getter of the constructor that map makes its array through", async () => {
    const getSource = (expected: number) => `
      const a: number[] = [];
      let callCount = 0;
      const callback = () => {
        callCount += 1;
      };
      Object.defineProperty(a, "constructor", {
        get: function () {
          throw new RangeError("constructor");
        },
      });
      let isThrown = false;
      try {
        a.map(callback);
      } catch (error) {
        isThrown = error instanceof RangeError;
      }
      if (!isThrown) throw new Error("thrown");
      if (callCount !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(0))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
  });

  it("reads an object's values and entries in turn, running getters that change its keys", async () => {
    const getSource = (expected: number) => `
      const bAddsC: Record<string, string> = {
        a: "A",
        get b() {
          this.c = "C";
          return "B";
        },
      };
      const values = Object.values(bAddsC);
      if (values.length !== 2) throw new Error("length");
      if (values[0] !== "A" || values[1] !== "B") throw new Error("values");
      const bHidesC: Record<string, string> = {
        a: "A",
        get b() {
          Object.defineProperty(this, "c", { enumerable: false });
          return "B";
        },
        c: "C",
      };
      const entries = Object.entries(bHidesC);
      if (entries[1][0] !== "b" || entries[1][1] !== "B") throw new Error("entry");
      if (entries.length !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
  });

  it("runs a source's getters in key order as Object.assign copies them", async () => {
    const getSource = (expected: string) => `
      let log = "";
      const first = Symbol("x");
      const source = {};
      Object.defineProperty(source, first, {
        get: function () {
          log += "x,";
        },
        enumerable: true,
      });
      Object.defineProperty(source, "a", {
        get: function () {
          log += "a,";
        },
        enumerable: true,
      });
      Object.assign({}, source);
      const thrower = {
        get attr() {
          throw new RangeError("attr");
        },
      };
      let isThrown = false;
      try {
        Object.assign({}, thrower);
      } catch (error) {
        isThrown = error instanceof RangeError;
      }
      if (!isThrown) throw new Error("thrown");
      if (log !== "${expected}") throw new Error("unexpected");
    `;
    expect((await checkModel(getSource("a,x,"))).failure).toBeUndefined();
    expect((await checkModel(getSource("x,a,"))).failure?.message).toContain("unexpected");
  });

  it("runs getters as toReversed and with copy an array, skipping the index with replaces", async () => {
    const reversed = await checkModel(`
      const arr: number[] = [0, 1, 2, 3, 4];
      (Array.prototype as unknown as Record<string, number>)[1] = 5;
      Object.defineProperty(arr, "3", {
        get: function () {
          arr.length = 1;
          return 3;
        },
      });
      const reversed = arr.toReversed();
      if (reversed.join(",") !== "4,3,,5,0") throw new Error("reversed");
    `);
    expect(reversed.failure).toBeUndefined();
    const getSource = (replaced: number) => `
      const arr: number[] = [0, 1, 2];
      let reads = 0;
      const getReads = (): number => reads;
      Object.defineProperty(arr, "0", {
        get: function () {
          reads += 1;
          return 0;
        },
      });
      let isRange = false;
      try {
        const unused = arr.with(${replaced}, 0);
      } catch (error) {
        isRange = error instanceof RangeError;
      }
      if (!isRange || reads !== 0) throw new Error("unexpected");
      const back = arr.with(-1, 9);
      if (back.join(",") !== "0,1,9" || getReads() !== 1) throw new Error("negative");
    `;
    expect((await checkModel(getSource(3))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("unexpected");
  });

  it("runs a getter that a descriptor writes as a method", async () => {
    const getSource = (expected: string) => `
      const source = {};
      let log = "";
      const getLog = (): string => log;
      Object.defineProperty(source, "a", {
        get() {
          log += "a";
          return 1;
        },
        enumerable: true,
      });
      const values = Object.values(source);
      if (values[0] !== 1 || log !== "a") throw new Error("values");
      const direct = (source as { a: number }).a;
      if (direct !== 1 || getLog() !== "${expected}") throw new Error("unexpected");
    `;
    expect((await checkModel(getSource("aa"))).failure).toBeUndefined();
    expect((await checkModel(getSource("a"))).failure?.message).toContain("unexpected");
  });

  it("runs the setters that Object.assign writes through, and a setter's extra parameters", async () => {
    const getSource = (expected: number) => `
      const target = {};
      let seen: unknown = 0;
      let firstArg: unknown = 12;
      let secondArg: unknown = 12;
      Object.defineProperty(target, "attr", {
        set: function (value: unknown) {
          seen = value;
        },
      });
      Object.assign(target, { attr: 1 });
      if (seen !== ${expected}) throw new Error("unexpected");
      const thrower = {};
      Object.defineProperty(thrower, "attr", {
        set: function (_: unknown) {
          throw new RangeError("set");
        },
      });
      let isThrown = false;
      try {
        Object.assign(thrower, { attr: 1 });
      } catch (error) {
        isThrown = error instanceof RangeError;
      }
      if (!isThrown) throw new Error("thrown");
      const obj: Record<string, number> = {};
      const setFunc = function (a: unknown, b?: unknown) {
        firstArg = a;
        secondArg = b;
      };
      Object.defineProperty(obj, "prop", { set: setFunc });
      obj.prop = 100;
      if (firstArg !== 100 || secondArg !== undefined) throw new Error("parameters");
    `;
    expect((await checkModel(getSource(1))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("unexpected");
  });

  it("runs a getter whose type has an index signature where a computed key picks it", async () => {
    const getSource = (expected: string) => `
      const readKey = (obj: object, name: string) => (obj as { [key: string]: unknown })[name];
      const holder = {};
      (holder as { [key: string]: unknown }).data = "x";
      Object.defineProperty(holder, "property", {
        get: function () {
          return (holder as { [key: string]: unknown }).data;
        },
      });
      if (readKey(holder, "property") !== "${expected}") throw new Error("unexpected");
    `;
    expect((await checkModel(getSource("x"))).failure).toBeUndefined();
    expect((await checkModel(getSource("y"))).failure?.message).toContain("unexpected");
  });

  it("runs the getters that Object.defineProperties defines where a statement reads them", async () => {
    const getSource = (expected: number) => `
      let accessed = 0;
      const holder: Record<string, unknown> = {};
      Object.defineProperties(holder, {
        "0": {
          get: function () {
            accessed++;
            return 12;
          },
        },
        other: {
          get: function () {
            accessed += 10;
            return 1;
          },
        },
      });
      const check = (value: unknown, expected: unknown) => {
        if (value !== expected) throw new Error("value");
      };
      check(holder[0], 12);
      check(holder.other, 1);
      const getAccessed = (): number => accessed;
      if (getAccessed() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(11))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
  });

  it("runs a setter that a descriptor's getter returns by name", async () => {
    const getSource = (expected: string) => `
      let data = "data";
      const setFun = function (value: string) {
        data = value;
      };
      const descriptor = {};
      Object.defineProperty(descriptor, "set", {
        get: function () {
          return setFun;
        },
      });
      const obj: Record<string, unknown> = {};
      Object.defineProperties(obj, { prop: descriptor });
      obj.prop = "written";
      const getData = (): string => data;
      if (getData() !== "${expected}") throw new Error("unexpected");
    `;
    expect((await checkModel(getSource("written"))).failure).toBeUndefined();
    expect((await checkModel(getSource("data"))).failure?.message).toContain("unexpected");
  });

  it("runs the setters of the properties that a pattern or a for-of head writes", async () => {
    const getSource = (expected: string) => `
      let log = "";
      const x = {
        set y(value: unknown) {
          log += "y" + String(value);
        },
        set z(value: unknown) {
          log += "z" + String(value);
        },
      };
      const plain: { w?: number } = {};
      const thrower = {
        set y(_: unknown) {
          throw new RangeError("set");
        },
      };
      [x.y, { a: x.z = 7 }, plain.w] = [1, {}, 3] as [number, { a?: number }, number];
      for (x.y of [2]) log += "-";
      let counter = 0;
      let isThrown = false;
      try {
        for ({ a: thrower.y } of [{ a: 23 }]) counter += 1;
        counter += 1;
      } catch (error) {
        isThrown = error instanceof RangeError;
      }
      const getLog = (): string => log;
      if (getLog() !== "${expected}" || plain.w !== 3 || counter !== 0 || !isThrown) {
        throw new Error("unexpected");
      }
    `;
    expect((await checkModel(getSource("y1z7y2-"))).failure).toBeUndefined();
    expect((await checkModel(getSource("z7y1y2-"))).failure?.message).toContain("unexpected");
  });

  it("throws a TypeError where a write finds %ThrowTypeError% as the setter", async () => {
    const getSource = (expected: number) => `
      function foo() {}
      const obj = foo.bind({}) as unknown as { arguments: unknown; caller: unknown };
      let thrown = 0;
      try {
        obj.arguments = 12;
      } catch (error) {
        if (error instanceof TypeError) thrown++;
      }
      try {
        obj.caller = 12;
      } catch (error) {
        if (error instanceof TypeError) thrown++;
      }
      const getThrown = (): number => thrown;
      if (getThrown() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
  });

  it("assigns a rest element to an object pattern, or to a property through its setter", async () => {
    const getSource = (expected: number) => `
      let x: unknown;
      let length: unknown;
      let other: unknown;
      let seen: unknown;
      const vals = [1, 2, 3];
      const target = {
        set y(value: unknown) {
          seen = value;
        },
      };
      const holder: { list?: number[] } = {};
      [...{ 1: x }] = vals;
      for ([, ...{ 0: other, length }] of [[null, 5]]) target.y = 0;
      [...target.y] = [1, 2];
      [, ...holder.list] = [1, 2, 3];
      const getX = (): unknown => x;
      const getOther = (): unknown => other;
      const getLength = (): unknown => length;
      const getSeen = (): unknown => seen;
      const seenList = getSeen() as number[];
      if (
        getX() !== ${expected} ||
        getOther() !== 5 ||
        getLength() !== 1 ||
        seenList.length !== 2 ||
        holder.list === undefined ||
        holder.list[0] !== 2
      ) {
        throw new Error("unexpected");
      }
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
  });

  it("throws the TypeError of a buffer's or a view's getter that a statement reads on a prototype", async () => {
    const getSource = (expected: number) => `
      let thrown = 0;
      const attempt = (read: () => void) => {
        try {
          read();
        } catch (error) {
          if (error instanceof TypeError) thrown++;
        }
      };
      attempt(() => {
        ArrayBuffer.prototype.byteLength;
      });
      attempt(() => {
        DataView.prototype.byteOffset;
      });
      attempt(() => {
        Int8Array.prototype.buffer;
      });
      const buffer = new ArrayBuffer(4);
      attempt(() => {
        buffer.byteLength;
      });
      const getThrown = (): number => thrown;
      if (getThrown() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(3))).failure).toBeUndefined();
    expect((await checkModel(getSource(4))).failure?.message).toContain("unexpected");
  });

  it("calls a buffer's or a view's getter that a script takes from its descriptor", async () => {
    const getSource = (expected: number) => `
      let thrown = 0;
      const attempt = (run: () => void) => {
        try {
          run();
        } catch (error) {
          if (error instanceof TypeError) thrown++;
        }
      };
      const offset = Object.getOwnPropertyDescriptor(DataView.prototype, "byteOffset")!.get;
      const length = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength")!.get;
      const growable = Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "growable")!.get;
      const buffer = new ArrayBuffer(8);
      const shared = new SharedArrayBuffer(4);
      const view = new DataView(buffer, 2);
      attempt(() => {
        offset!();
      });
      attempt(() => {
        offset!.call({});
      });
      attempt(() => {
        offset!.call(buffer);
      });
      attempt(() => {
        length!.call(shared);
      });
      attempt(() => {
        growable!.call(buffer);
      });
      const offsetValue = offset!.call(view);
      const lengthValue = length!.call(buffer);
      const getThrown = (): number => thrown;
      if (getThrown() !== 5 || offsetValue !== ${expected} || lengthValue !== 8) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
  });

  it("gives the receiver of the @@species getter that a script takes from its descriptor", async () => {
    const getSource = (expected: number) => `
      const holder = {};
      const descriptor = Object.getOwnPropertyDescriptor(Promise, Symbol.species);
      const accessor = Object.getOwnPropertyDescriptor(ArrayBuffer, Symbol.species)!.get;
      const check = (actual: unknown, wanted: unknown) => {
        if (actual !== wanted) throw new Error("unexpected");
      };
      const make = () => 1;
      check(accessor!.call(holder), holder);
      check(descriptor!.get!.call(holder), holder);
      check(accessor!.call(make), make);
      check(accessor!.call(undefined), undefined);
      check(accessor!.call(1), ${expected});
    `;
    expect((await checkModel(getSource(1))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("unexpected");
  });

  it("calls the size getter that a script takes from a Map's or a Set's descriptor", async () => {
    const getSource = (expected: number) => `
      let thrown = 0;
      const attempt = (run: () => void) => {
        try {
          run();
        } catch (error) {
          if (error instanceof TypeError) thrown++;
        }
      };
      const descriptor = Object.getOwnPropertyDescriptor(Map.prototype, "size");
      const setSize = Object.getOwnPropertyDescriptor(Set.prototype, "size")!.get;
      const map = new Map<number, number>([
        [1, 2],
        [3, 4],
      ]);
      const set = new Set([5]);
      const mapSize = descriptor!.get!.call(map);
      const setCount = setSize!.call(set);
      attempt(() => {
        descriptor!.get!.call([]);
      });
      attempt(() => {
        descriptor!.get!.call(new WeakMap());
      });
      attempt(() => {
        descriptor!.get!.call(set);
      });
      attempt(() => {
        descriptor!.get!.call(1);
      });
      attempt(() => {
        descriptor!.get!.call({});
      });
      attempt(() => {
        setSize!.call(map);
      });
      attempt(() => {
        setSize!();
      });
      const getThrown = (): number => thrown;
      if (getThrown() !== 7 || mapSize !== ${expected} || setCount !== 1) {
        throw new Error("unexpected");
      }
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
  });

  it("runs the accessors that a script defines on Function.prototype for a bound function", async () => {
    const getSource = (expected: number) => `
      const target = function (this: unknown, value: number) {
        return value;
      };
      let data = 1;
      Object.defineProperty(Function.prototype, "prop", {
        get: function () {
          return data;
        },
        set: function (value: number) {
          data = value;
        },
        configurable: true,
      });
      const bound = target.bind({}) as unknown as { prop: number };
      bound.prop = 9;
      const read = bound.prop;
      const isOwn = Object.prototype.hasOwnProperty.call(bound, "prop");
      if (isOwn || read !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(9))).failure).toBeUndefined();
    expect((await checkModel(getSource(8))).failure?.message).toContain("unexpected");
  });

  it("runs the getter that a rest pattern copies where the script defines getters under other keys", async () => {
    const getSource = (expected: number) => `
      let count = 0;
      let seen: unknown = 0;
      class C {
        #method({ ...x }: { v: number }) {
          seen = x.v;
        }
        get method() {
          return this.#method;
        }
      }
      new C().method({
        get v() {
          count++;
          return 2;
        },
      });
      const getSeen = (): unknown => seen;
      const getCount = (): number => count;
      if (getSeen() !== 2 || getCount() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(1))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("unexpected");
  });

  it("reads a hole that a for-of's iterator reads from Array.prototype", async () => {
    const getSource = (expected: string) => `
      let count = 0;
      let last: unknown = 0;
      for (const item of [, 1]) {
        if (item === undefined) count++;
      }
      for (const [x = 23] of [[,]]) last = x;
      const getLast = (): unknown => last;
      if (getLast() !== 23) throw new Error("default");
      Object.defineProperty(Array.prototype, "0", { value: "proto", configurable: true });
      for (const [x = "default"] of [[,]]) last = x;
      if (count !== 1 || getLast() !== "${expected}") throw new Error("unexpected");
    `;
    expect((await checkModel(getSource("proto"))).failure).toBeUndefined();
    expect((await checkModel(getSource("default"))).failure?.message).toContain("unexpected");
  });

  it("stops where a for-of reads a hole from Array.prototype after the loop changes it", async () => {
    // Node reads "late" at each hole, as the first iteration writes Array.prototype[1].
    const getSource = (iterated: string, pattern: string) => `
      let count = 0;
      for (const ${pattern} of ${iterated}) {
        count++;
        Array.prototype[1] = "late";
      }
    `;
    expect((await checkModel(getSource("[0, , 2]", "value"))).failure?.message).toContain(
      "tla-ts can't read a hole from Array.prototype after a script changes it",
    );
    expect(
      (await checkModel(getSource("[[1, 2], [3, ,]]", "[first, second]"))).failure?.message,
    ).toContain("tla-ts can't read a hole from Array.prototype after a script changes it");
    expect(() =>
      compile(`
        const change = () => {
          Array.prototype[1] = "late";
          return 0;
        };
        for (const [first = change(), second] of [[, ,]]) {
        }
      `),
    ).toThrow("tla-ts can't read the holes of an element after a pattern runs code");
  });

  it("reads a hole that a for-of reaches after the loop makes objects", async () => {
    const getSource = (expected: string) => `
      let seen: unknown = 0;
      let count = 0;
      const boxes: unknown[] = [];
      for (const value of [0, , 2]) {
        if (count === 1) seen = value;
        count++;
        boxes.push({ count });
      }
      const getSeen = (): unknown => seen;
      if (getSeen() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource("undefined"))).failure).toBeUndefined();
    expect((await checkModel(getSource("0"))).failure?.message).toContain("unexpected");
  });

  it("reads a hole that a pattern takes from Array.prototype", async () => {
    const getSource = (expected: string) => `
      const [plain = 1] = [,];
      Array.prototype[0] = "proto";
      const [x = 23] = [,];
      let assigned: unknown = 0;
      [assigned = 3] = [,];
      const take = ([taken = 7]: unknown[]) => taken;
      const fromCall = take([,]);
      const getAll = (): unknown[] => [plain, x, assigned, fromCall];
      const all = getAll();
      if (all[0] !== 1 || all[1] !== ${expected} || all[2] !== "proto" || all[3] !== "proto") {
        throw new Error("unexpected");
      }
    `;
    expect((await checkModel(getSource('"proto"'))).failure).toBeUndefined();
    expect((await checkModel(getSource("23"))).failure?.message).toContain("unexpected");
    expect(() =>
      compile(`
        const change = () => {
          Array.prototype[1] = "late";
          return 0;
        };
        const [first = change(), second] = [, ,];
      `),
    ).toThrow("tla-ts can't read the holes of an array that a pattern takes after code runs");
  });

  it("sorts an array whose elements run getters and setters, index by index", async () => {
    const getSource = (expected: string) => `
      const array = [undefined, "c", , "b", undefined, , "a", "d"];
      Object.defineProperty(array, "2", {
        get(this: Record<string, unknown>) {
          array[3] = "foobar";
          return this.foo;
        },
        set(this: Record<string, unknown>, value: unknown) {
          this.foo = value;
        },
      });
      array.sort();
      const check = (actual: unknown, wanted: unknown) => {
        if (actual !== wanted) throw new Error("unexpected");
      };
      check(array[0], "a");
      check(array[1], "c");
      check(array[2], ${expected});
      check(array[3], "foobar");
      check(array[4], undefined);
      check("7" in array, false);
      check(array.length, 8);
    `;
    expect((await checkModel(getSource('"d"'))).failure).toBeUndefined();
    expect((await checkModel(getSource('"c"'))).failure?.message).toContain("unexpected");
  });

  it("sorts an array that inherits an element from Object.prototype", async () => {
    const getSource = (expected: number) => `
      (Object.prototype as unknown as Record<number, number>)[2] = 4;
      const array = [undefined, 3, , 2, undefined, , 1];
      array.sort();
      const check = (actual: unknown, wanted: unknown) => {
        if (actual !== wanted) throw new Error("unexpected");
      };
      check(array[0], 1);
      check(array[2], 3);
      check(array[3], ${expected});
      check(array.hasOwnProperty("6"), false);
      check(array.length, 7);
    `;
    expect((await checkModel(getSource(4))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("unexpected");
  });

  it("runs the setter of an object literal or a class that a computed key picks", async () => {
    const getSource = (written: string) => `
      let log = "";
      class Box {
        set width(value: number) {
          log += "w" + value;
        }
        set height(value: number) {
          log += "h" + value;
        }
      }
      const tokens: Record<string, unknown> = {
        set break(_: unknown) {
          log += "b";
        },
        set case(_: unknown) {
          log += "${written}";
        },
      };
      const box = new Box() as unknown as Record<string, unknown>;
      const plain: Record<string, unknown> = {};
      const pick = (isWide: boolean): "width" | "height" => (isWide ? "width" : "height");
      box[pick(true)] = 1;
      box[pick(false)] = 2;
      plain[pick(true)] = 3;
      const names = ["break", "case"];
      for (let index = 0; index < names.length; index++) tokens[names[index]] = 0;
      const getLog = (): string => log;
      if (getLog() !== "w1h2bc" || plain.width !== 3) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource("c"))).failure).toBeUndefined();
    expect((await checkModel(getSource("b"))).failure?.message).toContain("unexpected");
  });

  it("sets a prototype through the __proto__ setter, which throws where the object refuses", async () => {
    const getSource = (isCycle: string) => `
      type Proto = { __proto__?: unknown };
      const proto = {};
      const subject: Proto = {};
      subject.__proto__ = proto;
      if (Object.getPrototypeOf(subject) !== proto) throw new Error("set");
      subject.__proto__ = 3;
      if (Object.getPrototypeOf(subject) !== proto) throw new Error("primitive");
      const root: Proto = {};
      const middle: Proto = Object.create(root);
      const leaf: Proto = Object.create(middle);
      let isCycle = false;
      try {
        root.__proto__ = leaf;
      } catch (error) {
        isCycle = error instanceof TypeError;
      }
      if (${isCycle} || Object.getPrototypeOf(root) !== Object.prototype) throw new Error("unexpected");
      const fixed: Proto = Object.create(proto);
      Object.preventExtensions(fixed);
      fixed.__proto__ = proto;
      let isFixed = false;
      try {
        fixed.__proto__ = {};
      } catch (error) {
        isFixed = error instanceof TypeError;
      }
      if (!isFixed) throw new Error("fixed");
    `;
    expect((await checkModel(getSource("!isCycle"))).failure).toBeUndefined();
    expect((await checkModel(getSource("isCycle"))).failure?.message).toContain("unexpected");
    const immutable = await checkModel(`
      (Object.prototype as { __proto__?: unknown }).__proto__ = null;
      let isImmutable = false;
      try {
        (Object.prototype as { __proto__?: unknown }).__proto__ = {};
      } catch (error) {
        isImmutable = error instanceof TypeError;
      }
      if (!isImmutable) throw new Error("immutable");
      if (Object.getPrototypeOf(Object.prototype) !== null) throw new Error("null");
    `);
    expect(immutable.failure).toBeUndefined();
  });

  it("reads each element of an array-like object as its method visits it, running getters", async () => {
    const result = await checkModel(`
      let isFirstRead = false;
      const object = { length: 2 };
      let second: unknown;
      Object.defineProperty(object, "0", {
        get: function () {
          isFirstRead = true;
          return 11;
        },
        configurable: true,
      });
      Object.defineProperty(object, "1", {
        get: function () {
          return isFirstRead ? 9 : 13;
        },
        configurable: true,
      });
      Array.prototype.forEach.call(object, (value: unknown, position: number) => {
        if (position === 1) second = value;
      });
      if (second !== 9) throw new Error("lazy");
      const holey = [0, , 2];
      Object.defineProperty(holey, "0", {
        get: function () {
          delete Array.prototype[1];
          return 0;
        },
        configurable: true,
      });
      Array.prototype[1] = 1;
      let visited = 0;
      holey.forEach(() => {
        visited += 1;
      });
      if (visited !== 2) throw new Error("deleted");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("describes Array.prototype as the built-in object it is", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      const described = Object.getOwnPropertyDescriptor(Array.prototype, "constructor");
      if (described === undefined || described.value !== Array || described.enumerable !== false) {
        throw new Error("constructor");
      }
      holder.seen = 1;
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs the getters of a descriptor's fields in the order defineProperty reads them", async () => {
    const result = await checkModel(`
      const log = { text: "" };
      const target: { [key: string]: unknown } = {};
      const attributes: { [key: string]: unknown } = {};
      Object.defineProperty(attributes, "enumerable", {
        get: function () {
          log.text += "e";
          return true;
        },
      });
      Object.defineProperty(attributes, "value", {
        get: function () {
          log.text += "v";
          return 1;
        },
      });
      Object.defineProperty(target, "property", attributes);
      const read = log.text;
      if (read !== "ev" || target.property !== 1) throw new Error(read);
      const invalid: { [key: string]: unknown } = {};
      Object.defineProperty(invalid, "get", {
        get: function () {
          log.text += "g";
          return 5;
        },
      });
      Object.defineProperty(invalid, "set", {
        get: function () {
          log.text += "s";
          return undefined;
        },
      });
      let caught = false;
      try {
        Object.defineProperty(target, "other", invalid);
      } catch (error) {
        caught = error instanceof TypeError;
      }
      if (!caught || log.text !== "evg") throw new Error(log.text);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a getter that changes something where a statement reads its property", async () => {
    const result = await checkModel(`
      let count = 0;
      const counted: { [key: string]: unknown } = { base: 5 };
      Object.defineProperty(counted, "next", {
        get: function () {
          count += 1;
          return count;
        },
      });
      Object.defineProperty(counted, "boom", {
        get: function () {
          throw new RangeError("boom");
        },
      });
      const first = counted.next;
      const second = counted.next;
      if (first !== 1 || second !== 2) throw new Error("count");
      let caught = false;
      try {
        const value = counted.boom;
      } catch (error) {
        caught = error instanceof RangeError;
      }
      if (!caught) throw new Error("boom");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a setter that a definition's value or a getter gives", async () => {
    const result = await checkModel(`
      const target: { [key: string]: unknown } = {};
      let inherited = "data";
      let own = "data";
      const proto: { [key: string]: unknown } = {};
      Object.defineProperty(proto, "set", {
        get: function () {
          return function (value: string) {
            inherited = value;
          };
        },
      });
      const child: { [key: string]: unknown } = Object.create(proto);
      Object.defineProperty(child, "set", {
        value: function (value: string) {
          own = value;
        },
      });
      Object.defineProperty(target, "property", child);
      target.property = "written";
      if (inherited !== "data" || own !== "written") throw new Error(inherited + own);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads the descriptors that defineProperties and create take through their getters", async () => {
    const result = await checkModel(`
      const log = { text: "" };
      const props: { [key: string]: PropertyDescriptor } = {};
      Object.defineProperty(props, "a", {
        get: function () {
          log.text += "a";
          return { value: 1 };
        },
        enumerable: true,
      });
      Object.defineProperty(props, "hidden", {
        get: function () {
          log.text += "h";
          return { value: 2 };
        },
      });
      const target: { [key: string]: unknown } = {};
      Object.defineProperties(target, props);
      if (log.text !== "a" || target.a !== 1 || "hidden" in target) throw new Error(log.text);
      const described: { [key: string]: unknown } = {};
      Object.defineProperty(described, "get", {
        get: function () {
          return function () {
            return "got";
          };
        },
      });
      const made: { [key: string | symbol]: unknown } = Object.create({}, { prop: described });
      const value = made.prop;
      if (value !== "got") throw new Error("create");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("sets an object's prototype, and throws a TypeError where the chain would loop", async () => {
    const result = await checkModel(`
      const parent: { [key: string]: unknown } = { inherited: 1 };
      const child: { [key: string]: unknown } = {};
      Object.setPrototypeOf(child, parent);
      if (child.inherited !== 1 || Object.getPrototypeOf(child) !== parent) {
        throw new Error("set");
      }
      let caught = false;
      try {
        Object.setPrototypeOf(parent, child);
      } catch (error) {
        caught = error instanceof TypeError;
      }
      if (!caught) throw new Error("cycle");
      Object.setPrototypeOf(child, null);
      if (Object.getPrototypeOf(child) !== null) throw new Error("null");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("assigns the enumerable own properties of each source in turn", async () => {
    const result = await checkModel(`
      const target: { [key: string]: unknown } = { a: 1 };
      const source: { [key: string]: unknown } = { b: 3 };
      Object.defineProperty(source, "hidden", { value: 4, enumerable: false });
      Object.assign(target, null, undefined, "xy", 5);
      const assigned = Object.assign(target, { a: 2 }, source);
      if (assigned !== target || target.a !== 2 || target.b !== 3 || "hidden" in target) {
        throw new Error("assign");
      }
      if (target["0"] !== "x" || target["1"] !== "y") throw new Error("string");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("writes a value as JSON, with a replacer array and a gap", async () => {
    const result = await checkModel(`
      const value = { a: { b: [1, "x"] }, skipped: undefined, run: () => 1, n: null };
      if (JSON.stringify(value) !== '{"a":{"b":[1,"x"]},"n":null}') throw new Error("plain");
      if (JSON.stringify(value, ["n", "a"]) !== '{"n":null,"a":{}}') throw new Error("keys");
      if (JSON.stringify(value.a, null, 2) !== '{\\n  "b": [\\n    1,\\n    "x"\\n  ]\\n}') {
        throw new Error("gap");
      }
      if (JSON.stringify('"\\\\\\u0001\\ud800') !== '"\\\\"\\\\\\\\\\\\u0001\\\\ud800"') throw new Error("quote");
      if (JSON.stringify(undefined) !== undefined || JSON.stringify(-0) !== "0") {
        throw new Error("primitive");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where JSON.stringify would call a script's function", async () => {
    const result = await checkModel(`
      const value = { a: 1, toJSON: () => 2 };
      const text = JSON.stringify(value);
    `);
    expect(result.failure?.message).toContain("tla-ts can't call toJSON");
  });

  it("parses a literal as JSON, and throws a SyntaxError where it isn't JSON", async () => {
    const result = await checkModel(`
      const box = { seen: 0 };
      let caught = false;
      try {
        JSON.parse("[1,]");
      } catch (error) {
        caught = error instanceof SyntaxError;
      }
      if (!caught) throw new Error("syntax");
      JSON.parse('{"a": [1]}');
      if (JSON.parse('"a"') !== "a" || JSON.parse(" 12 ") !== 12) throw new Error("parse");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError where Object.assign can't write a property", async () => {
    const result = await checkModel(`
      const target: { [key: string]: unknown } = { a: 1 };
      Object.defineProperty(target, "a", { writable: false });
      let caught = false;
      try {
        Object.assign(target, { a: 2 });
      } catch (error) {
        caught = error instanceof TypeError;
      }
      if (!caught || target.a !== 1) throw new Error("write");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("compares values loosely with == and !=", async () => {
    const result = await checkModel(`
      const object: unknown = { a: 1 };
      const other: unknown = { a: 1 };
      const wrapper: unknown = new Number(5);
      const values: unknown[] = [1, "1", true, null, undefined, "0x10", "", "-0", "abc"];
      if (!(values[0] == values[1]) || !(values[0] == values[2]) || values[0] != "1.0") {
        throw new Error("numbers");
      }
      if (!(values[3] == values[4]) || values[3] == 0 || values[4] == false) {
        throw new Error("nullish");
      }
      if (values[5] != 16 || values[6] != 0 || values[7] != 0 || values[8] == 0) {
        throw new Error("strings");
      }
      if (object != object || object == other) throw new Error("identity");
      if (object != "[object Object]" || wrapper != "5") {
        throw new Error("primitive");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where == calls a method that a script gives", async () => {
    const result = await checkModel(`
      const object: unknown = { valueOf: () => 1 };
      if (object != 1) throw new Error("valueOf");
    `);
    expect(result.failure?.message).toContain("tla-ts can't call valueOf or toString");
  });

  it("converts an object to a primitive through the valueOf and toString it holds", async () => {
    const result = await checkModel(`
      const log = { text: "" };
      const object = {
        valueOf() {
          log.text += "v";
          return 5;
        },
        toString() {
          log.text += "t";
          return "s";
        },
      };
      const fallback = { valueOf: () => ({}), toString: () => "7" };
      const sum = (object as any) + 1;
      const text = String(object);
      const product = (fallback as any) * 2;
      const record = { size: 1 };
      const plain = \`\${record}!\`;
      if (sum !== 6 || text !== "s" || product !== 14 || plain !== "[object Object]!") {
        throw new Error("converted");
      }
      if (log.text !== "vt") throw new Error("order");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws what a conversion's method throws, or a TypeError where none gives a primitive", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      const throwing = {
        valueOf(): number {
          throw new RangeError("valueOf");
        },
      };
      const objects = { valueOf: () => ({}), toString: () => ({}) };
      let thrown = "";
      try {
        Number(throwing);
      } catch (error) {
        thrown += error instanceof RangeError ? "R" : "?";
      }
      try {
        Number(objects);
      } catch (error) {
        thrown += error instanceof TypeError ? "T" : "?";
      }
      if (thrown !== "RT") throw new Error(thrown);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts through Symbol.toPrimitive, for ==, and for objects that the operation makes", async () => {
    const result = await checkModel(`
      let count = 0;
      const exotic = {
        [Symbol.toPrimitive]: function () {
          count += 1;
          return 2;
        },
        valueOf: () => 9,
      };
      const other = { size: 1 };
      const doubled = (exotic as any) * 2;
      // @ts-ignore
      const isEqual = exotic == 2;
      // @ts-ignore
      const isSame = exotic == other;
      // @ts-ignore
      const made = { valueOf: () => 3 } + 1;
      if (doubled !== 4 || made !== 4 || count !== 2) throw new Error("converted");
      if (!isEqual) throw new Error("equal");
      if (isSame) throw new Error("same");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts the primitives and wrappers that an operator on numbers takes", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      const empty = null;
      // @ts-ignore
      const difference = "3" - true;
      // @ts-ignore
      const sum = true + empty;
      // @ts-ignore
      const product = new Number(2) * new String("3");
      // @ts-ignore
      const isLess = "10" < 9;
      if (difference !== 2 || sum !== 1 || product !== 6 || isLess) throw new Error("converted");
    `);
    expect(result.failure).toBeUndefined();
    const ordered = await checkModel(`
      const first = { toString: () => "a" };
      const second = { toString: () => "b" };
      // @ts-ignore
      const isOrdered = first <= second;
      if (!isOrdered) throw new Error("ordered");
    `);
    expect(ordered.failure).toBeUndefined();
    const wide = await checkModel(`
      const first = { toString: () => "e" };
      const second = { toString: () => "\u00e9" };
      // @ts-ignore
      const isOrdered = first <= second;
      if (!isOrdered) throw new Error("ordered");
    `);
    expect(wide.failure?.message).toContain(
      "tla-ts can't tell the code of a character outside ASCII",
    );
  });

  it("changes the case of ASCII letters", async () => {
    const result = await checkModel(`
      const lower = (text: string) => text.toLowerCase();
      if (lower("Hello, World 42!") !== "hello, world 42!" || "az@[\`{".toUpperCase() !== "AZ@[\`{") {
        throw new Error("case");
      }
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`
        const text = "\u00c9";
        if (text.toLowerCase() !== "\u00e9") throw new Error("wide");
      `),
    ).rejects.toThrow("tla-ts can't change the case of a character outside ASCII");
  });

  it("parses an integer in a radix with parseInt", async () => {
    const result = await checkModel(`
      const read = (text: string, radix?: number) => parseInt(text, radix);
      if (read("ff", 16) !== 255 || read("0x1A") !== 26 || read("  -12abc") !== -12) {
        throw new Error("hex");
      }
      if (read("zz", 36) !== 1295 || read("19", 8) !== 1 || Number.parseInt("101", 2) !== 5) {
        throw new Error("radix");
      }
    `);
    expect(result.failure).toBeUndefined();
    const special = await checkModel(`
      const read = (text: string, radix?: number) => parseInt(text, radix);
      const missing = NaN;
      if (!Number.isNaN(read("x")) || !Number.isNaN(read("1", 37)) || !Object.is(read("-0"), -0)) {
        throw new Error("special");
      }
    `);
    expect(special.failure).toBeUndefined();
  });

  it("pads a string at its start or end", async () => {
    const result = await checkModel(`
      const pad = (value: number) => String(value).padStart(2, "0");
      if (pad(5) !== "05" || pad(123) !== "123") throw new Error("pad");
      if ("ab".padStart(7, "xyz") !== "xyzxyab" || "ab".padEnd(7, "xyz") !== "abxyzxy") {
        throw new Error("fill");
      }
      if ("ab".padStart(5) !== "   ab" || "ab".padStart(6, "") !== "ab" || "abc".padEnd(-1) !== "abc") {
        throw new Error("edges");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts a string to a number, and stops where the number is NaN in a script of integers", async () => {
    const result = await checkModel(`
      const read = (text: string) => Number(text);
      if (read("42") !== 42 || read(" -7 ") !== -7 || read("0x1F") !== 31 || read("1e3") !== 1000) {
        throw new Error("number");
      }
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`
        const read = (text: string) => Number(text);
        if (read("abc") === 0) throw new Error("nan");
      `),
    ).rejects.toThrow("tla-ts can't represent NaN in this script");
  });

  it("reads the codes of ASCII characters, orders strings by them, and iterates a string", async () => {
    const result = await checkModel(`
      const text = "Az0 ~";
      if (text.charCodeAt(0) !== 65 || text.charCodeAt(4) !== 126 || text.codePointAt(9) !== undefined) {
        throw new Error("codes");
      }
      if (!("Z" < "a") || !("10" < "9") || !("ab" < "abc") || "a" > "a" || !("b" >= "a")) {
        throw new Error("order");
      }
      const box = { digits: "" };
      for (const character of "1.5x") {
        if (character >= "0" && character <= "9") box.digits += character;
      }
      if (box.digits !== "15") throw new Error("iterate");
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`
        const text = "a\u00e9";
        if (text.charCodeAt(1) !== 233) throw new Error("wide");
      `),
    ).rejects.toThrow("tla-ts can't tell the code of a character outside ASCII");
  });

  it("converts the arguments of Math's functions, and stops where it can't", async () => {
    const result = await checkModel(`
      let order = "";
      const first = {
        valueOf() {
          order += "a";
          return 7;
        },
      };
      const second = {
        valueOf() {
          order += "b";
          return -4;
        },
      };
      const largest = Math.max(first as any, second as any, "3" as any);
      const absolute = Math.abs(second as any);
      if (largest !== 7 || absolute !== 4 || order !== "abb") throw new Error("converted");
    `);
    expect(result.failure).toBeUndefined();
    const unconverted = await checkModel(`
      const larger = (value: any) => Math.max(value, 1);
      const result = larger({});
    `);
    expect(unconverted.failure?.message).toContain("tla-ts can't convert this object to a number");
    const indexed = await checkModel(`
      const list = [1, 2, 3];
      const value = list.at({} as any);
    `);
    expect(indexed.failure?.message).toContain("tla-ts can't convert this object to a number");
  });

  it("rejects a conversion whose method changes what the statement read before it", () => {
    expect(() =>
      compile(
        "let y = 2;\nconst object = {\n  valueOf() {\n    y = 10;\n    return 1;\n  },\n};\nconst result = y * ((object as any) + 1);",
      ),
    ).toThrow("tla-ts can't run this before what reads what it changes");
  });

  it("makes an object from an array's entries", async () => {
    const result = await checkModel(`
      const entries = [["z", 1], ["y", 2], ["x", 3], ["y", 4]];
      const made: { [key: string]: unknown } = Object.fromEntries(entries);
      const names = Object.getOwnPropertyNames(made);
      if (made.z !== 1 || made.y !== 4 || names.join() !== "z,y,x") throw new Error("entries");
      if (Object.getPrototypeOf(made) !== Object.prototype) throw new Error("prototype");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws the TypeError of an Object.create that nothing reads", async () => {
    const result = await checkModel(`
      const properties = { a: { get: null } } as unknown as PropertyDescriptorMap;
      Object.create(null);
      let caught = false;
      try {
        Object.create({}, properties);
      } catch (error) {
        caught = error instanceof TypeError;
      }
      if (!caught) throw new Error("create");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("lists the own property names of an array that a sequence holds", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      const odd = [1, 2, 3].filter((value) => value % 2 === 1);
      const names = Object.getOwnPropertyNames(odd);
      if (names.length !== 3 || names[0] !== "0" || names[2] !== "length") throw new Error("names");
      holder.seen = 1;
    `);
    expect(result.failure).toBeUndefined();
  });

  it("gives back a primitive that freeze, seal, or preventExtensions takes", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      if (Object.seal(true) !== true || Object.freeze("a") !== "a") throw new Error("primitive");
      if (Object.preventExtensions(3) !== 3) throw new Error("number");
      holder.seen = 1;
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts a primitive that an Object function reads to an object", async () => {
    const source = `
      const holder = { seen: 0 };
      let count = 0;
      try { Object.getOwnPropertyNames(undefined); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.getOwnPropertyDescriptor(null, "foo"); } catch (error) { if (error instanceof TypeError) count += 10; }
      try { Object.preventExtensions(null); } catch { count += 100; }
      Object.getOwnPropertyDescriptor(true, "foo");
      Object.getOwnPropertyNames("abc");
      if (count !== 11) throw new Error("count");
      if (Object.getOwnPropertyNames("ab").join() !== "0,1,length") throw new Error("names");
      if (Object.keys("ab").join() !== "0,1") throw new Error("keys");
      if (Object.values("ab").join() !== "a,b") throw new Error("values");
      const entries = Object.entries("ab");
      if (entries[1][0] !== "1" || entries[1][1] !== "b") throw new Error("entries");
      if (Object.getOwnPropertySymbols(Symbol()).length !== 0) throw new Error("symbols");
      if (Object.getOwnPropertyDescriptor(Symbol("foo"), "description") !== undefined) throw new Error("symbol");
      if (Object.getOwnPropertyDescriptor(1, "x") !== undefined) throw new Error("number");
      const described = Object.getOwnPropertyDescriptor("foo", "0");
      if (described?.value !== "f" || described.writable || !described.enumerable) throw new Error("index");
      const length = Object.getOwnPropertyDescriptor("foo", "length");
      if (length?.value !== 3 || length.enumerable) throw new Error("length");
      const missing = Object.getOwnPropertyDescriptor("", "0");
      if (missing !== undefined) throw new Error("missing");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = [
      ["count !== 11", "count !== 111"],
      ['"a,b"', '"b,a"'],
      ["length?.value !== 3", "length?.value !== 2"],
    ];
    for (const [from, to] of wrong) {
      expect((await checkModel(source.replace(from, to))).failure).toBeDefined();
    }
    const thrown = source.replace(
      'Object.getOwnPropertyNames("abc");',
      "Object.getOwnPropertyNames(undefined);",
    );
    expect((await checkModel(thrown)).failure).toBeDefined();
  });

  it("seals what a new of a built-in makes where nothing else reaches it", async () => {
    const source = `
      const holder = { seen: 0 };
      Object.seal(new TypeError());
      Object.freeze(new Map());
      Object.preventExtensions(new WeakSet());
      Object.seal(new Uint8Array());
      Object.seal(new DataView(new ArrayBuffer(4)));
      Object.seal(new WeakRef({}));
      Object.seal(new FinalizationRegistry(() => {}));
      Object.seal(new AggregateError([]));
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    // Freezing a typed array with elements throws a TypeError.
    const frozen = source.replace(
      "Object.seal(new Uint8Array());",
      "Object.freeze(new Uint8Array(1));",
    );
    expect((await checkModel(frozen)).failure).toBeDefined();
  });

  it("tests the extensibility of a function that the heap holds", async () => {
    const source = `
      const holder = { seen: 0 };
      function F(this: { a: number }) { this.a = 1; }
      const made = new (F as unknown as new () => { a: number })();
      const before = Object.isExtensible(F);
      Object.freeze(F);
      const frozen = Object.isFrozen(F);
      if (!before || !frozen || Object.isExtensible(F)) throw new Error("frozen");
      if (!Object.isExtensible(() => {}) || Object.isFrozen(function () {})) throw new Error("fresh");
      holder.seen = made.a;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("!frozen ||", "frozen ||");
    expect((await checkModel(wrong)).failure?.message).toContain("frozen");
  });

  it("reads an object through Reflect as in and Object's functions do", async () => {
    const source = `
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const o1: { p: number; z?: number } = { p: 42 };
      check(Reflect.has(o1, "p"), true, "own");
      check(Reflect.has(o1, "z"), false, "missing");
      const o2: { p?: number } = Object.create({ p: 42 });
      check(Reflect.has(o2, "p"), true, "inherited");
      const o: { [key: string | symbol]: number } = {};
      o.p1 = 42;
      const s1 = Symbol("1");
      o[s1] = 44;
      o[2] = 46;
      o[0] = 47;
      const keys = Reflect.ownKeys(o);
      check(keys.join === undefined, false, "array");
      check(keys.length, 4, "length");
      check(keys[1], "2", "second");
      check(keys[3], s1, "symbol");
      check(Reflect.ownKeys([]).join(), "length", "array keys");
      check(Reflect.isExtensible(o), true, "extensible");
      Object.preventExtensions(o);
      check(Reflect.isExtensible(o), false, "inextensible");
      const bare: object = Object.create(null);
      check(Reflect.getPrototypeOf(bare), null, "null");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = [
      ['"z"), false', '"z"), true'],
      ['keys[1], "2"', 'keys[1], "0"'],
      ['false, "inextensible"', 'true, "inextensible"'],
    ];
    for (const [from, to] of wrong) {
      expect((await checkModel(source.replace(from, to))).failure).toBeDefined();
    }
  });

  it("gives whether Reflect.defineProperty defined a key", async () => {
    const getSource = (isExpected: boolean) => `
      const object: Record<string, number> = {};
      const isDefined = Reflect.defineProperty(object, "attr", { value: 1, configurable: false });
      if (!isDefined || object.attr !== 1) throw new Error("defined");
      const isRedefined = Reflect.defineProperty(object, "attr", { value: 2 });
      if (isRedefined !== ${isExpected}) throw new Error("unexpected");
      Reflect.defineProperty(object, "other", { value: 3, enumerable: true });
      if (object.other !== 3 || Object.keys(object).length !== 1) throw new Error("other");
      let isTypeError = false;
      try {
        Reflect.defineProperty(object, "mixed", { value: 1, get: () => 1 });
      } catch (error) {
        isTypeError = error instanceof TypeError;
      }
      if (!isTypeError) throw new Error("mixed");
    `;
    expect((await checkModel(getSource(false))).failure).toBeUndefined();
    expect((await checkModel(getSource(true))).failure?.message).toContain("unexpected");
  });

  it("runs a definition with a descriptor written in place before the rest of its statement", async () => {
    const getSource = (expected: number) => `
      const object: Record<string, number> = {};
      let count = 0;
      if (!Reflect.defineProperty(object, "attr", { value: count, configurable: false })) {
        throw new Error("first");
      }
      count = 1;
      if (Reflect.defineProperty(object, "attr", { value: count }) === true) throw new Error("again");
      if (Object.defineProperty(object, "other", { value: 2 }) !== object || object.other !== 2) {
        throw new Error("other");
      }
      const isDone = Reflect.defineProperty(object, "late", { value: 3 }) && object.late === 3;
      if (!isDone || object.attr !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(0))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
  });

  it("describes each own property that Object.getOwnPropertyDescriptors reads", async () => {
    const source = `
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const value = {};
      const enumSym = Symbol("enum");
      const nonEnumSym = Symbol("nonenum");
      const obj: { [key: string | symbol]: unknown } = { key: 1 };
      obj[enumSym] = value;
      Object.defineProperty(obj, nonEnumSym, { writable: true, enumerable: false, configurable: true, value });
      Object.defineProperty(obj, "c", { enumerable: false, configurable: true, writable: false, value: 2 });
      const result: { [key: string | symbol]: PropertyDescriptor } = Object.getOwnPropertyDescriptors(obj);
      check(Object.keys(result).join(), "key,c", "keys");
      check(Object.getOwnPropertySymbols(result).length, 2, "symbols");
      check(result.key.value, 1, "key value");
      check(result.c.writable, false, "c writable");
      check(result[enumSym].value, value, "symbol value");
      check(result[nonEnumSym].enumerable, false, "symbol enumerable");
      const truthy: { [key: string]: PropertyDescriptor } = Object.getOwnPropertyDescriptors(true);
      check(Object.keys(truthy).length, 0, "boolean");
      const text: { [key: string]: PropertyDescriptor } = Object.getOwnPropertyDescriptors("ab");
      check(Object.keys(text).join(), "0,1,length", "string");
      check(text[1].value, "b", "character");
      const inferred = Object.getOwnPropertyDescriptors({ attr: 3 });
      check(inferred.attr.value, 3, "inferred");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = [
      ['"key,c", "keys"', '"c,key", "keys"'],
      ["result.c.writable, false", "result.c.writable, true"],
      ["result[enumSym].value, value", "result[enumSym].value, undefined"],
      ['"0,1,length", "string"', '"0,1", "string"'],
      ["inferred.attr.value, 3", "inferred.attr.value, 4"],
    ];
    for (const [from, to] of wrong) {
      expect((await checkModel(source.replace(from, to))).failure).toBeDefined();
    }
  });

  it("constructs an error that a call of a native error class makes", async () => {
    const source = `
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const made = TypeError("m");
      check(made.message, "m", "message");
      check(made instanceof TypeError, true, "instanceof");
      check(Object.prototype.toString.call(Error()), "[object Error]", "error call");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const message = source.replace('made.message, "m"', 'made.message, "n"');
    expect((await checkModel(message)).failure?.message).toContain("message");
    const instance = source.replace("instanceof TypeError, true", "instanceof TypeError, false");
    expect((await checkModel(instance)).failure?.message).toContain("instanceof");
  });

  it("converts a property key that may be a symbol to a string", async () => {
    const source = `
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const label = (name: PropertyKey) => String(name) + "!";
      check(label(Symbol("tag")), "Symbol(tag)!", "symbol");
      check(label(Symbol.toStringTag), "Symbol(Symbol.toStringTag)!", "well-known");
      check(label("plain"), "plain!", "string");
      check(label(3), "3!", "number");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const symbol = source.replace('"Symbol(tag)!"', '"tag!"');
    expect((await checkModel(symbol)).failure?.message).toContain('"symbol"');
    const number = source.replace('"3!", "number"', '"3.0!", "number"');
    expect((await checkModel(number)).failure?.message).toContain('"number"');
  });

  it("gives an object to Object back", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          <T extends object>(value: T): T;
        }
      }
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      check(Object.prototype.toString.call(Object([])), "[object Array]", "array");
      check(Object.prototype.toString.call(Object([1, 2])), "[object Array]", "array 2");
      check(Object.prototype.toString.call(Error()), "[object Error]", "error call");
      check(Object.prototype.toString.call(Object(new Error())), "[object Error]", "object error");
      check(Object.prototype.toString.call(Object(Error())), "[object Error]", "object error call");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const error = source.replace(
      '"[object Error]", "object error call"',
      '"[object Object]", "object error call"',
    );
    expect((await checkModel(error)).failure?.message).toContain("object error call");
    const array = source.replace('2])), "[object Array]"', '2])), "[object Object]"');
    expect((await checkModel(array)).failure?.message).toContain("array 2");
  });

  it("holds a function that Object's functions read on the heap, where calls still run it", async () => {
    const source = `
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const called = { count: 0 };
      const funObj = function () {
        called.count += 1;
      };
      (funObj as unknown as { foo: number }).foo = 10;
      check(Object.isExtensible(funObj), true, "extensible");
      Object.freeze(funObj);
      check(Object.isFrozen(funObj), true, "frozen");
      check(Object.getOwnPropertyDescriptor(funObj, "foo")!.writable, false, "writable");
      const isWritable = (obj: object, name: string) =>
        Object.getOwnPropertyDescriptor(obj, name)!.writable;
      check(isWritable(funObj, "foo"), false, "passed");
      funObj();
      check(called.count, 1, "call");
      check(typeof funObj, "function", "typeof");
      check(funObj.name, "funObj", "name");
      check(funObj.length, 0, "length");
      check(Object.getPrototypeOf(funObj), Function.prototype, "prototype");
      function declared() {}
      Object.preventExtensions(declared);
      check(Object.isExtensible(declared), false, "declared");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const frozen = source.replace("isFrozen(funObj), true", "isFrozen(funObj), false");
    expect((await checkModel(frozen)).failure?.message).toContain('"frozen"');
    const call = source.replace("called.count, 1", "called.count, 2");
    expect((await checkModel(call)).failure?.message).toContain('"call"');
    const declared = source.replace(
      "isExtensible(declared), false",
      "isExtensible(declared), true",
    );
    expect((await checkModel(declared)).failure?.message).toContain("declared");
  });

  it("writes the name and message of an error that the heap holds in its toString", async () => {
    const source = `
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const plain = new Error();
      check(plain.toString(), "Error", "plain");
      const typed = new TypeError("bad");
      check(typed.toString(), "TypeError: bad", "typed");
      const named = new Error("ErrorMessage");
      named.name = "";
      check(named.toString(), "ErrorMessage", "unnamed");
      const renamed = new Error();
      renamed.name = "ErrorName";
      check(renamed.toString(), "ErrorName", "renamed");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const typed = source.replace('"TypeError: bad"', '"Error: bad"');
    expect((await checkModel(typed)).failure?.message).toContain('"typed"');
    const unnamed = source.replace('"ErrorMessage", "unnamed"', '": ErrorMessage", "unnamed"');
    expect((await checkModel(unnamed)).failure?.message).toContain('"unnamed"');
  });

  it("holds an error that a script reads as an object on the heap, with its message and slot", async () => {
    const source = `
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const isOwn = (obj: object, name: string) => Object.prototype.hasOwnProperty.call(obj, name);
      const message = "my-message";
      const error = new TypeError(message);
      check(error.message, "my-message", "message");
      check(isOwn(error, "message"), true, "own message");
      check(Object.getOwnPropertyDescriptor(error, "message")!.enumerable, false, "hidden");
      check(error instanceof TypeError, true, "instanceof");
      check(error instanceof Error, true, "instanceof Error");
      check(error instanceof RangeError, false, "not RangeError");
      check(Object.prototype.toString.call(error), "[object Error]", "tag");
      const bare = new Error();
      check(bare.hasOwnProperty("message"), false, "bare");
      check(bare.message, "", "inherited");
      (bare as unknown as { value: string }).value = "Error";
      check((bare as unknown as { value: string }).value, "Error", "write");
      const target: { property?: string } = {};
      Object.defineProperty(target, "property", bare);
      check(target.property, "Error", "descriptor");
      Object.preventExtensions(bare);
      check(Object.isExtensible(bare), false, "inextensible");
      check(bare === error, false, "identity");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const hidden = source.replace('enumerable, false, "hidden"', 'enumerable, true, "hidden"');
    expect((await checkModel(hidden)).failure?.message).toContain('"hidden"');
    const instance = source.replace("RangeError, false", "RangeError, true");
    expect((await checkModel(instance)).failure?.message).toContain("not RangeError");
    const tag = source.replace('"[object Error]", "tag"', '"[object Object]", "tag"');
    expect((await checkModel(tag)).failure?.message).toContain('"tag"');
    const own = source.replace(
      'hasOwnProperty("message"), false',
      'hasOwnProperty("message"), true',
    );
    expect((await checkModel(own)).failure?.message).toContain('"bare"');
  });

  it("holds an error that only Object's functions read as an object with its prototype", async () => {
    const source = `
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const sealed = new Error();
      check(Object.isExtensible(sealed), true, "extensible");
      Object.seal(sealed);
      check(Object.isSealed(sealed), true, "sealed");
      check(Object.isFrozen(sealed), true, "frozen too");
      const frozen = new SyntaxError();
      Object.freeze(frozen);
      check(Object.isFrozen(frozen), true, "frozen");
      check(Object.getPrototypeOf(frozen), SyntaxError.prototype, "prototype");
      const defined = new TypeError();
      Object.defineProperty(defined, "foo", { value: 12, configurable: false });
      check(Object.hasOwn(defined, "foo"), true, "own");
      check(Object.isSealed(defined), false, "not sealed");
      Object.preventExtensions(defined);
      check(Object.isExtensible(defined), false, "inextensible");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const frozen = source.replace("isFrozen(frozen), true", "isFrozen(frozen), false");
    expect((await checkModel(frozen)).failure?.message).toContain('"frozen"');
    const prototype = source.replace("SyntaxError.prototype, ", "Error.prototype, ");
    expect((await checkModel(prototype)).failure?.message).toContain("prototype");
    const sealed = source.replace("isSealed(defined), false", "isSealed(defined), true");
    expect((await checkModel(sealed)).failure?.message).toContain("not sealed");
  });

  it("reads new.target as the newTarget of a construction and undefined in a call", async () => {
    const source = `
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const state: { target: unknown; arrows: number } = { target: null, arrows: 0 };
      function f(this: unknown) {
        state.target = new.target;
        if ((() => new.target)() !== undefined) state.arrows += 1;
      }
      f();
      check(state.target, undefined, "call");
      new (f as unknown as new () => object)();
      check(state.target, f, "new");
      const custom = function () {};
      Reflect.construct(f, [], custom);
      check(state.target, custom, "newTarget");
      check(state.arrows, 2, "arrows");
      class Base {
        constructor() {
          state.target = new.target;
        }
      }
      class Child extends Base {
        constructor() {
          super();
        }
      }
      new Child();
      check(state.target, Child, "super");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const call = source.replace('state.target, undefined, "call"', 'state.target, f, "call"');
    expect((await checkModel(call)).failure?.message).toContain('"call"');
    const target = source.replace(
      'state.target, custom, "newTarget"',
      'state.target, f, "newTarget"',
    );
    expect((await checkModel(target)).failure?.message).toContain('"newTarget"');
    const derived = source.replace('state.target, Child, "super"', 'state.target, Base, "super"');
    expect((await checkModel(derived)).failure?.message).toContain('"super"');
  });

  it("constructs through Reflect.construct as new does, with newTarget's prototype", async () => {
    const source = `
      const holder = { seen: 0 };
      const o = {};
      function fn(this: { o: object }) {
        this.o = o;
      }
      const result: { o: object } = Reflect.construct(fn, []);
      if (result.o !== o) throw new Error("o");
      if (!(result instanceof fn)) throw new Error("instanceof");
      class Point {
        x: number;
        constructor(x: number, y: number) {
          this.x = x + y;
        }
      }
      const point: Point = Reflect.construct(Point, [1, 2]);
      if (point.x !== 3) throw new Error("x");
      if (Object.getPrototypeOf(point) !== Point.prototype) throw new Error("proto");
      const seen = { isArray: false };
      function other(this: object) {
        seen.isArray = Object.getPrototypeOf(this) === Array.prototype;
      }
      const array: object = Reflect.construct(other, [], Array);
      if (Object.getPrototypeOf(array) !== Array.prototype) throw new Error("newTarget");
      seen.isArray = false;
      Reflect.construct(other, [], Array);
      if (!seen.isArray) throw new Error("inner");
      const pointed: object = Reflect.construct(other, [], Point);
      if (!(pointed instanceof Point)) throw new Error("Point newTarget");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const prototype = source.replace("(array) !== Array.prototype", "(array) !== Object.prototype");
    expect((await checkModel(prototype)).failure?.message).toContain("newTarget");
    const inner = source.replace("if (!seen.isArray)", "if (seen.isArray)");
    expect((await checkModel(inner)).failure?.message).toContain("inner");
    const passed = source.replace("point.x !== 3", "point.x !== 1");
    expect((await checkModel(passed)).failure?.message).toContain('"x"');
  });

  it("compares globalThis as the global object and stops where it reads its properties", async () => {
    const source = `
      const holder = { seen: 0 };
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const global = globalThis;
      check(typeof global, "object", "typeof");
      check((global as unknown) === holder, false, "other");
      check(Object.isExtensible(global), true, "extensible");
      check(Object.isFrozen(global), false, "frozen");
      function callback(this: unknown) { return this === global; }
      check([11].some(callback, global), true, "thisArg");
      check([11].some(callback, holder), false, "other thisArg");
      const run = (func: () => unknown) => {
        try {
          func();
        } catch (thrown) {
          if (typeof thrown !== "object") throw new Error("setter kind");
          return;
        }
        throw new Error("setter");
      };
      run(function () {
        Object.create({}, { prop: { set: global as unknown as () => void } });
      });
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("callback, holder), false", "callback, holder), true");
    expect((await checkModel(wrong)).failure?.message).toContain("other thisArg");
    const frozen = source.replace("isFrozen(global), false", "isFrozen(global), true");
    expect((await checkModel(frozen)).failure?.message).toContain("frozen");
    const read = source.replace("holder.seen = 1;", "holder.seen = globalThis.NaN;");
    expect((await checkModel(read)).failure?.message).toContain("can't read the properties");
  });

  it("gives new Object's object argument back and wraps a primitive one", async () => {
    const result = await checkModel(`
      declare global {
        interface ObjectConstructor {
          new <T extends object>(value: T): T;
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          new (value: number): Number;
        }
      }
      const box = { prop: 1 };
      const same = new Object(box);
      if (same !== box || same.prop !== 1) throw new Error("same");
      const count = new Object(5);
      if (count.constructor !== Number || typeof count !== "object") throw new Error("number");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts a value to an object where Object is called", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          (value?: null): { [key: string]: unknown };
          <T extends object>(value: T): T;
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: string): String;
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: number): Number;
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: boolean): Boolean;
        }
      }
      const check = (actual: unknown, expected: unknown, message: string) => {
        if (actual !== expected) throw new Error(message);
      };
      const box = { prop: 1 };
      check(Object(box), box, "same");
      const count = Object(5);
      check(count.constructor, Number, "constructor");
      check(typeof count, "object", "typeof");
      check(count.valueOf(), 5, "number");
      check(Object(true).valueOf(), true, "boolean");
      const text = Object("ab");
      check(text.length, 2, "length");
      check(Object.getPrototypeOf(Object(null)), Object.prototype, "empty");
      check(Object(5) === count, false, "fresh");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = [
      ['check(typeof count, "object"', 'check(typeof count, "number"'],
      ["check(count.valueOf(), 5,", "check(count.valueOf(), 6,"],
      ["check(Object(5) === count, false", "check(Object(5) === count, true"],
    ];
    for (const [from, to] of wrong) {
      expect((await checkModel(source.replace(from, to))).failure).toBeDefined();
    }
  });

  it("rejects new Object of a value whose type doesn't tell the object", () => {
    expect(() =>
      compile("const box = { prop: 1 };\nconst same: Object = new Object(box);"),
    ).toThrow("spec.ts:2:22 Unsupported constructor: new Object");
  });

  it("describes the properties of an array that a sequence holds", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      const odd = [0, 1, 2, 3, 4].filter((value) => value % 2 === 1);
      const element = Object.getOwnPropertyDescriptor(odd, 1);
      if (
        element === undefined ||
        element.value !== 3 ||
        element.writable !== true ||
        element.enumerable !== true
      ) {
        throw new Error("element");
      }
      const length = Object.getOwnPropertyDescriptor(odd, "length");
      if (
        length === undefined ||
        length.value !== 2 ||
        length.enumerable !== false ||
        length.configurable !== false
      ) {
        throw new Error("length");
      }
      const missing = Object.getOwnPropertyDescriptor(odd, 2);
      if (missing !== undefined) throw new Error("missing");
      holder.seen = 1;
    `);
    expect(result.failure).toBeUndefined();
  });

  it("binds a function's receiver and leading arguments", async () => {
    const result = await checkModel(`
      const holder = { prop: "abc" };
      function pair(this: unknown, first: number, second: number) {
        return this === holder && first === 1 && second === 2;
      }
      const bound = pair.bind(holder, 1);
      if (bound(2) !== true) throw new Error("call");
      if (bound.length !== 1 || bound.name !== "bound pair") throw new Error("properties");
      if (Object.getPrototypeOf(bound) !== Function.prototype) throw new Error("prototype");
      const other = Function.prototype.bind.call(pair, holder, 1);
      if (other === bound) throw new Error("identity");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops binding where a script replaced Function.prototype.bind", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      function one(this: unknown) {
        return 1;
      }
      Function.prototype.bind = function (this: unknown) {
        holder.count += 1;
        return one;
      } as typeof Function.prototype.bind;
      const bound = one.bind(null);
    `);
    expect(result.failure?.message).toContain("replaced Function.prototype.bind");
  });

  it("stops iterating an array where a script replaced the array iterator", async () => {
    const replaced = `
      let calls = 0;
      Array.prototype[Symbol.iterator] = function () {
        calls += 1;
        return { next: () => ({ value: 42, done: calls > 2 }) };
      } as typeof Array.prototype.values;
    `;
    const nextReplaced = `
      const ArrayIteratorPrototype = Object.getPrototypeOf([][Symbol.iterator]());
      ArrayIteratorPrototype.next = () => ({ value: 7, done: true });
    `;
    const sources = [
      `${replaced} const [first, second] = [1, 3, 2];`,
      `${replaced} let sum = 0; for (const value of [1, 2, 3]) sum += value;`,
      `${replaced} const spread = [...[5, 6, 7]];`,
      `${replaced} let first = 0; [first] = [1, 2];`,
      `${replaced} const [] = [1, 2];`,
      `${nextReplaced} const items = [1, 2]; items.push(3); const [first] = items;`,
      `${nextReplaced} const spread = [...[1, 2].values()];`,
    ];
    const results = await Promise.all(sources.map((source) => checkModel(source)));
    expect(results.map((result) => result.failure?.message)).toEqual(
      sources.map(() => expect.stringContaining("tla-ts can't iterate")),
    );
    const kept = `
      Object.defineProperty(Array.prototype, "extra", { value: 1, writable: true });
      const [first, second] = [1, 3, 2];
      let sum = 0;
      for (const value of [1, 2, 3]) sum += value;
      const spread = [...[5, 6, 7]];
      let third = 0;
      [, , third] = [1, 3, 2];
      if (first !== 1 || second !== 3 || sum !== 6 || spread.join() !== "5,6,7" || third !== 2) {
        throw new Error("wrong");
      }
    `;
    expect((await checkModel(kept)).failure).toBeUndefined();
    const wrong = await checkModel(kept.replace("sum !== 6", "sum !== 7"));
    expect(wrong.failure?.message).toContain("wrong");
  });

  it("stops where a bound function would see a fresh receiver", () => {
    expect(() =>
      compile(
        "function self(this: unknown) {\n  return this;\n}\nconst bound = self.bind({});\nconst first = bound();",
      ),
    ).toThrow("spec.ts:5:15 Unsupported call: bound");
  });

  it("stops where a callee holds a function that the script doesn't declare", async () => {
    const result = await checkModel(`
      const holder = {};
      const add = (left: number, right: number) => left + right;
      const largest: (left: number, right: number) => number = Math.max;
      let result = largest(1, 2);
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell which function this call runs");
  });

  it("renames a function that the JavaScript module defines", async () => {
    const compiled = compile(
      "function Join(value: number) {\n  return value + 1;\n}\nconst box = { a: 1 };\nlet result = Join(box.a);",
    );
    const result = await check({ ...compiled, source: printModule(compiled.source) });
    expect(result.status).toBe("deadlock");
  });

  it("reads new.target in a call as undefined rather than the function it's in", async () => {
    const source = `
      const box = { size: 1 };
      const same = (actual: unknown) => actual === undefined;
      function run() {
        return same(new.target);
      }
      if (!run()) throw new Error("called");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("if (!run())", "if (run())");
    expect((await checkModel(wrong)).failure?.message).toContain('"called"');
    expect(() =>
      compile(
        "const box = { size: 1 };\nfunction run() {\n  const read = () => new.target;\n  return read();\n}\nconst result = run();",
      ),
    ).toThrow("spec.ts:3:22 Unsupported expression: new.target");
  });

  it("writes TLC's least integer as a literal", async () => {
    const result = await checkModel(`
      const least = -2147483648;
      if (least + 2147483647 !== -1 || least >= -2147483647) throw new Error("least");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs the loops and local changes of a function that an expression calls", async () => {
    const result = await checkModel(`
      const findPair = (values: number[], target: number) => {
        const found = { first: -1, second: -1 };
        for (let outer = 0; outer < values.length; outer++) {
          for (let inner = outer + 1; inner < values.length; inner++) {
            if (values[outer] + values[inner] === target) {
              found.first = outer;
              found.second = inner;
              break;
            }
          }
          if (found.first !== -1) break;
        }
        return found.first * 10 + found.second;
      };

      const countUntil = (text: string, stop: string) => {
        const state = { index: 0, seen: 0 };
        while (state.index < text.length && text[state.index] !== stop) {
          state.index++;
          state.seen += 2;
        }
        return state.seen;
      };

      const sumTo = (limit: number) => {
        let total = 0;
        for (let index = 1; index <= limit; index++) {
          if (index === 3) continue;
          total += index;
        }
        return total;
      };

      const firstEven = (values: number[]) => {
        for (const value of values) {
          if (value % 2 === 0) return value;
        }
        return -1;
      };

      let count = 0;

      export const tick = () => {
        count = count === 1 ? 0 : 1;
      };

      export const isCorrect = () =>
        findPair([1, 4, 2, 5], 7) === 23 &&
        findPair([1, 2], 9) === -11 &&
        countUntil("abc.d", ".") === 6 &&
        countUntil("abc", ".") === 6 &&
        sumTo(5) === 12 &&
        firstEven([1, 3, 4, 6]) === 4 &&
        firstEven([1, 3]) === -1;
    `);
    expect(result.failure).toBeUndefined();
    expect(result.status).toBe("success");
  });

  it("rejects a function that an expression calls where it shares an object it changes", () => {
    expect(() =>
      compile(
        "const getShared = () => {\n  const first = { value: 1 };\n  const second = first;\n  second.value = 2;\n  return first.value;\n};\nlet count = 0;\nexport const tick = () => {\n  count = 1 - count;\n};\nexport const isCorrect = () => getShared() === 2;",
      ),
    ).toThrow("spec.ts:3:18 first would share an object that changes in place, so copy it");
  });

  it("stops where two equal arrays of a script may be two arrays", async () => {
    await expect(
      checkModel(`
        const source = [1, 2];
        const copy = source.slice();
        if (copy === source) throw new Error("same");
      `),
    ).rejects.toThrow("tla-ts can't tell whether two equal arrays are the same array");
    const result = await checkModel(`
      const source = [1, 2];
      const other = [3];
      if (source === other || source !== source) throw new Error("identity");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("writes an element past an array's end as undefined", async () => {
    const result = await checkModel(`
      const items = [1, 2];
      const missing = items[5] as number;
      if (\`\${missing}\` !== "undefined") throw new Error("missing");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads and writes an object that a Record type holds", async () => {
    const result = await checkModel(`
      const counts: Record<string, number> = { a: 1 };
      counts.b = counts.a + 4;
      if (counts.b !== 5 || counts.c !== undefined) throw new Error("counts");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("holds objects and other values in one union", async () => {
    const getSource = (aliased: number, isSame: string) => `
      interface Leaf { kind: "leaf"; value: number }
      interface Pair { kind: "pair"; left: Item; right: Item }
      class Counter {
        count = 2;
      }
      type Item = number | string | null | Leaf | Pair | Counter;
      const sum = (item: Item): number => {
        if (item === null) return -1;
        if (typeof item === "number") return item;
        if (typeof item === "string") return item.length;
        if (item instanceof Counter) return item.count * 100;
        if (item.kind === "pair") return sum(item.left) + sum(item.right);
        return item.value;
      };
      let current: Item = { kind: "leaf", value: 4 };
      const tree: Item = { kind: "pair", left: current, right: { kind: "pair", left: "abc", right: new Counter() } };
      if (typeof current === "object" && current.kind === "leaf") current.value = 10;
      current = 5;
      if (sum(tree) !== ${aliased}) throw new Error("aliased");
      const items: Item[] = [tree, 1, null];
      const copy: Leaf = { kind: "leaf", value: 10 };
      if (${isSame} || items.includes(copy) || items.filter((item) => item).length !== 2) {
        throw new Error("same");
      }
    `;
    const result = await checkModel(getSource(213, "items[0] !== tree || items[1] === tree"));
    expect(result.failure).toBeUndefined();
    const wrong = [
      [getSource(207, "false"), '"aliased"'],
      [getSource(213, "items[0] === tree"), '"same"'],
    ];
    for (const [source, message] of wrong) {
      expect((await checkModel(source)).failure?.message).toContain(message);
    }
  });

  it("stops where a script reads a property of an object or another value", () => {
    expect(() =>
      compile(`
        interface Sized { length: number }
        const read = (value: string | Sized) => value.length;
        const sized: Sized = { length: 4 };
        if (read(sized) !== 4) throw new Error("length");
      `),
    ).toThrow("tla-ts can't read a property of a value that may be an object or another value");
    expect(() =>
      compile(`
        interface Sized { length: number }
        const read = (value: string | Sized) => {
          const { length } = value;
          return length;
        };
        const sized: Sized = { length: 4 };
        if (read(sized) !== 4) throw new Error("length");
      `),
    ).toThrow("tla-ts can't destructure a value that may be an object or another value");
  });

  it("calls the functions that a factory returns, which call each other", async () => {
    const getSource = (isLooseSame: string) => `
      interface Branch { kind: "branch"; items: Value[] }
      type Value = number | Branch;
      const createCheck = (isStrict: boolean) => {
        const areSame = (left: Value[], right: Value[]) => {
          if (left.length !== right.length) return false;
          for (let index = 0; index < left.length; index++) {
            if (!isSame(left[index], right[index])) return false;
          }
          return true;
        };
        const isSame = (left: Value, right: Value): boolean => {
          if (left === right) return true;
          if (typeof left !== "object" || typeof right !== "object") return false;
          return !isStrict && areSame(left.items, right.items);
        };
        return isSame;
      };
      const isLoose = createCheck(false);
      const isStrict = createCheck(true);
      const first: Branch = { kind: "branch", items: [1, { kind: "branch", items: [2] }] };
      const second: Branch = { kind: "branch", items: [1, { kind: "branch", items: [2] }] };
      const third: Branch = { kind: "branch", items: [1, { kind: "branch", items: [3] }] };
      if (${isLooseSame} || isLoose(first, third)) throw new Error("loose");
      if (isStrict(first, second) || !isStrict(first, first)) throw new Error("strict");
    `;
    expect((await checkModel(getSource("!isLoose(first, second)"))).failure).toBeUndefined();
    expect((await checkModel(getSource("isLoose(first, second)"))).failure?.message).toContain(
      '"loose"',
    );
    expect(() =>
      compile(`
        const createAdd = (amount: number) => {
          const add = (value: number) => value + amount;
          return add;
        };
        const addTwo = createAdd(2);
        const addThree = createAdd(3);
        const box = { size: 1 };
        if (addTwo === addThree) throw new Error("same");
      `),
    ).toThrow("tla-ts can't use a function that a factory returns as a value");
  });

  it("runs a function that calls itself where a statement changed what it reads", async () => {
    const getSource = (expected: string) => `
      interface Branch { kind: "branch"; items: Value[] }
      type Value = number | Branch;
      let scale = 1;
      const show = (value: Value, isStrict = false): string => {
        const format = (inner: Value) => show(inner, isStrict);
        if (typeof value === "number") return isStrict ? \`n\${value * scale}\` : \`\${value * scale}\`;
        return \`[\${value.items.map(format).join(",")}]\`;
      };
      const tree: Branch = { kind: "branch", items: [1, { kind: "branch", items: [2, 3] }] };
      scale = 2;
      const loose = show(tree);
      tree.items.push(4);
      if (\`\${loose} \${show(tree, true)}\` !== "${expected}") throw new Error(\`\${show(tree)}\`);
    `;
    expect((await checkModel(getSource("[2,[4,6]] [n2,[n4,n6],n8]"))).failure).toBeUndefined();
    expect((await checkModel(getSource("[2,[4,6]] [n2,[n4,n6]]"))).failure?.message).toContain(
      '"[2,[4,6],8]"',
    );
  });

  it("returns what an array method gives whose callback calls the function it's in", async () => {
    const getSource = (isInnerMarked: string) => `
      interface Branch { kind: "branch"; items: Value[]; marked: boolean }
      type Value = number | Branch;
      const mark = (value: Value): void => {
        if (typeof value !== "object") return;
        value.marked = true;
        return value.items.forEach(mark);
      };
      const inner: Branch = { kind: "branch", items: [2], marked: false };
      const tree: Branch = { kind: "branch", items: [1, inner], marked: false };
      mark(tree);
      if (!tree.marked || ${isInnerMarked}inner.marked) throw new Error("marked");
    `;
    expect((await checkModel(getSource("!"))).failure).toBeUndefined();
    expect((await checkModel(getSource(""))).failure?.message).toContain('"marked"');
  });

  it("evaluates a function's defaults on each call", async () => {
    const getSource = (check: string) => `
      let count = 0;
      let total = 0;
      const next = () => {
        count++;
        return count * 10;
      };
      const take = (value = next()) => {
        total += value;
      };
      let calls = 0;
      const make = (num: number, den = 1) => {
        calls++;
        return num * 100 + den;
      };
      take();
      take();
      take(1);
      const half = make(1, 2);
      const seven = make(7);
      if (${check}) throw new Error("defaults");
    `;
    const passing = "total !== 31 || count !== 2 || half !== 102 || seven !== 701 || calls !== 2";
    expect((await checkModel(getSource(passing))).failure).toBeUndefined();
    expect((await checkModel(getSource("total === 31"))).failure?.message).toContain("defaults");
    expect((await checkModel(getSource("seven === 701"))).failure?.message).toContain("defaults");
  });

  it("gives each call of a function its own defaults", async () => {
    const getSource = (second: string, isSame: string) => `
      interface Box { size: number }
      const box: Box = { size: 0 };
      const boxes: Box[] = [];
      const grow = (value: number, step = 1): number => {
        box.size += step;
        return value + step;
      };
      const make = (made: Box = { size: 1 }): Box => {
        boxes.push(made);
        return made;
      };
      const first = grow(1, 2);
      const second = grow(1);
      const firstBox = make();
      const secondBox = make();
      firstBox.size = 5;
      if (first !== 3 || second !== ${second} || box.size !== 3) throw new Error("grow");
      if (firstBox ${isSame} secondBox || secondBox.size !== 1 || boxes.length !== 2) {
        throw new Error("make");
      }
    `;
    expect((await checkModel(getSource("2", "==="))).failure).toBeUndefined();
    expect((await checkModel(getSource("3", "==="))).failure?.message).toContain('"grow"');
    expect((await checkModel(getSource("2", "!=="))).failure?.message).toContain('"make"');
  });

  it("returns what an increment gives from an arrow whose body is the increment", async () => {
    const getSource = (prefix: string, postfix: string, made: string) => `
      let count = 0;
      const next = () => ++count;
      const take = () => count++;
      next();
      const prefixed = next();
      const postfixed = take();
      const made = [5, 6].map(() => count++);
      const found = [5, 6, 7].findIndex(() => ++count > 6);
      if (prefixed !== ${prefix} || postfixed !== ${postfix} || made.join(",") !== "${made}") {
        throw new Error("count");
      }
      if (found !== 1 || count !== 7) throw new Error("found");
    `;
    expect((await checkModel(getSource("2", "2", "3,4"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1", "2", "3,4"))).failure?.message).toContain('"count"');
    expect((await checkModel(getSource("2", "3", "3,4"))).failure?.message).toContain('"count"');
    expect((await checkModel(getSource("2", "2", "4,5"))).failure?.message).toContain('"count"');
  });

  it("runs the call whose result's method a statement calls first", async () => {
    const getSource = (seen: string) => `
      interface Branch { kind: "branch"; items: Value[]; seen: number }
      type Value = number | Branch;
      const touch = (value: Branch) => {
        value.seen += 1;
        return value.items.length;
      };
      const show = (value: Value): string => {
        const format = (inner: Value) => show(inner);
        if (typeof value === "number") return \`\${value}\`;
        return \`\${touch(value)}[\${value.items.map(format).join(",")}]\`;
      };
      const inner: Branch = { kind: "branch", items: [2], seen: 0 };
      const tree: Branch = { kind: "branch", items: [1, inner], seen: 0 };
      if (show(tree) !== "2[1,1[2]]" || inner.seen !== ${seen}) throw new Error("show");
    `;
    expect((await checkModel(getSource("1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("2"))).failure?.message).toContain('"show"');
  });

  it("runs a function that calls itself with defaults where a statement changed what it reads", async () => {
    const getSource = (expected: string) => `
      interface Box { size: number }
      let scale = 1;
      const box: Box = { size: 1 };
      const total = (depth: number, step = 1): number => {
        if (depth === 0) return scale * box.size;
        return scale * box.size + total(depth - step, step);
      };
      scale = 2;
      box.size = 3;
      const first = total(2);
      box.size = 4;
      const second = total(4, 2);
      if (\`\${first} \${second} \${total(1)}\` !== "${expected}") throw new Error("total");
    `;
    expect((await checkModel(getSource("18 24 16"))).failure).toBeUndefined();
    expect((await checkModel(getSource("18 24 12"))).failure?.message).toContain('"total"');
  });

  it("runs a function that calls itself in a conditional where a statement changed what it reads", async () => {
    const getSource = (expected: string) => `
      interface Box { size: number }
      const box: Box = { size: 3 };
      const total = (depth: number): number =>
        depth <= 0 ? box.size : box.size + total(depth - 1);
      box.size = 4;
      if (total(2) !== ${expected}) throw new Error("total");
    `;
    expect((await checkModel(getSource("12"))).failure).toBeUndefined();
    expect((await checkModel(getSource("9"))).failure?.message).toContain('"total"');
  });

  it("runs an exported function that a script imports, which calls itself", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/marking.ts");
    const source = readFileSync(path, "utf8");
    expect((await check(compile(source, path))).failure).toBeUndefined();
    const wrong = source.replace("!inner.marked", "inner.marked");
    expect((await check(compile(wrong, path))).failure?.message).toContain('"marked"');
  });

  it("runs the function that a factory returns, which changes the factory's variables", async () => {
    const getSource = (bumped: string, total: string) => `
      interface Box { total: number }
      const box: Box = { total: 0 };
      const createCount = (start: number) => {
        let count = start;
        const step = 2;
        function next() {
          count += step;
          box.total += count;
          return count;
        }
        return next;
      };
      const next = createCount(1);
      const bump = () => next() * 10;
      for (let index = 0; index < 2; index++) next();
      if (bump() !== ${bumped} || box.total !== ${total}) throw new Error("count");
    `;
    expect((await checkModel(getSource("70", "15"))).failure).toBeUndefined();
    expect((await checkModel(getSource("50", "15"))).failure?.message).toContain('"count"');
    expect((await checkModel(getSource("70", "8"))).failure?.message).toContain('"count"');
    expect(() =>
      compile(`
        const createCount = (start: number) => {
          let count = start;
          return () => ++count;
        };
        const first = createCount(0);
        const second = createCount(10);
        if (first() !== 1 || second() !== 11) throw new Error("count");
      `),
    ).toThrow("Unsupported expression");
  });

  it("runs a call in an operand that runs only sometimes inside another", async () => {
    const getSource = (kind: string) => `
      interface Leaf { kind: "leaf"; size: number }
      interface Pair { kind: "pair"; left: Node; right: Node }
      type Node = Leaf | Pair;
      interface Box { count: number }
      const box: Box = { count: 0 };
      const isSmall = (node: Node): boolean => {
        box.count += 1;
        if (node.kind === "leaf") return node.size < 3;
        return (isSmall(node.left) && isSmall(node.right)) || node.left.kind ${kind} "leaf";
      };
      const left: Node = { kind: "leaf", size: 0 };
      const tree: Node = { kind: "pair", left, right: { kind: "leaf", size: 5 } };
      if (!isSmall(tree) || box.count !== 3) throw new Error("small");
    `;
    expect((await checkModel(getSource("==="))).failure).toBeUndefined();
    expect((await checkModel(getSource("!=="))).failure?.message).toContain('"small"');
  });

  it("gives the number an increment reads or writes", async () => {
    const result = await checkModel(`
      let x = 5;
      x = x++;
      const z = --x + 10;
      const order = { size: 0, ranks: {} as Record<string, number> };
      order.ranks.a = order.size++;
      const pre = ++order.size;
      const items = [10, 20, 30];
      const at = items[Math.min(order.size++, 2)];
      if (x !== 4 || z !== 14 || order.ranks.a !== 0 || pre !== 2 || at !== 30) {
        throw new Error("counts");
      }
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        const box = { i: 0, slots: {} as Record<number, number> };
        box.slots[box.i] = box.i++;
      `),
    ).toThrow("Unsupported expression: box.i++");
  });

  it("assigns a parameter as a local binding", async () => {
    const result = await checkModel(`
      let state = 0;
      const total = (n: number, sum: number) => {
        while (n > 0) {
          sum += n;
          n--;
        }
        return sum;
      };
      const make = (x: number) => {
        const read = () => x;
        const first = read();
        x = 5;
        return [first, read()];
      };
      const bump = (by: number) => {
        by = by * 2;
        state += by;
      };
      const outer = 3;
      bump(outer);
      const pair = make(1);
      if (total(3, 0) !== 6 || pair[0] !== 1 || pair[1] !== 5 || state !== 6 || outer !== 3) {
        throw new Error("parameters");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("holds an array that a script gives a named property as an object", async () => {
    const result = await checkModel(`
      const items: number[] & { tag?: string } = [1, 2];
      items.tag = "t";
      if (items.tag !== "t" || items.length !== 2) throw new Error("tag");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads a constant's array that changes in place where a function reads it", async () => {
    const result = await checkModel(`
      const names: string[] = [];
      const count = () => names.length;
      names.push("a");
      const first = count();
      names.push("b");
      if (first !== 1 || count() !== 2) throw new Error("count");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("spreads a condition's object literal only where the condition holds", async () => {
    const result = await checkModel(`
      const make = (name: string, args: string[], module: string | undefined) => {
        const hasArgs = args.length > 0;
        return { name, ...(hasArgs && { args }), ...(module !== undefined && { module }) };
      };
      const plain = make("a", [], undefined);
      if (Object.keys(plain).join() !== "name" || "args" in plain) throw new Error("plain");
      const full = make("b", ["x"], "M");
      if (Object.keys(full).join() !== "name,args,module" || full.module !== "M") {
        throw new Error("full");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("changes a constant's set or map in place in a script with objects", async () => {
    const result = await checkModel(`
      const box = { n: 0 };
      const run = () => {
        const seen = new Set<string>();
        seen.add("a");
        seen.add("a");
        const counts = new Map<string, number>();
        counts.set("a", 1);
        counts.set("b", 2);
        counts.delete("a");
        if (seen.has("b") || counts.get("b") !== 2) throw new Error("has");
        return seen.size * 10 + counts.size;
      };
      if (run() !== 11) throw new Error("run");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("changes a constant's array in place in a script with objects", async () => {
    const result = await checkModel(`
      const box = { n: 0 };
      const run = () => {
        const items: number[] = [];
        const count = () => items.length;
        for (let i = 0; i < 3; i++) items.push(i);
        items[0] = 9;
        const total = count();
        return items.join(",") + total;
      };
      const names: string[] = [];
      names.push("a");
      if (run() !== "9,1,23" || names.length !== 1) throw new Error("arrays");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("changes an array that the heap holds in place", async () => {
    const result = await checkModel(`
      const items: number[] & { tag?: string } = [1, 2];
      items.tag = "t";
      items.push(3, 4);
      const popped = items.pop();
      const length = items.unshift(0);
      const first = items.shift();
      const text = items.join("-");
      if (popped !== 4 || length !== 4 || first !== 0 || text !== "1-2-3" || items.length !== 3) {
        throw new Error("methods");
      }
    `);
    expect(result.failure).toBeUndefined();
    const frozen = await checkModel(`
      const items: number[] & { tag?: string } = [1, 2];
      items.tag = "t";
      Object.freeze(items);
      items.push(3);
    `);
    expect(frozen.failure?.message).toContain(
      "tla-ts can't change an array in place that has holes or fixed elements",
    );
  });

  it("throws where an array that the heap holds has a fixed length", async () => {
    const result = await checkModel(`
      const items: number[] & { tag?: string } = [1, 2, 3];
      const others: number[] & { tag?: string } = [1];
      items.tag = "t";
      others.tag = "t";
      Object.defineProperty(items, "length", { writable: false });
      Object.defineProperty(others, "length", { writable: false });
      let caught = 0;
      try {
        items.pop();
      } catch (error) {
        if (error instanceof TypeError) caught++;
      }
      try {
        others.push(4);
      } catch (error) {
        if (error instanceof TypeError) caught++;
      }
      if (caught !== 2 || items.length !== 3 || 2 in items || 1 in others) throw new Error("fixed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("iterates and spreads an array that the heap holds", async () => {
    const result = await checkModel(`
      const box = {};
      const holes: (number | undefined)[] = [1, , 3];
      let total = 0;
      let missing = 0;
      for (const item of holes) {
        if (item === undefined) missing++;
        else total += item;
      }
      const copy = [0, ...holes];
      if (total !== 4 || missing !== 1 || copy.length !== 4 || Math.max(...[2, 5]) !== 5) {
        throw new Error("elements");
      }
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        const items: number[] & { tag?: string } = [1, 2];
        items.tag = "t";
        for (const item of items) if (item === 1) items.push(3);
      `),
    ).toThrow("tla-ts can't iterate an array that the heap holds while the loop changes objects");
  });

  it("changes a caller's array through a parameter", async () => {
    const result = await checkModel(`
      const add = (names: string[], name: string) => {
        names.push(name);
        return names.length;
      };
      const kept: string[] = ["a"];
      const size = add(kept, "b");
      const other = add(["x", "y"], "z");
      add(kept, "c");
      if (size !== 2 || other !== 3 || kept.join("") !== "abc") throw new Error("parameter");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("changes through a parameter an array that a function returns", async () => {
    const getSource = (expected: string) => `
      const fill = (items: string[]) => {
        items.push("a");
        return items;
      };
      const add = (items: string[]) => {
        items.push("a");
      };
      const names = "b,c".split(",");
      const list: string[] = [];
      const copy = list.slice();
      add(copy);
      add(list.slice());
      const size = fill(names).length + names.length;
      const result = [names.join(""), copy.join(""), list.length, size].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("bca,a,0,6"))).failure).toBeUndefined();
    expect((await checkModel(getSource("bc,a,0,6"))).failure?.message).toContain("bca,a,0,6");
  });

  it("changes an array that a field holds through a parameter", async () => {
    const result = await checkModel(`
      interface Config {
        init: string | undefined;
        invariants: string[];
        properties: string[];
      }
      const KEYS = new Map<string, "invariants" | "properties">([
        ["INVARIANT", "invariants"],
        ["PROPERTY", "properties"],
      ]);
      const parse = (words: string[]): Config => {
        const config: Config = { init: undefined, invariants: [], properties: [] };
        const parseNames = (names: string[], start: number) => {
          let position = start;
          while (position < words.length && !KEYS.has(words[position])) {
            names.push(words[position]);
            position++;
          }
          return position;
        };
        let position = 0;
        while (position < words.length) {
          const listKey = KEYS.get(words[position]);
          if (listKey === undefined) throw new Error("keyword");
          position = parseNames(config[listKey], position + 1);
        }
        return config;
      };
      const config = parse(["INVARIANT", "A", "B", "PROPERTY", "C", "INVARIANT", "D"]);
      if (config.invariants.join() !== "A,B,D" || config.properties.length !== 1) {
        throw new Error("fields");
      }
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        interface Box {
          items: number[];
        }
        const add = (items: number[]) => {
          items.push(1);
        };
        const box: Box = { items: [] };
        add(box.items);
        const text = JSON.stringify(box);
      `),
    ).toThrow("Only state variables and local lets can change: items");
  });

  it("rejects a function parameter that a helper uses as a value", () => {
    expect(() =>
      checkModel(`
        const first = (value: number) => value + 1;
        const isFirst = (factory: (value: number) => number) => factory === first;
        if (!isFirst(first)) throw new Error("same");
      `),
    ).toThrow("Call this function parameter, or pass it to a function");
  });

  it("returns a value whose call ran first", async () => {
    const result = await checkModel(`
      let calls = 0;
      const tick = (n: number): number => {
        calls += 1;
        return n;
      };
      const outer = (n: number): number => {
        return tick(n) + 1;
      };
      if (outer(2) !== 3 || calls !== 1) throw new Error("outer");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a function that changes state and calls itself", async () => {
    const parsed = await checkModel(`
      const tokens = ["{", "1", ",", "{", "2", "}", ",", "3", "}"];
      const cursor = { index: 0 };
      const advance = () => tokens[cursor.index++];
      interface Value { kind: string; elements: Value[]; text: string }
      const parseValue = (token: string): Value => {
        if (token !== "{") return { kind: "Number", elements: [], text: token };
        const elements: Value[] = [];
        while (true) {
          elements.push(parseValue(advance()));
          if (advance() !== ",") break;
        }
        return { kind: "Set", elements, text: "" };
      };
      const value = parseValue(advance());
      if (value.elements.length !== 3 || value.elements[1].elements[0].text !== "2") {
        throw new Error("parsed");
      }
      if (cursor.index !== 9) throw new Error("cursor");
    `);
    expect(parsed.failure).toBeUndefined();
    const counted = await checkModel(`
      let calls = 0;
      const walk = (n: number): number => {
        calls += 1;
        let local = n;
        if (n === 0) throw new Error("bottom");
        try {
          return walk(n - 1);
        } catch (error) {
          local += 1;
          return -local;
        }
      };
      let fibs = 0;
      const fib = (n: number): number => {
        fibs += 1;
        if (n < 2) return n;
        return fib(n - 1) + fib(n - 2);
      };
      let seen = "";
      const isEven = (n: number): boolean => {
        seen += "e";
        if (n === 0) return true;
        return isOdd(n - 1);
      };
      const isOdd = (n: number): boolean => {
        seen += "o";
        if (n === 0) return false;
        return isEven(n - 1);
      };
      if (walk(3) !== -2 || calls !== 4) throw new Error("walk");
      if (fib(5) !== 5 || fibs !== 15) throw new Error("fib");
      if (!isEven(4) || seen !== "eoeoe") throw new Error("mutual");
    `);
    expect(counted.failure).toBeUndefined();
    const uncaught = await checkModel(`
      let calls = 0;
      const fail = (n: number): number => {
        calls += 1;
        if (n === 0) throw new Error("bottom");
        return fail(n - 1) + 1;
      };
      fail(2);
    `);
    expect(uncaught.failure?.message).toContain("bottom");
    const getDefaulted = (calls: string) => `
      let calls = 0;
      const count = (n: number, step = 1): number => {
        calls += step;
        return n === 0 ? 0 : count(n - 1);
      };
      count(2);
      if (calls !== ${calls}) throw new Error("calls");
    `;
    expect((await checkModel(getDefaulted("3"))).failure).toBeUndefined();
    expect((await checkModel(getDefaulted("2"))).failure?.message).toContain('"calls"');
  });

  it("runs the getters of the properties that a pattern reads", async () => {
    const result = await checkModel(`
      const order: string[] = [];
      const source = {
        get a() { order.push("a"); return 1; },
        get b() { order.push("b"); return 2; },
      };
      const { b, a } = source;
      const take = ({ a }: { a: number }) => a;
      if (take(source) !== 1 || a !== 1 || b !== 2 || order.join() !== "b,a,a") {
        throw new Error(order.join());
      }
    `);
    expect(result.failure).toBeUndefined();
    const thrown = await checkModel(`
      class Poison extends Error {}
      const poisoned = Object.defineProperty({}, "poisoned", {
        get: function () { throw new Poison(); },
      });
      let caught = false;
      try {
        const { poisoned: value } = poisoned as { poisoned: number };
      } catch (error) {
        caught = error instanceof Poison;
      }
      if (!caught) throw new Error("caught");
    `);
    expect(thrown.failure).toBeUndefined();
  });

  it("reads a rest's copy of what a getter gave as a value", async () => {
    const getSource = (expected: number) => `
      let count = 0;
      const source = { get v() { count++; return 2; } };
      const { ...rest } = source;
      const value = rest.v + rest.v;
      if (count !== 1 || value !== ${expected}) throw new Error("rest");
    `;
    expect((await checkModel(getSource(4))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("rest");
  });

  it("copies what a getter gives into an object rest", async () => {
    const result = await checkModel(`
      let count: number = 0;
      const source = { a: 1, get v() { count++; return 2; } };
      const { a, ...rest } = source;
      const descriptor = Object.getOwnPropertyDescriptor(rest, "v");
      if (count !== 1 || a !== 1 || descriptor?.value !== 2 || !descriptor.writable) {
        throw new Error("rest");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("holds a getter in an object literal of a function that the script calls once", async () => {
    const result = await checkModel(`
      const make = () => ({ get v() { return 2; } });
      const made = make();
      if (made.v !== 2) throw new Error("v");
    `);
    expect(result.failure).toBeUndefined();
    const twice = await checkModel(`
      const make = () => ({ get v() { return 2; } });
      const first = make();
      const second = make();
      if (first.v + second.v !== 4) throw new Error("v");
    `);
    expect(twice.failure?.message).toContain("tla-ts can't call getters");
  });

  it("runs the getters of a parameter's default object that a pattern reads", async () => {
    const result = await checkModel(`
      let count: number = 0;
      function f({ ...x }: object = { get v() { count++; return 2; } }) {
        return x;
      }
      const made = f();
      const descriptor = Object.getOwnPropertyDescriptor(made, "v");
      if (count !== 1 || descriptor?.value !== 2) throw new Error("default");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("makes the objects of a loop's head once", async () => {
    const getSource = (expected: number) => `
      let count = 0;
      let total = 0;
      for (const { ...x } = { get v() { count++; return 2; } }; total < 1; ) {
        const descriptor = Object.getOwnPropertyDescriptor(x, "v");
        if (descriptor?.value !== 2 || !descriptor.writable) throw new Error("descriptor");
        total += 1;
      }
      for (const { ...x } of [{ get v() { count++; return 3; } }]) {
        const descriptor = Object.getOwnPropertyDescriptor(x, "v");
        if (descriptor?.value !== 3) throw new Error("rest");
        total += 3;
      }
      for (const item of [{ method() { return 10; } }]) {
        total += item.method();
      }
      if (count !== 2 || total !== ${expected}) throw new Error("total");
    `;
    expect((await checkModel(getSource(14))).failure).toBeUndefined();
    expect((await checkModel(getSource(13))).failure?.message).toContain("total");
  });

  it("stops at a getter that a for-of's assignment runs before the body runs", async () => {
    const result = await checkModel(`
      let count = 0;
      let rest: object = {};
      for ({ ...rest } of [{ get v() { count++; return 2; } }]) {
        if (count !== 1) throw new Error("count");
      }
    `);
    expect(result.failure?.message).toContain("tla-ts can't call getters");
  });

  it("runs a class's static private accessors", async () => {
    const result = await checkModel(`
      let stringSet = "";
      class C {
        static get #name() { return "get string"; }
        static set #name(param: string) { stringSet = param; }
        static getPrivateReference() { return this.#name; }
        static setPrivateReference(value: string) { this.#name = value; }
      }
      if (C.getPrivateReference() !== "get string") throw new Error("get");
      C.setPrivateReference("set string");
      if (stringSet !== "set string") throw new Error("set");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("keeps what a pattern's getters change across a loop", async () => {
    const getSource = (statements: string, expected: number) => `
      let count = 0;
      const source = { get v() { count = count + 1; return 2; } };
      function take({ v }: { v: number }) { return v; }
      ${statements}
      if (count !== ${expected}) throw new Error("count");
    `;
    for (const statements of [
      "for (let index = 0; index < 2; index++) { const { v } = source; }",
      "let index = 0; while (index < 2) { take(source); index++; }",
    ]) {
      expect((await checkModel(getSource(statements, 2))).failure).toBeUndefined();
      expect((await checkModel(getSource(statements, 1))).failure?.message).toContain("count");
    }
  });

  it("shares an array that a field holds and changes in place", async () => {
    const result = await checkModel(`
      interface Tree {
        name: string;
        children: Tree[];
      }
      const make = (name: string): Tree => ({ name, children: [] });
      const root = make("r");
      root.children.push(make("l"));
      const copy = { ...root };
      copy.children.push(make("x"));
      const holder = { list: root.children };
      holder.list.push(make("y"));
      const trace: { sets: number[] | undefined } = { sets: undefined };
      const enter = (value: number) => {
        const sets = trace.sets;
        sets?.push(value);
        return sets?.length ?? -1;
      };
      const before = enter(1);
      const list: number[] = [];
      trace.sets = list;
      const after = enter(2);
      if (root.children.length !== 3 || before !== -1 || after !== 1 || list.length !== 1) {
        throw new Error("fields");
      }
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        const trace: { sets: number[] | undefined } = { sets: undefined };
        const list: number[] = [];
        trace.sets = list;
        const snapshot = JSON.stringify(trace);
        trace.sets.push(1);
      `),
    ).toThrow("list would share an object that changes in place, so copy it");
  });

  it("shares the arrays of a tree's nodes as the parser builds them", async () => {
    const result = await checkModel(`
      interface Node {
        kind: string;
        heirs: Node[];
      }
      const create = (kind: string, heirs: Node[]): Node => ({ kind, heirs });
      const leaf = create("leaf", []);
      const pair = create("pair", [leaf, leaf]);
      const flat = (node: Node, isFlat: boolean) =>
        create("flat", [...(isFlat ? node.heirs : [node]), leaf]);
      const one = flat(pair, true);
      const two = flat(pair, false);
      pair.heirs.push(leaf);
      const frame = { heirs: [] as Node[], node: undefined as Node | undefined };
      frame.heirs.push(one);
      frame.node = create("whole", frame.heirs);
      frame.heirs.push(two);
      if (
        one.heirs.length !== 3 ||
        two.heirs.length !== 2 ||
        frame.node.heirs.length !== 2 ||
        pair.heirs.length !== 3
      ) {
        throw new Error("heirs");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("shares an array that changes in place where nothing changes it after", async () => {
    const result = await checkModel(`
      const box = { list: [0] };
      const make = () => {
        const items: number[] = [];
        items.push(1);
        box.list = items;
        return box.list.length;
      };
      if (make() !== 1 || box.list[0] !== 1) throw new Error("last");
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        const box = { list: [0] };
        const items: number[] = [];
        box.list = items;
        items.push(1);
      `),
    ).toThrow("items would share an object that changes in place, so copy it");
  });

  it("shares the arrays inside an array that a field holds", async () => {
    const result = await checkModel(`
      interface Item { value: number }
      interface State { stacks: Item[][] }
      const state: State = { stacks: [] };
      const getStack = (current: State) => current.stacks[current.stacks.length - 1];
      state.stacks.push([]);
      const stack = getStack(state);
      stack.push({ value: 1 });
      stack.push({ value: 2 });
      const last = state.stacks.at(-1)?.at(-1);
      stack[stack.length - 1] = { value: 7 };
      state.stacks.push([{ value: 9 }]);
      getStack(state).push({ value: 10 });
      const inner = getStack(state);
      state.stacks.pop();
      if (
        last?.value !== 2 ||
        state.stacks[0][1].value !== 7 ||
        inner.length !== 2 ||
        state.stacks.length !== 1
      ) {
        throw new Error("nested");
      }
    `);
    expect(result.failure).toBeUndefined();
    const returned = await checkModel(`
      const fill = (items: number[]) => {
        items.push(1);
        return items;
      };
      const list: number[] = [];
      if (fill(list).length + list.length !== 2) throw new Error("returned");
    `);
    expect(returned.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        const inner = [1];
        const state = { stacks: [inner] };
        const getTop = () => state.stacks[0];
        getTop().push(2);
      `),
    ).toThrow("Can't assign to getTop()");
  });

  it("splices an array that the heap holds", async () => {
    const result = await checkModel(`
      const box = { list: [1, 2, 3, 4], rest: [1, 2, 3] };
      const cut = (list: number[], rest: number[]) => {
        list.splice(-3, 2, 9, 8, 7);
        rest.splice(1);
      };
      cut(box.list, box.rest);
      if (box.list.join() !== "1,9,8,7,4" || box.rest.join() !== "1") throw new Error("splice");
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        const box = { list: [1, 2, 3] };
        const cut = (list: number[]) => list.splice(0, 1);
        const removed = cut(box.list);
      `),
    ).toThrow("Unsupported array method: splice");
  });

  it("pushes the elements that a spread gives onto an array that the heap holds", async () => {
    const result = await checkModel(`
      interface Module { constants: string[]; units: { names: string[] }[] }
      const module: Module = { constants: [], units: [] };
      const add = (names: string[]) => {
        module.constants.push(...names);
        module.units.push({ names });
      };
      add(["a", "b"]);
      const more = { list: ["z"] };
      const grow = (list: string[]) => {
        list.unshift(...module.constants, "y");
      };
      grow(more.list);
      add(["c"]);
      if (module.constants.join() !== "a,b,c" || more.list.join() !== "a,b,y,z") {
        throw new Error("spread");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("names a function's model value so that TLC doesn't type it", async () => {
    const result = await checkModel(`
      function __make(this: { [key: string]: unknown }, value: string, ...rest: unknown[]) {
        this.value = value;
        return true;
        this.extra = arguments[1];
      }
      const made = new (__make as unknown as new (...args: unknown[]) => { value: string })("x", "y");
      if (made.value !== "x") throw new Error("made");
    `);
    expect(result.failure?.message).toContain("tla-ts can't");
  });

  it("assigns a constructor's parameter properties before its body runs", async () => {
    const getSource = (keys: string, extra: number) => `
      class Base {
        label = "base";
      }
      class Item extends Base {
        extra = 1;
        constructor(private price: number, readonly count = price * 2) {
          super();
          this.extra = this.price + this.count;
        }
        get total() { return this.price * this.count; }
      }
      const item = new Item(3);
      const keys = Object.keys(item).join(",");
      if (keys !== "${keys}") throw new Error("keys");
      if (item.total !== 18 || item.extra !== ${extra}) throw new Error("values");
    `;
    expect((await checkModel(getSource("label,price,count,extra", 9))).failure).toBeUndefined();
    expect((await checkModel(getSource("label,extra,price,count", 9))).failure?.message).toContain(
      "keys",
    );
    expect((await checkModel(getSource("label,price,count,extra", 8))).failure?.message).toContain(
      "values",
    );
  });

  it("tells whether a value of type unknown inherits from a built-in constructor", async () => {
    const result = await checkModel(`
      const isDate = (value: unknown) => value instanceof Date;
      const isBool = (value: unknown) => value instanceof Boolean;
      const boxed = new Boolean(true);
      const date = new Date(0);
      if (!isBool(boxed) || isBool(true) || isBool(null) || isDate(boxed) || !isDate(date)) {
        throw new Error("instanceof");
      }
    `);
    expect(result.failure).toBeUndefined();
    const stopped = await checkModel(`
      const isObject = (value: unknown) => value instanceof Object;
      const date = new Date(0);
      if (!isObject([1, 2])) throw new Error("array");
    `);
    expect(stopped.failure?.message).toContain("tla-ts can't tell what this value inherits from");
  });

  it("iterates a generator with for-of, closing it where the loop leaves early", async () => {
    const result = await checkModel(`
      const box = { seen: 0 };
      function* values() {
        yield 1;
        box.seen += 1;
        yield 2;
        box.seen += 1;
        yield 3;
      }
      const count = () => box.seen;
      let total = 0;
      for (const x of values()) total += x;
      if (total !== 6 || count() !== 2) throw new Error("all");
      const iterator = values();
      for (const y of iterator) {
        if (y === 2) break;
        total += y;
      }
      for (const y of iterator) total += 100;
      if (total !== 7 || count() !== 3) throw new Error("break");
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      compile(`
        const box = { seen: 0 };
        function* values() {
          yield 1;
        }
        (values as unknown as { prototype: { next: unknown } }).prototype.next = () => ({
          value: 5,
          done: true,
        });
        for (const y of values()) box.seen += y;
      `),
    ).toThrow("tla-ts can't iterate a generator where a script may change how it iterates");
  });

  it("throws a ReferenceError where an operation first reads a name that nothing binds", async () => {
    const result = await checkModel(`
      const box = { caught: 0 };
      function f(first: unknown, second: unknown) {
        return first;
      }
      try {
        // @ts-ignore
        1 - y;
      } catch (error) {
        if (error instanceof ReferenceError) box.caught += 1;
      }
      try {
        // @ts-ignore
        f(x, (box.caught = 10));
      } catch (error) {
        if (error instanceof ReferenceError) box.caught += 1;
      }
      try {
        // @ts-ignore
        if (true ? ~x : 0) box.caught = 10;
      } catch (error) {
        if (error instanceof ReferenceError) box.caught += 1;
      }
      if (box.caught !== 3) throw new Error("caught");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws the ReferenceError of a name that an object literal spreads", async () => {
    const getSource = (expected: number) => `
      let caught = 0;
      const expectThrown = (run: () => void) => {
        try {
          run();
        } catch (error) {
          if (error instanceof ReferenceError) caught += 1;
        }
      };
      // @ts-ignore
      expectThrown(() => { [{ a: 0, ...unresolvable }]; });
      // @ts-ignore
      expectThrown(() => { (function (...rest: unknown[]) {})({ ...unresolvable }); });
      class Parent { constructor(...rest: unknown[]) {} }
      class Child extends Parent {
        // @ts-ignore
        constructor() { super({ a: 0, ...unresolvable }); }
      }
      expectThrown(() => { new Child(); });
      if (caught !== ${expected}) throw new Error("caught");
    `;
    expect((await checkModel(getSource(3))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("caught");
  });

  it("drops an object that a statement makes from members that evaluate nothing", async () => {
    const getSource = (done: boolean) => `
      const holder = {
        *make() {
          ({ get yield() { return 1; }, count: 2, method() {} });
        },
      };
      const result = holder.make().next();
      if (result.value !== undefined || result.done !== ${done}) throw new Error("result");
    `;
    expect((await checkModel(getSource(true))).failure).toBeUndefined();
    expect((await checkModel(getSource(false))).failure?.message).toContain("result");
  });

  it("sorts, reverses, fills, and copies within an array in place", async () => {
    const result = await checkModel(`
      const letters = ["z", "B", "a", "A"];
      letters.sort();
      const numbers = [10, 9, 1, 100];
      numbers.sort();
      const byValue = [3, 1, 2, 1];
      byValue.sort((a, b) => a - b);
      const holes: (number | undefined)[] = [undefined, 2, 1];
      holes.sort();
      const reversed = [1, 2, 3];
      reversed.reverse();
      const filled = [0, 0, 0, 0];
      filled.fill(8, 1, -1);
      const copied = [0, 1, 2, 3, 4].copyWithin(2, 0, -1);
      if (
        letters.join(",") !== "A,B,a,z" ||
        numbers.join(",") !== "1,10,100,9" ||
        byValue.join(",") !== "1,1,2,3" ||
        holes[0] !== 1 ||
        holes[2] !== undefined ||
        reversed.join(",") !== "3,2,1" ||
        filled.join(",") !== "0,8,8,0" ||
        copied.join(",") !== "0,1,0,1,2"
      ) {
        throw new Error("arrays");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("copies an array sorted or spliced", async () => {
    const result = await checkModel(`
      const items = ["first", "second", "third"];
      const numbers = [3, 10, 2];
      if (
        items.toSpliced(1).join(",") !== "first" ||
        items.toSpliced(1, undefined).join(",") !== "first,second,third" ||
        items.toSpliced(-2, 1, "x", "y").join(",") !== "first,x,y,third" ||
        items.toSpliced(1, -3).join(",") !== "first,second,third" ||
        items.toSpliced(1, 10).join(",") !== "first" ||
        numbers.toSorted().join(",") !== "10,2,3" ||
        numbers.toSorted((a, b) => a - b).join(",") !== "2,3,10" ||
        numbers.join(",") !== "3,10,2"
      ) {
        throw new Error("copies");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("visits an array as its method's callback changes it", async () => {
    const result = await checkModel(`
      const arr = [1, 2, 3, 4, 5];
      const isSmall = (value: number) => {
        arr[4] = 6;
        return value < 6;
      };
      const shrinking = [1, 2, 3, 4];
      let visited = 0;
      shrinking.forEach((value: number) => {
        visited += value;
        if (shrinking.length > 2) shrinking.pop();
      });
      const growing = [1, 2];
      let count = 0;
      growing.forEach(() => {
        count += 1;
        growing.push(9);
      });
      const found = [1, 2, 3];
      const result = found.find((value: number) => {
        found.pop();
        return value === 3;
      });
      if (
        arr.every(isSmall) !== false ||
        visited !== 3 ||
        count !== 2 ||
        growing.length !== 4 ||
        result !== undefined
      ) {
        throw new Error("visits");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("copies an array-like object sorted or spliced", async () => {
    const result = await checkModel(`
      const arrayLike = { length: 3, 0: "c", 1: "a", 2: "b" };
      const sorted = Array.prototype.toSorted.call(arrayLike);
      // @ts-ignore
      const spliced = Array.prototype.toSpliced.call(arrayLike, 1, 1, "x");
      const withHoles = Array.prototype.toSorted.call({ length: 3, 0: "b" });
      if (
        sorted.join(",") !== "a,b,c" ||
        spliced.join(",") !== "c,x,b" ||
        withHoles.length !== 3 ||
        withHoles[0] !== "b" ||
        withHoles[1] !== undefined
      ) {
        throw new Error("copies");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("tells which properties an array has", async () => {
    const result = await checkModel(`
      const arr = [0, 1, 2];
      if (
        !arr.hasOwnProperty(0) ||
        !arr.hasOwnProperty("2") ||
        !arr.hasOwnProperty("length") ||
        arr.hasOwnProperty(3) ||
        arr.hasOwnProperty("01")
      ) {
        throw new Error("properties");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops at an array method that a script replaced", async () => {
    const result = await checkModel(`
      // @ts-ignore
      Array.prototype.at = () => 5;
      if ([1].at(0) !== 5) throw new Error("replaced");
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't call an array method that a script put",
    );
  });

  it("gives the length that a push or an unshift leaves", async () => {
    const result = await checkModel(`
      const x: number[] = [];
      const pushed = x.push(1);
      const again = x.push();
      const unshifted = x.unshift(5, 6);
      if (pushed !== 1 || again !== 1 || unshifted !== 3 || x.join(",") !== "5,6,1") {
        throw new Error("lengths");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts an array to a string through its join", async () => {
    const result = await checkModel(`
      if ([5, 6, 1].toString() !== "5,6,1" || ["a", "b"].toString() !== "a,b") {
        throw new Error("strings");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops at a toString whose join a script replaced", async () => {
    const result = await checkModel(`
      // @ts-ignore
      Array.prototype.join = () => "j";
      if ([1].toString() !== "j") throw new Error("replaced");
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't call an array method that a script put",
    );
  });

  it("splices an array in place", async () => {
    const result = await checkModel(`
      const x = [0, 1, 2, 3];
      const removed = x.splice(0, 3);
      const y = [0, 1, 2, 3];
      y.splice(1, 1, 7, 8);
      const z = [0, 1, 2];
      const tail = z.splice(-1);
      if (
        removed.join(",") !== "0,1,2" ||
        x.join(",") !== "3" ||
        y.join(",") !== "0,7,8,2,3" ||
        tail.join(",") !== "2" ||
        z.join(",") !== "0,1"
      ) {
        throw new Error("spliced");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("tells a script's errors apart by the identity that made them", async () => {
    const result = await checkModel(`
      const box = { seen: 0 };
      const error = new Error("a");
      const other = new Error("a");
      let caught: unknown;
      try {
        throw error;
      } catch (thrown) {
        caught = thrown;
      }
      if (caught !== error || error === other) throw new Error("identity");
    `);
    expect(result.failure).toBeUndefined();
    const stopped = await checkModel(`
      const box = { seen: 0 };
      const first = new Set<number>();
      const second = new Set<number>();
      if (first === second) throw new Error("distinct");
    `);
    expect(stopped.failure?.message).toContain(
      "tla-ts can't tell whether two equal objects are the same object",
    );
  });

  it("makes an error inside a loop or a default that must change no object", async () => {
    const getSource = (check: string) => `
      const object: { [key: string]: number } = { a: 1, b: 2 };
      const items: (number | undefined)[] = [3, , 4];
      let first: Error | undefined;
      let seen = "";
      for (const key in object) {
        const error = new Error(key);
        first = first ?? error;
        seen = seen + key + (first === error ? "=" : "!") + ";";
      }
      for (const item of items) {
        const error = new Error("item");
        seen = \`\${seen}\${item}\${first === error ? "=" : "!"};\`;
      }
      const thrower = (): number => {
        throw new RangeError("default");
      };
      try {
        for (const { x = thrower() } of [{ x: 5 }, {}] as { x?: number }[]) {
          seen = seen + x + ";";
        }
      } catch (thrown) {
        seen = seen + (thrown instanceof RangeError ? "caught" : "other");
      }
      if (seen !== "${check}") throw new Error(seen);
    `;
    expect(
      (await checkModel(getSource("a=;b!;3!;undefined!;4!;5;caught"))).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("a=;b=;3!;undefined!;4!;5;caught"))).failure).toBeDefined();
  });

  it("gives a callback that an array method calls the arguments it passes", async () => {
    const result = await checkModel(`
      const box = { count: 0 as number, second: 0 as unknown };
      function callback(value: unknown, position: unknown, array: unknown) {
        box.count = arguments.length;
        box.second = arguments[1];
        return true;
      }
      [5, 6].filter(callback);
      const reducer = function (total: number, value: number) {
        box.count += arguments.length;
        return total + value;
      };
      [1].reduce(reducer, 0);
      if (box.count !== 7 || box.second !== 1) throw new Error("arguments");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads the arguments of a call that an expression makes", async () => {
    const result = await checkModel(`
      const box = { seen: 0 };
      function count(...rest: unknown[]) {
        return arguments.length;
      }
      function second(...rest: unknown[]) {
        return arguments[1];
      }
      if (count(1, 2) !== 2) throw new Error("length " + count(1, 2));
      if (second(1, "b") !== "b" || second(1) !== undefined) throw new Error("second " + second(1));
      const read = { x: undefined as unknown };
      function f(x = arguments[2], y?: unknown, z?: unknown) {
        read.x = x;
      }
      f(undefined, undefined, "third");
      if (read.x !== "third") throw new Error("default");
    `);
    expect(result.failure).toBeUndefined();
    const getEscaped = (expected: number) => `
      const box = { seen: 0 };
      function all(...rest: unknown[]) {
        return arguments;
      }
      if (all(1).length !== ${expected}) throw new Error("length " + all(1).length);
    `;
    expect((await checkModel(getEscaped(1))).failure).toBeUndefined();
    expect((await checkModel(getEscaped(2))).failure?.message).toContain("length 1");
  });

  it("rejects a sort comparator that may throw", () => {
    expect(() =>
      compile(`
        let isThrown = false;
        try {
          const x = [1, 0];
          x.sort(() => {
            throw new Error("compared");
          });
        } catch {
          isThrown = true;
        }
      `),
    ).toThrow("Unsupported comparator: one that may throw");
  });

  it("delegates an async generator's yield* to an object's async iterator", async () => {
    const getSource = (value: number, order: string) => `
      const log: string[] = [];
      let step = 0;
      const source = {
        get [Symbol.iterator](): () => Iterator<number> {
          throw new Error("sync");
        },
        [Symbol.asyncIterator]() {
          return {
            next() {
              step = step + 1;
              return step === 1 ? { then: 39, value: 42, done: false } : { value: 7, done: true };
            },
          };
        },
      };
      async function* gen() {
        yield* source;
        yield 9;
      }
      const iter = gen();
      const first = iter.next().then((result) => {
        log.push("next");
        return result;
      });
      Promise.resolve()
        .then(() => { log.push("a"); })
        .then(() => { log.push("b"); });
      const result = await first;
      const second = await iter.next();
      if (result.value !== ${value} || second.value !== 9 || step !== 2) throw new Error("values");
      if (log.join(",") !== "${order}") throw new Error("order");
    `;
    expect((await checkModel(getSource(42, "a,next,b"))).failure).toBeUndefined();
    expect((await checkModel(getSource(43, "a,next,b"))).failure?.message).toContain("values");
    expect((await checkModel(getSource(42, "a,b,next"))).failure?.message).toContain("order");
  });

  it("sorts, reverses, and copies within an array with holes in place", async () => {
    const result = await checkModel(`
      const a = [3, , 1, undefined, 2];
      a.sort();
      const b = [1, , 3, 4];
      const reversed = b.reverse();
      const c = [0, , 2, 3, 4];
      c.copyWithin(2, 0, 3);
      if (
        a.join(",") !== "1,2,3,," ||
        !a.hasOwnProperty(3) ||
        a.hasOwnProperty(4) ||
        reversed !== b ||
        b.hasOwnProperty(2) ||
        b.join(",") !== "4,3,,1" ||
        c.hasOwnProperty(1) ||
        c.hasOwnProperty(3) ||
        c.join(",") !== "0,,0,,2"
      ) {
        throw new Error("holes");
      }
      Object.freeze(a);
      a.reverse();
    `);
    expect(result.failure?.message).toContain("tla-ts can't reorder an array in place");
  });

  it("holds the holes that new Array makes", async () => {
    const result = await checkModel(`
      let calls = 0;
      const arr = new Array(10);
      arr[1] = undefined;
      arr.forEach(() => {
        calls++;
      });
      const sorted = new Array(3);
      sorted[0] = "b";
      sorted[2] = "a";
      sorted.sort();
      if (
        calls !== 1 ||
        sorted[0] !== "a" ||
        sorted[1] !== "b" ||
        sorted.hasOwnProperty(2) ||
        new Array(2).fill(false).join(",") !== "false,false"
      ) {
        throw new Error("holes");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("iterates an array's keys, values, and entries in a for-of or a spread", async () => {
    const result = await checkModel(`
      const arr = ["a", "b", "c"];
      let text = "";
      for (const [index, value] of arr.entries()) text += index + value;
      let keys = 0;
      for (const key of arr.keys()) keys += key;
      const values = [...arr.values(), "d"];
      if (text !== "0a1b2c" || keys !== 3 || values.join("") !== "abcd") {
        throw new Error("iterated");
      }
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      compile(`
        const arr = ["a"];
        const count = (values: string[]) => values.length;
        const it = arr.values();
        count(arr);
      `),
    ).toThrow("Iterate values() only in a for-of or a spread");
  });

  it("consumes a generator with Iterator.prototype's methods, and closes it", async () => {
    const programs = [
      `
        let calls = 0;
        const iter = g();
        const found = iter.some((value) => {
          calls += 1;
          return value === 2;
        });
        const after = iter.next();
        if (!found || calls !== 2 || !after.done) throw new Error("some");
      `,
      `
        const all = Iterator.prototype.toArray.call(g());
        const sum = g().reduce((total, value) => total + value, 10);
        if (all.join() !== "1,2,3" || sum !== 16) throw new Error("gathered");
      `,
      `
        let seen = "";
        g().forEach((value, index) => {
          seen += value + ":" + index + ",";
        });
        const product = g().reduce((total, value) => total * value);
        if (seen !== "1:0,2:1,3:2," || product !== 6) throw new Error("visited");
      `,
      `
        const thrown = g();
        let caught = "";
        try {
          thrown.every(() => {
            throw new Error("stop");
          });
        } catch (error) {
          caught = (error as Error).message;
        }
        const closed = thrown.next();
        if (caught !== "stop" || !closed.done) throw new Error("closed");
      `,
      `
        const every = g().every((value) => value < 3);
        const first = g().find((value) => value > 1);
        if (every || first !== 2) throw new Error("searched");
      `,
    ];
    for (const program of programs) {
      const result = await checkModel(`
      function* g(): Generator<number> {
        yield 1;
        yield 2;
        yield 3;
      }
        ${program}
      `);
      expect(result.failure).toBeUndefined();
    }
    await expect(
      checkModel(`
        function* g(): Generator<number> {}
        g().reduce((total, value) => total + value);
      `),
    ).rejects.toThrow("TypeError");
  });

  it("steps a generator through Iterator.prototype's map, filter, take, and drop", async () => {
    const programs = [
      `
        let calls = 0;
        const mapped = g().map((value, index) => {
          calls += 1;
          return value * 10 + index;
        });
        const first = mapped.next();
        const callsAfterFirst = calls;
        const second = mapped.next();
        mapped.next();
        const end = mapped.next();
        if (first.value !== 10 || callsAfterFirst !== 1 || second.value !== 21 || !end.done) {
          throw new Error("mapped");
        }
      `,
      `
        const odds = g().filter((value) => value % 2 === 1);
        const first = odds.next();
        const second = odds.next();
        const end = odds.next();
        if (first.value !== 1 || second.value !== 3 || !end.done) throw new Error("filtered");
      `,
      `
        const taken = g().take(2).toArray();
        const dropped = g().drop(2).toArray();
        if (taken.join() !== "1,2" || dropped.join() !== "3") throw new Error("counted");
      `,
      `
        const source = g();
        const limited = source.take(1);
        limited.next();
        const end = limited.next();
        const after = source.next();
        if (!end.done || !after.done) throw new Error("closed");
      `,
    ];
    for (const program of programs) {
      const result = await checkModel(`
      function* g(): Generator<number> {
        yield 1;
        yield 2;
        yield 3;
      }
        ${program}
      `);
      expect(result.failure).toBeUndefined();
    }
  });

  it("steps an array's iterator with next as the array changes", async () => {
    const result = await checkModel(`
      const arr = ["a", "b"];
      const it = arr[Symbol.iterator]();
      const first = it.next();
      const holey = [, "y"];
      const holes = holey.values();
      const hole = holes.next();
      arr.push("d");
      it.next();
      const last = it.next();
      const done = it.next();
      arr.push("e");
      const after = it.next();
      const entries = ["x"].entries();
      const entry = entries.next().value;
      const prototype = Object.getPrototypeOf([].keys());
      if (
        first.value !== "a" ||
        hole.value !== undefined ||
        hole.done ||
        last.value !== "d" ||
        !done.done ||
        !after.done ||
        entry === undefined ||
        entry[0] !== 0 ||
        entry[1] !== "x" ||
        Object.getPrototypeOf(entries) !== prototype ||
        prototype[Symbol.toStringTag] !== "Array Iterator"
      ) {
        throw new Error("stepped");
      }
    `);
    expect(result.failure).toBeUndefined();
    const replaced = await checkModel(`
      Array.prototype[Symbol.iterator] = function () {
        return [9].values();
      } as typeof Array.prototype.values;
      const it = [1][Symbol.iterator]();
      it.next();
    `);
    expect(replaced.failure?.message).toContain(
      "tla-ts can't call Array.prototype.values where a script replaced it",
    );
  });

  it("stops reading a generator's method as a value", () => {
    expect(() =>
      compile(`
        const holder: { [key: string]: unknown } = {};
        function* gen() {}
        const it = gen();
        holder.next = it.next;
      `),
    ).toThrow("tla-ts can't read a generator's next as a value");
  });

  it("reads the built-in prototypes of generator functions and their prototype objects", async () => {
    const source = (check: string) => `
      const holder: { [key: string]: unknown } = {};
      function* gen() {}
      async function* asyncGen() {}
      const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
      const Generator = Object.getPrototypeOf(gen);
      const AsyncIteratorPrototype = Object.getPrototypeOf(
        Object.getPrototypeOf(asyncGen.prototype),
      );
      if (GeneratorFunction.length !== 1 || GeneratorFunction.name !== "GeneratorFunction") {
        throw new Error("constructor");
      }
      if (Generator.constructor !== GeneratorFunction || Generator === Function.prototype) {
        throw new Error("prototype");
      }
      if (Object.getPrototypeOf(gen.prototype) !== Generator.prototype) throw new Error("object");
      if (Generator.prototype.next.length !== 1) throw new Error("next");
      if (Object.getPrototypeOf(Object.getPrototypeOf(asyncGen)) !== Function.prototype) {
        throw new Error("async");
      }
      if (AsyncIteratorPrototype[Symbol.asyncIterator].length !== 0) throw new Error("async");
      ${check}
    `;
    expect((await checkModel(source(""))).failure).toBeUndefined();
    const wrong = await checkModel(
      source(`if (Object.getPrototypeOf(Generator.prototype) === Iterator.prototype) {
        throw new Error("iterator");
      }`),
    );
    expect(wrong.failure?.message).toContain("iterator");
  });

  it("reads the prototypes of the iterators that strings, maps, sets, and regexps make", async () => {
    const result = await checkModel(`
      const holder: { [key: string]: unknown } = {};
      const StringIterator = Object.getPrototypeOf(""[Symbol.iterator]());
      const MapIterator = Object.getPrototypeOf(new Map().values());
      const SetIterator = Object.getPrototypeOf(new Set()[Symbol.iterator]());
      const RegExpStringIterator = Object.getPrototypeOf(/./[Symbol.matchAll]("a"));
      if (
        Object.getPrototypeOf(StringIterator) !== Iterator.prototype ||
        Object.getPrototypeOf(RegExpStringIterator) !== Iterator.prototype ||
        MapIterator === SetIterator ||
        MapIterator !== Object.getPrototypeOf(new Map().entries()) ||
        StringIterator.next.name !== "next" ||
        RegExpStringIterator[Symbol.toStringTag] !== "RegExp String Iterator"
      ) {
        throw new Error("prototypes");
      }
      const length = Object.getOwnPropertyDescriptor(Iterator.prototype[Symbol.iterator], "length");
      if (length === undefined || length.value !== 0 || length.writable) throw new Error("length");
    `);
    expect(result.failure).toBeUndefined();
    const replaced = await checkModel(`
      const holder: { [key: string]: unknown } = {};
      String.prototype[Symbol.iterator] = function () {
        return [1].values();
      } as unknown as (typeof String.prototype)[typeof Symbol.iterator];
      const prototype = Object.getPrototypeOf(""[Symbol.iterator]());
    `);
    expect(replaced.failure?.message).toContain(
      "tla-ts can't make an iterator where a script replaced String.prototype's method",
    );
  });

  it("flattens an array whose elements are all arrays, or none of them", async () => {
    const result = await checkModel(`
      const deep = [[[1]], [[2, 3]]];
      const words = ["a b", "c"].flatMap((text) => text.split(" "));
      const doubled = [1, 2].flatMap((value) => value * 2);
      if (
        [[1, 2], [3], []].flat().join(",") !== "1,2,3" ||
        deep.flat().length !== 2 ||
        deep.flat(Infinity).join(",") !== "1,2,3" ||
        [1, null].flat().length !== 2 ||
        words.join(",") !== "a,b,c" ||
        doubled.join(",") !== "2,4"
      ) {
        throw new Error("flattened");
      }
    `);
    expect(result.failure).toBeUndefined();
    expect(() => compile("const mixed = [1, [2]].flat();")).toThrow(
      "Flatten only an array whose elements are all arrays, or none of them",
    );
    expect(() => compile("const empty = {}; const mixed = [empty, [empty]].flat();")).toThrow(
      "Flatten only an array whose elements are all arrays, or none of them",
    );
  });

  it("reverses a frozen array that reverse doesn't write", async () => {
    const result = await checkModel(`
      const single = [1];
      Object.freeze(single);
      single.reverse();
      const empty = [, ,];
      Object.freeze(empty);
      empty.sort();
      if (single[0] !== 1 || empty.length !== 2) throw new Error("frozen");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs the getters of an object literal that a method makes on each call", async () => {
    const getSource = (expected: string) => `
      const log: string[] = [];
      let step = 0;
      const source = {
        [Symbol.asyncIterator]() {
          return {
            next() {
              step = step + 1;
              return {
                done: step > 1,
                get value() {
                  log.push(\`value\${step}\`);
                  return step;
                },
              };
            },
          };
        },
      };
      async function* gen() {
        yield* source;
      }
      const iter = gen();
      const first = await iter.next();
      const second = await iter.next();
      if (first.value !== 1 || second.done !== true || log.join(",") !== "${expected}") {
        throw new Error("values");
      }
    `;
    expect((await checkModel(getSource("value1,value2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("value1"))).failure?.message).toContain("values");
  });

  it("throws an object on the heap as itself", async () => {
    const getSource = (check: string) => `
      class Poison extends Error {}
      const reason = {};
      const coded = { code: 3 };
      let same = false;
      let isPoison = true;
      let code = 0;
      try {
        throw reason;
      } catch (error) {
        same = error === reason;
        isPoison = error instanceof Poison;
      }
      try {
        throw coded;
      } catch (error) {
        code = (error as { code: number }).code;
      }
      if (${check}) throw new Error("caught");
    `;
    expect(
      (await checkModel(getSource("!same || isPoison || code !== 3"))).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("same"))).failure?.message).toContain("caught");
  });

  it("holds an array that a class's field gives on the heap, which a name can share", async () => {
    const getSource = (check: string) => `
      class Bag {
        items: number[] = [];
        add(value: number) {
          this.items.push(value);
        }
        alias() {
          const held = this.items;
          held.push(9);
        }
        rebuild() {
          const old = this.items;
          this.items = [];
          for (let slot = 0; slot < old.length; slot++) this.items[slot] = old[slot] + 1;
        }
      }
      const first = new Bag();
      const second = new Bag();
      first.add(1);
      first.alias();
      first.rebuild();
      const items = first.items.join(",");
      const other = second.items.length;
      if (${check}) throw new Error("Bag");
    `;
    expect(
      (await checkModel(getSource('items !== "2,10" || other !== 0'))).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource('items === "2,10"'))).failure?.message).toContain("Bag");
    expect((await checkModel(getSource("other === 0"))).failure?.message).toContain("Bag");
  });

  it("calls the function that a class's field holds", async () => {
    const getSource = (check: string) => `
      const getDouble = (key: number) => key * 2;
      function getTriple(key: number) {
        return key * 3;
      }
      class Hasher {
        constructor(private getHash: (key: number) => number) {}
        slot(key: number) {
          return this.getHash(key) & 7;
        }
      }
      const doubled = new Hasher(getDouble);
      const tripled = new Hasher(getTriple);
      const first = doubled.slot(5);
      const second = tripled.slot(5);
      if (${check}) throw new Error("Hasher");
    `;
    expect((await checkModel(getSource("first !== 2 || second !== 7"))).failure).toBeUndefined();
    expect((await checkModel(getSource("first === 2"))).failure?.message).toContain("Hasher");
    expect((await checkModel(getSource("second === 7"))).failure?.message).toContain("Hasher");
  });

  it("lists no own keys of an error", async () => {
    const result = await checkModel(`
      const box = { seen: 0 };
      const error = new TypeError("a");
      const point: { message: string } = { message: "a" };
      if (Object.keys(error).length !== 0 || Object.entries(error).length !== 0) {
        throw new Error("error");
      }
      if (Object.keys(point).length !== 1) throw new Error("point");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where an arguments object outside strict mode maps a parameter that changes", async () => {
    const script = `
      const box = { seen: 0 as unknown };
      function f(a: number) {
        a = 2;
        return arguments[0];
      }
      box.seen = f(1);
      if (box.seen !== 1) throw new Error("mapped");
    `;
    expect(() => compile(script)).toThrow(
      "tla-ts can't follow an arguments object that maps its function's parameters outside strict mode",
    );
    const result = await checkModel(`"use strict";\n${script}`);
    expect(result.failure).toBeUndefined();
  });

  it("ends the program at a promise rejected with no handler once the jobs run out", async () => {
    const result = await checkModel(`
      const box = { seen: 0 };
      Promise.reject(new Error("x")).catch(() => {
        throw new Error("again");
      });
    `);
    expect(result.failure?.message).toContain("A promise rejected with no handler");
    const handled = await checkModel(`
      const box = { seen: 0 };
      const rejected = Promise.reject(new Error("x"));
      Promise.resolve().then(() => rejected.catch(() => {}));
    `);
    expect(handled.failure).toBeUndefined();
  });

  it("returns a new instance from a function or a method", async () => {
    const getSource = (check: string) => `
      class Point {
        constructor(readonly x: number) {}
        static of(x: number) {
          if (x < 0) return new Point(0);
          return new Point(x * 2);
        }
        double() {
          if (this.x === 0) return this;
          return new Point(this.x * 2);
        }
      }
      let made = 0;
      const make = (x: number) => {
        made++;
        return new Point(x);
      };
      const first = Point.of(3);
      const second = first.double();
      const third = make(5);
      const fourth = make(5);
      if (${check}) throw new Error("Point");
    `;
    const passing = "first.x !== 6 || second.x !== 12 || third === fourth || made !== 2";
    expect((await checkModel(getSource(passing))).failure).toBeUndefined();
    expect((await checkModel(getSource("second.x === 12"))).failure?.message).toContain("Point");
    expect((await checkModel(getSource("third !== fourth"))).failure?.message).toContain("Point");
  });

  it("runs a call that a later argument or a receiver makes before the call", async () => {
    const getSource = (check: string) => `
      class Point {
        constructor(readonly x: number) {}
        static of(x: number) {
          return new Point(x * 2);
        }
        add(other: Point) {
          return new Point(this.x + other.x);
        }
      }
      let count = 1;
      const bump = () => {
        count++;
        return Point.of(count * 5);
      };
      const add = (left: number, right: Point) => Point.of(left + right.x);
      const chained = Point.of(3).add(Point.of(1));
      const ordered = add(count, bump());
      if (${check}) throw new Error("Point");
    `;
    expect(
      (await checkModel(getSource("chained.x !== 8 || ordered.x !== 42"))).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("chained.x === 8"))).failure?.message).toContain("Point");
    expect((await checkModel(getSource("ordered.x === 42"))).failure?.message).toContain("Point");
  });

  it("makes the instances that a class's static fields hold", async () => {
    const getSource = (check: string) => `
      class Point {
        static readonly origin = new Point(0);
        static readonly unit = new Point(1);
        constructor(readonly x: number) {}
      }
      if (${check}) throw new Error("Point");
    `;
    const passing = "Point.origin.x !== 0 || Point.unit.x !== 1 || Point.origin === Point.unit";
    expect((await checkModel(getSource(passing))).failure).toBeUndefined();
    expect((await checkModel(getSource("Point.unit.x === 1"))).failure?.message).toContain("Point");
  });

  it("gives undefined for what pop and shift remove from an empty array", async () => {
    const getSource = (check: string) => `
      const stack: number[] = [];
      const top = stack.pop();
      const queue = [1];
      queue.shift();
      queue.shift();
      const head = queue.shift();
      if (${check}) throw new Error("empty");
    `;
    const passing = "top !== undefined || head !== undefined || queue.length !== 0";
    expect((await checkModel(getSource(passing))).failure).toBeUndefined();
    expect((await checkModel(getSource("top === undefined"))).failure?.message).toContain("empty");
  });

  it("assigns what pop removes, as a loop's update does", async () => {
    const getSource = (check: string) => `
      class Counter {
        total = 0;
        drain(start: number) {
          const worklist = [start, start + 1];
          for (let node = worklist.pop(); node !== undefined; node = worklist.pop()) {
            this.total += node;
            if (node > 10) worklist.push(node - 10);
          }
        }
      }
      const counter = new Counter();
      counter.drain(11);
      if (${check}) throw new Error("drained");
    `;
    expect((await checkModel(getSource("counter.total !== 26"))).failure).toBeUndefined();
    expect((await checkModel(getSource("counter.total === 26"))).failure?.message).toContain(
      "drained",
    );
  });

  it("gives each instance that a class's field makes its own arrays on the heap", async () => {
    const getSource = (check: string) => `
      class Table {
        keys: number[] = [];
        alias() {
          const held = this.keys;
          held.push(9);
        }
        rebuild() {
          const old = this.keys;
          this.keys = [];
          for (let slot = 0; slot < old.length; slot++) this.keys[slot] = old[slot] + 1;
        }
      }
      class Owner {
        readonly table = new Table();
      }
      const first = new Owner();
      const second = new Owner();
      first.table.alias();
      first.table.rebuild();
      const keys = first.table.keys.join(",");
      if (${check}) throw new Error("Owner");
    `;
    const passing = 'keys !== "10" || second.table.keys.length !== 0';
    expect((await checkModel(getSource(passing))).failure).toBeUndefined();
    expect((await checkModel(getSource('keys === "10"'))).failure?.message).toContain("Owner");
    expect(
      (await checkModel(getSource("second.table.keys.length === 0"))).failure?.message,
    ).toContain("Owner");
  });

  it("runs as statements a method that changes an array or a map in place", async () => {
    const getSource = (check: string) => `
      class Pool {
        items: number[] = [];
        cache = new Map<number, number>();
        add(value: number) {
          for (let index = 0; index < value; index++) this.items.push(index);
          this.cache.set(value, value);
          return this.items.length;
        }
        alias() {
          const held = this.items;
          held.push(9);
        }
      }
      const pool = new Pool();
      const first = pool.add(2);
      if (${check}) throw new Error("Pool");
    `;
    const passing = "first !== 2 || pool.items.length !== 2 || pool.cache.size !== 1";
    expect((await checkModel(getSource(passing))).failure).toBeUndefined();
    expect((await checkModel(getSource("first === 2"))).failure?.message).toContain("Pool");
    expect((await checkModel(getSource("pool.cache.size === 1"))).failure?.message).toContain(
      "Pool",
    );
  });

  it("follows an array through a method's parameters and the array it returns", async () => {
    const getSource = (check: string) => `
      const shrink = (values: number[], size: number) => {
        while (values.length > size) values.pop();
      };
      class Pool {
        private buffer: number[] = [];
        private held: number[] = [];
        fill(args: number[], start: number) {
          shrink(this.buffer, 0);
          for (let index = start; index < args.length; index++) this.buffer.push(args[index]);
          const used = start > 0 ? this.buffer : args;
          return this.sum(used);
        }
        private sum(values: number[]) {
          let total = 0;
          for (const value of values) total += value;
          return total;
        }
        getDoubled(values: number[]) {
          const doubled: number[] = [];
          this.pushDoubled(values, doubled);
          return doubled;
        }
        private pushDoubled(values: number[], target: number[]) {
          for (const value of values) target.push(value * 2);
        }
        hold(value: number) {
          const held = this.held;
          held.push(value);
          shrink(held, 1);
        }
      }
      const pool = new Pool();
      const doubled = pool.getDoubled([1, 2]);
      const first = pool.fill(doubled, 1);
      const second = pool.fill([4, 5], 0);
      pool.hold(5);
      pool.hold(6);
      if (${check}) throw new Error("Pool");
    `;
    expect((await checkModel(getSource("first !== 4 || second !== 9"))).failure).toBeUndefined();
    expect((await checkModel(getSource("first === 4"))).failure?.message).toContain("Pool");
    expect((await checkModel(getSource("second === 9"))).failure?.message).toContain("Pool");
  });

  it("holds on the heap an array that a built-in makes", async () => {
    const getSource = (check: string) => `
      class Pool {
        private buffer: number[] = [];
        fill(args: number[], start: number) {
          this.buffer.push(start);
          const used = start > 0 ? this.buffer : args;
          let total = 0;
          for (const value of used) total += value;
          return total;
        }
      }
      const pool = new Pool();
      const first = pool.fill([3, 4].map((value) => value + 1), 0);
      const second = pool.fill(Array.from({ length: 2 }, (_, index) => index + 4), 0);
      const third = pool.fill([7, 8].slice(1), 0);
      if (${check}) throw new Error("Pool");
    `;
    const passing = "first !== 9 || second !== 9 || third !== 8";
    expect((await checkModel(getSource(passing))).failure).toBeUndefined();
    expect((await checkModel(getSource("first === 9"))).failure?.message).toContain("Pool");
    expect((await checkModel(getSource("third === 8"))).failure?.message).toContain("Pool");
  });

  it("keeps the arrays of an object that a new takes", async () => {
    const getSource = (check: string) => `
      class Store {
        items: number[] = [];
        alias() {
          const held = this.items;
          held.push(1);
        }
      }
      class Marks {
        constructor(readonly owner: Store) {}
      }
      const store = new Store();
      const marks = new Marks(store);
      store.alias();
      if (${check}) throw new Error("Store");
    `;
    expect((await checkModel(getSource("marks.owner.items.length !== 1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("store.items.length === 1"))).failure?.message).toContain(
      "Store",
    );
  });

  it("constructs the objects that a class's fields make with constructors, in order", async () => {
    const getSource = (expected: string) => `
      class Marks {
        readonly list: number[] = [];
        constructor(readonly owner: Store) {
          this.list.push(owner.base);
          this.list.push(owner.later === undefined ? 1 : 2);
        }
      }
      class Store {
        readonly base = 10;
        readonly marks = new Marks(this);
        readonly later: number | undefined = 5;
        readonly count = this.marks.list.length;
        readonly filled = new Int32Array(2).fill(-1);
        readonly keys: string[];
        constructor() {
          this.keys = Object.keys(this);
        }
      }
      const store = new Store();
      const other = new Store();
      other.marks.list.push(7);
      const result = [
        store.marks.list.join(","),
        store.count,
        store.keys.join(","),
        other.marks.list.length,
        store.marks.owner === store,
        store.filled[1],
      ].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect(
      (await checkModel(getSource("10,1;2;base,marks,later,count,filled,keys;3;true;-1"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(getSource("10,2;2;base,marks,later,count,filled,keys;3;true;-1"))).failure
        ?.message,
    ).toContain("10,1;");
    expect(() =>
      compile(`
        class Marks {
          constructor(readonly owner: Store) {}
        }
        class Store {
          readonly marks = new Marks(this);
        }
        const stores = [new Store()];
      `),
    ).toThrow("Make objects only where a statement always runs");
  });

  it("gives new.target to a constructor whose class's fields run constructors", async () => {
    const getSource = (expected: string) => `
      class Marks {
        constructor(readonly owner: Store) {
          this.owner.log.push("marks");
        }
      }
      class Store {
        log: string[] = [];
        readonly marks = new Marks(this);
        target: unknown;
        constructor() {
          this.target = new.target;
          this.log.push("store");
        }
      }
      const store: Store = Reflect.construct(Store, []);
      const other = new Store();
      const result = [
        store.log.join(","),
        store.target === Store,
        other.marks.owner === other,
      ].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("marks,store;true;true"))).failure).toBeUndefined();
    expect((await checkModel(getSource("store,marks;true;true"))).failure?.message).toContain(
      "marks,store;",
    );
  });

  it("runs first what an expression removes, and what a branch of it changes", async () => {
    const getSource = (expected: string) => `
      class Ids {
        free: number[] = [];
        ids = [0, 0, 0];
        next = 1;
        seen = new Set<number>([1]);
        dropped = 0;
        hashes = new Map<string, number>();
        register(index: number) {
          this.ids[index] = this.free.pop() ?? this.next++;
        }
        release(index: number) {
          this.free.push(this.ids[index]);
        }
        drop(value: number) {
          if (this.seen.delete(value)) this.dropped++;
        }
        take() {
          return this.free.pop();
        }
        pattern(key: string) {
          const existing = this.hashes.get(key);
          if (existing !== undefined) return existing;
          this.hashes.set(key, key.length);
          return key.length;
        }
        find(isUser: boolean, slot: number, key: string) {
          return isUser ? 1 : slot === -1 || slot > 5 ? this.pattern(key) : this.ids[slot];
        }
      }
      const ids = new Ids();
      ids.register(0);
      ids.register(1);
      ids.release(0);
      ids.register(2);
      ids.drop(1);
      ids.drop(1);
      ids.release(1);
      const local = [5];
      let count = 1;
      const first = local.pop() ?? count++;
      const second = local.pop() ?? count++;
      const found = [ids.find(true, 0, "ab"), ids.find(false, -1, "abc"), ids.find(false, 1, "x")];
      const taken = [ids.take(), ids.take()].join(",");
      const result = [
        ids.ids.join(","),
        ids.next,
        ids.dropped,
        taken,
        first,
        second,
        count,
        found.join(","),
        ids.hashes.size,
      ].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("1,2,1;3;1;2,;5;1;2;1,3,2;1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,2,1;3;1;2,;5;2;2;1,3,2;1"))).failure?.message).toContain(
      "1,2,1;3;1;2,;5;1;2;1,3,2;1",
    );
  });

  it("calls a method that changes objects from inside itself", async () => {
    const getSource = (expected: string) => `
      class Tree {
        ids = [-1, -1, -1, -1];
        children = [[1, 2], [3], [], []];
        order: number[] = [];
        next = 0;
        revive(node: number) {
          if (this.ids[node] === -1) this.register(node);
          return node;
        }
        register(node: number) {
          this.ids[node] = this.next++;
          for (const child of this.children[node]) this.order.push(this.revive(child));
        }
      }
      const tree = new Tree();
      const other = new Tree();
      tree.revive(0);
      other.revive(1);
      const result = [
        tree.ids.join(","),
        tree.order.join(","),
        other.ids.join(","),
        other.order.join(","),
      ].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("0,1,3,2;3,1,2;-1,0,-1,1;3"))).failure).toBeUndefined();
    expect((await checkModel(getSource("0,1,3,2;3,1,2;-1,0,-1,2;3"))).failure?.message).toContain(
      "-1,0,-1,1;3",
    );
  });

  it("reads this in an arrow function that a method gives another method", async () => {
    const getSource = (expected: string) => `
      class Table {
        sorts = [5, 6, 7];
        args = [2, 0];
        mapArgs<T>(map: (arg: number) => T) {
          const result: T[] = [];
          for (const arg of this.args) result.push(map(arg));
          return result;
        }
        signature() {
          return this.mapArgs((arg) => this.sorts[arg]).join(",");
        }
      }
      const table = new Table();
      if (table.signature() !== "${expected}") throw new Error(table.signature());
    `;
    expect((await checkModel(getSource("7,5"))).failure).toBeUndefined();
    expect((await checkModel(getSource("7,6"))).failure?.message).toContain("7,5");
  });

  it("runs as statements a method that calls a method that makes objects", async () => {
    const getSource = (expected: number) => `
      class Table {
        sorts = [5, 6, 7];
        saved: number[][] = [];
        signature(args: number[]) {
          const domain = args.map((arg) => this.sorts[arg]);
          return { name: "f", domain };
        }
        hash(args: number[]) {
          const signature = this.signature(args);
          return signature.domain[0] + signature.name.length;
        }
        keep(domain: number[]) {
          this.saved.push(domain);
        }
      }
      const table = new Table();
      table.keep([1]);
      const total = 1 + table.hash([2, 0]);
      if (total !== ${expected}) throw new Error(String(total));
    `;
    expect((await checkModel(getSource(9))).failure).toBeUndefined();
    expect((await checkModel(getSource(8))).failure?.message).toContain("9");
  });

  it("makes the objects of a callback that an array literal's method calls", async () => {
    const getSource = (expected: number) => `
      const size = [1].map((value) => ({ value })).length;
      const items = [1, 2].map((value) => ({ value }));
      if (size !== 1 || items[1].value !== ${expected}) throw new Error("map");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("map");
  });

  it("evaluates a declaration that nothing reads where it runs", async () => {
    await expect(
      checkModel(`
        const fail = (): number => {
          throw new Error("boom");
        };
        const unused = fail();
      `),
    ).rejects.toThrow("boom");
    const inner = await checkModel(`
      const box = { size: 0 };
      const fail = (): number => {
        throw new Error("boom");
      };
      const run = () => {
        const unused = fail();
        box.size = 1;
      };
      run();
    `);
    expect(inner.failure?.message).toContain("boom");
  });

  it("rejects arguments that a new would drop where no constructor runs", async () => {
    expect(() =>
      compile(
        "class Empty {}\nconst box = { size: 0 };\n// @ts-ignore\nconst made = new Empty((box.size = 5));",
      ),
    ).toThrow("spec.ts:4:14 Unsupported arguments to a constructor that runs no code");
    const result = await checkModel(`
      class Empty {}
      // @ts-ignore
      const made = new Empty(1, "x", { a: 1 });
      if (!(made instanceof Empty)) throw new Error("instance");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a derived class's constructor through super", async () => {
    const result = await checkModel(`
      const log = { text: "" };
      class Base {
        declare value: number;
        constructor(value: number) {
          log.text += "B";
          this.value = value;
        }
        read() {
          return this.value;
        }
      }
      class Middle extends Base {}
      class Derived extends Middle {
        declare doubled: number;
        constructor(value: number, extra: number) {
          super(value + extra);
          log.text += "D";
          this.doubled = this.read() * 2;
        }
      }
      const made = new Derived(1, 2);
      if (made.value !== 3 || made.doubled !== 6 || log.text !== "BD") throw new Error("derived");
      const middle = new Middle(5);
      if (middle.value !== 5) throw new Error("implicit");
      if (Object.getPrototypeOf(Derived.prototype) !== Middle.prototype) throw new Error("chain");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("looks up super properties from the base of the class a method is in", async () => {
    const result = await checkModel(`
      const box = { size: 1 };
      class Base {
        method() {
          return 1;
        }
        get x() {
          return 2;
        }
        static make() {
          return 5;
        }
      }
      class Derived extends Base {
        method() {
          return super.method() + super.x * 10;
        }
        static make() {
          return super.make() + 1;
        }
      }
      const made = new Derived();
      if (made.method() !== 21 || Derived.make() !== 6) throw new Error("super");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("rejects a derived constructor that runs code before super", () => {
    expect(() =>
      compile(
        "const box = { size: 1 };\nclass Base {}\nclass Derived extends Base {\n  constructor() {\n    box.size = 2;\n    super();\n  }\n}\nconst made = new Derived();",
      ),
    ).toThrow("Unsupported");
  });

  it("gives what a constructor returns where it returns an object", async () => {
    const result = await checkModel(`
      const box = { size: 1 };
      class Replaced {
        constructor() {
          return box;
        }
      }
      class Kept {
        constructor() {
          return 5;
        }
      }
      class Base {}
      class Derived extends Base {
        constructor() {
          super();
          return true as unknown as Derived;
        }
      }
      const replaced = new Replaced();
      const kept = new Kept();
      if (replaced !== box || !(kept instanceof Kept)) throw new Error("returned");
      let isTypeError = false;
      try {
        const derived = new Derived();
      } catch (error) {
        isTypeError = error instanceof TypeError;
      }
      if (!isTypeError) throw new Error("derived");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a ReferenceError where a class that extends null gives no object", async () => {
    const result = await checkModel(`
      const holder = { made: {} };
      class Returning extends null {
        constructor() {
          const fresh = {};
          holder.made = fresh;
          return fresh as Returning;
        }
      }
      class Empty extends null {
        constructor() {}
      }
      const returned = new Returning();
      if (returned !== holder.made || Object.getPrototypeOf(Empty.prototype) !== null) {
        throw new Error("returned");
      }
      let isReferenceError = false;
      try {
        const empty = new Empty();
      } catch (error) {
        isReferenceError = error instanceof ReferenceError;
      }
      if (!isReferenceError) throw new Error("empty");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("rejects a class whose member names run code", () => {
    expect(() => compile(`let count = 0;\nclass Counter {\n  [count++]() {}\n}`)).toThrow(
      "spec.ts:3:4 Unsupported expression: count++",
    );
  });

  it("rejects a class that runs code as a spec loads", () => {
    expect(() =>
      compile(
        `let count = 0;\nclass Counter {\n  static {\n    count++;\n  }\n}\nexport const step = () => { count++; };`,
      ),
    ).toThrow("spec.ts:2:1 Unsupported statement");
  });

  it("reads a script's var as undefined before its declaration runs", async () => {
    const result = await check(
      compile(
        `const read = () => later;\nconst early = read();\nvar later: unknown = 1;\nif (early !== undefined || later !== 1) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("gives the result of a generator method's first next", async () => {
    const result = await check(
      compile(
        `let count = 0;\nclass Counter {\n  *step() { count += 1; yield 7; count += 100; }\n  *answer() { return 42; }\n}\nconst counter = new Counter();\nconst yielded = counter.step().next();\nconst check = (actual: unknown, expected: unknown) => { if (actual !== expected) throw new Error("missed"); };\ncheck(counter.answer().next().value, 42);\nif (yielded.value !== 7 || yielded.done !== false || count !== 1) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("gives a generator's first result as a record where a script makes no objects", async () => {
    const result = await check(
      compile(
        `function* double(value: number) { const doubled = value * 2; yield doubled; }\nconst first = double(4).next();\nif (first.value !== 8 || first.done !== false) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("runs a generator that a variable holds, but not on a call alone", async () => {
    const result = await check(
      compile(
        `let count = 0;\nconst read = () => count;\nvar step: (by: number) => Generator<number>;\nstep = function* (by: number) { count += by; const seen = count; yield seen; };\nconst first = step(5).next();\nif (first.value !== 5 || read() !== 5) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    const alone = await check(
      compile(
        `let count = 0;\nconst read = () => count;\nvar step: () => Generator<number>;\nstep = function* () { count += 1; };\nstep();\nif (read() !== 0) throw new Error("ran");`,
      ),
    );
    expect(alone.failure).toBeUndefined();
  });

  it("resumes a generator through next and return", async () => {
    const result = await check(
      compile(
        `const o = {};\nlet log = "";\nconst read = (): string => log;\nfunction* g(start: number) {\n  log += "a" + start;\n  yield 1;\n  log += "b";\n  yield 2;\n  log += "c";\n  return 3;\n}\nconst iter = g(5);\nif (read() !== "") throw new Error("ran early");\nconst first = iter.next();\nif (first.value !== 1 || first.done !== false || read() !== "a5") throw new Error("first");\nconst second = iter.next();\nif (second.value !== 2 || read() !== "a5b") throw new Error("second");\nconst third = iter.next();\nif (third.value !== 3 || third.done !== true || read() !== "a5bc") throw new Error("third");\nconst fourth = iter.next();\nif (fourth.done !== true) throw new Error("fourth");\nconst other = g(7);\nconst closed = other.return(9);\nif (closed.value !== 9 || closed.done !== true || read() !== "a5bc") throw new Error("return");\nconst after = other.next();\nif (after.done !== true) throw new Error("after return");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    const failed = await check(
      compile(
        `const o = {};\nlet log = "";\nconst read = (): string => log;\nfunction* g(start: number) {\n  log += "a" + start;\n  yield 1;\n  log += "b";\n  yield 2;\n  log += "c";\n  return 3;\n}\nconst iter = g(5);\nif (read() !== "") throw new Error("ran early");\nconst first = iter.next();\nif (first.value !== 1 || first.done !== false || read() !== "a5") throw new Error("first");\nconst second = iter.next();\nif (second.value !== 3 || read() !== "a5b") throw new Error("second");\nconst third = iter.next();\nif (third.value !== 3 || third.done !== true || read() !== "a5bc") throw new Error("third");\nconst fourth = iter.next();\nif (fourth.done !== true) throw new Error("fourth");\nconst other = g(7);\nconst closed = other.return(9);\nif (closed.value !== 9 || closed.done !== true || read() !== "a5bc") throw new Error("return");\nconst after = other.next();\nif (after.done !== true) throw new Error("after return");`,
      ),
    );
    expect(failed.failure?.message).toContain("second");
  });

  it("destructures arrays from a generator", async () => {
    const result = await check(
      compile(
        `const o = {};\nlet first = 0;\nlet second = 0;\nconst read = (): number => first * 10 + second;\nfunction* g() {\n  first += 1;\n  yield 1;\n  second += 1;\n  yield 2;\n}\nconst [a] = g();\nif (a !== 1 || read() !== 10) throw new Error("close");\nfirst = 0;\nsecond = 0;\nconst [b, c, d, e = 7] = g();\nif (b !== 1 || c !== 2 || d !== undefined || e !== 7 || read() !== 11) throw new Error("drain");\nlet x = 0;\nconst iter = g();\nconst [y, ...rest] = iter;\n[x] = g();\nif (y !== 1 || x !== 1 || rest.length !== 1 || rest[0] !== 2) throw new Error("rest");\nlet calls = 0;\nconst f = ([p, q]: Iterable<number>) => {\n  calls += p as number;\n};\nf(g());\nif (calls !== 1) throw new Error("param");\nconst [] = g();`,
      ),
    );
    expect(result.failure).toBeUndefined();
    expect(() =>
      compile(
        `const object = {};\nfunction* g() {\n  yield 1;\n}\nconst iter = g();\nconst values = [iter];`,
      ),
    ).toThrow("tla-ts can't follow a generator here");
  });

  it("destructures arrays from a generator that a default makes", async () => {
    const result = await check(
      compile(
        `const object = {};\nlet first = 0;\nlet second = 0;\nlet taken = 0;\nfunction* g() {\n  first += 1;\n  yield 1;\n  second += 1;\n  yield 2;\n}\nfunction take([[value] = g()]: Iterable<number>[]) {\n  taken = value;\n}\ntake([]);\nif (taken !== 1 || first !== 1 || second !== 0) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("destructures arrays from a generator that a default's function returns", async () => {
    const getSource = (check: string) => `
      const object = {};
      let initCount = 0;
      let iterCount = 0;
      const iter = (function* () {
        iterCount += 1;
        yield 5;
        iterCount += 1;
        yield 6;
      })();
      function* take([[, second] = (function () {
        initCount += 1;
        return iter;
      })()]: Generator<number, void, unknown>[]) {
        if (${check}) throw new Error("taken");
      }
      take([]).next();
    `;
    expect(
      (await checkModel(getSource("second !== 6 || initCount !== 1 || iterCount !== 2"))).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("iterCount !== 1"))).failure).toBeDefined();
  });

  it("passes on the results of an object's iterator through yield*", async () => {
    const getSource = (check: string) => `
      const results: { value: number; done?: boolean }[] = [{ value: 1 }, { value: 8, done: true }];
      let index = 0;
      let caught = "";
      const iterable = {
        [Symbol.iterator]: function () {
          return {
            next: function () {
              const result = results[index];
              index += 1;
              if (result === undefined) throw new RangeError("drained");
              return result;
            },
          };
        },
      };
      function* g() {
        yield* iterable;
        try {
          yield* iterable;
        } catch (error) {
          caught = error instanceof RangeError ? "range" : "other";
        }
      }
      const iter = g();
      const first = iter.next();
      const second = iter.next();
      if (${check}) throw new Error("delegated");
    `;
    expect(
      (
        await checkModel(
          getSource(
            'first.value !== 1 || first.done !== undefined || second.done !== true || caught !== "range"',
          ),
        )
      ).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("first.done !== false"))).failure).toBeDefined();
  });

  it("assigns the rest of an array to a rest element", async () => {
    const getSource = (check: string) => `
      const object = {};
      let first = 0;
      let rest: number[] = [];
      let x: number | undefined = 0;
      let y: number | undefined = 0;
      [first, ...rest] = [1, 2, 3];
      for ([...[x, y]] of [[4]]) {
        if (${check}) throw new Error("rest");
      }
    `;
    expect(
      (
        await checkModel(
          getSource(
            "first !== 1 || rest.length !== 2 || rest[1] !== 3 || x !== 4 || y !== undefined",
          ),
        )
      ).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("rest.length !== 3"))).failure).toBeDefined();
    expect(() =>
      compile(
        `const object = {};\nlet rest: number[] = [];\nconst source = [1];\n[...rest] = source;\nif (rest === source) throw new Error("same");`,
      ),
    ).toThrow("tla-ts can't assign a rest element to an array that a script reads as an object");
  });

  it("runs a for-of pattern's default call only where its element or property is undefined", async () => {
    const getSource = (check: string) => `
      let count = 0;
      const counter = (): number => {
        count += 1;
        return count * 10;
      };
      let seen = "";
      for (const [w = counter(), x = counter(), y = counter()] of [
        [undefined, 5, undefined] as (number | undefined)[],
        [1, undefined, 2],
      ]) {
        seen = seen + \`\${w},\${x},\${y},\${count};\`;
      }
      if (seen !== "${check}") throw new Error(seen);
    `;
    expect((await checkModel(getSource("10,5,20,2;1,30,2,3;"))).failure).toBeUndefined();
    expect((await checkModel(getSource("10,5,20,2;1,20,2,3;"))).failure).toBeDefined();
    const getObjectSource = (check: string) => `
      const object = {};
      let count = 0;
      const counter = (): number => {
        count += 1;
        return count * 10;
      };
      let seen = "";
      const items: { s?: number; u?: number }[] = [{ s: 1, u: 0 }, { u: 3 }, {}];
      for (const { s: t = counter(), u = counter() } of items) {
        seen = seen + \`\${t},\${u},\${count};\`;
      }
      if (seen !== "${check}") throw new Error(seen);
    `;
    expect((await checkModel(getObjectSource("1,0,0;10,3,1;20,30,3;"))).failure).toBeUndefined();
    expect((await checkModel(getObjectSource("1,0,0;10,3,1;20,20,3;"))).failure).toBeDefined();
    const getGeneratorSource = (check: string) => `
      let first = 0;
      let second = 0;
      function* g() {
        first += 1;
        yield 4;
        second += 1;
        yield 5;
      }
      let seen = "";
      const items: number[][][] = [[], [[7]]];
      for (const [[a, b = -1] = g()] of items) {
        seen = seen + \`\${a},\${b},\${first},\${second};\`;
      }
      if (seen !== "${check}") throw new Error(seen);
    `;
    expect((await checkModel(getGeneratorSource("4,5,1,1;7,-1,1,1;"))).failure).toBeUndefined();
    expect((await checkModel(getGeneratorSource("4,5,1,0;7,-1,1,1;"))).failure).toBeDefined();
  });

  it("assigns an object's other properties to a rest property", async () => {
    const getSource = (check: string) => `
      let rest: { [key: string]: number } = {};
      let a = 0;
      const source: { a: number; b: number; c: number } = { a: 1, b: 2, c: 3 };
      ({ a, ...rest } = source);
      const keys = Object.keys(rest);
      if (${check}) throw new Error(keys.join(","));
    `;
    expect(
      (
        await checkModel(
          getSource(
            "a !== 1 || keys.length !== 2 || rest.b !== 2 || rest.c !== 3 || rest === source",
          ),
        )
      ).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("keys.length !== 3"))).failure).toBeDefined();
  });

  it("iterates with for await the async generator that a call makes", async () => {
    const getSource = (check: string) => `
      let made = 0;
      async function* g() {
        made += 1;
        yield 1;
        yield 2;
      }
      let sum = 0;
      const run = async () => {
        for await (const value of g()) {
          sum = sum * 10 + value;
        }
      };
      await run();
      if (${check}) throw new Error("for await");
    `;
    expect((await checkModel(getSource("sum !== 12 || made !== 1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("sum !== 21"))).failure).toBeDefined();
  });

  it("yields what a call gives as the generator resumes", async () => {
    const getSource = (check: string) => `
      let count = 0;
      const bump = (step: number): number => {
        count += step;
        return count;
      };
      function* gen() {
        yield bump(1);
        yield bump(10);
      }
      const iter = gen();
      const first = iter.next();
      const atFirst = count;
      const second = iter.next();
      if (${check}) throw new Error("yield");
    `;
    expect(
      (await checkModel(getSource("first.value !== 1 || atFirst !== 1 || second.value !== 11")))
        .failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("atFirst !== 11"))).failure).toBeDefined();
  });

  it("makes a new function object each time a function makes one as a property's value", async () => {
    const getSource = (comparison: string) => `
      const make = function () {
        return {
          next: function () {
            return 1;
          },
        };
      };
      const first = make();
      const second = make();
      if (first.next ${comparison} second.next) throw new Error("identity");
      if (typeof first.next !== "function") throw new Error("typeof");
    `;
    expect((await checkModel(getSource("==="))).failure).toBeUndefined();
    expect((await checkModel(getSource("!=="))).failure?.message).toContain("identity");
  });

  it("destructures an object through the iterator that its Symbol.iterator method makes", async () => {
    const getSource = (closedAfterLoop: number) => `
      let closed = 0;
      let steps = 0;
      const read = (): number => closed * 10 + steps;
      const iterable = {
        [Symbol.iterator]: function () {
          return {
            next: function () {
              steps += 1;
              return { value: steps * 10, done: steps > 3 };
            },
            return: function () {
              closed += 1;
              return { value: 0, done: true };
            },
          };
        },
      };
      const [first, , third] = iterable;
      if (first !== 10 || third !== 30 || read() !== 13) throw new Error("close");
      steps = 0;
      const [head, ...rest] = iterable;
      if (head !== 10 || rest.length !== 2 || rest[1] !== 30 || read() !== 14) throw new Error("rest");
      for (let round = 0; round < 2; round += 1) {
        steps = 0;
        const [value] = iterable;
      }
      if (read() !== ${closedAfterLoop}) throw new Error("loop");
      let taken = 0;
      function take([value] = iterable) {
        taken = value;
      }
      steps = 0;
      take();
      for (const [value] of [iterable]) {
        taken += value;
      }
      if (taken !== 30 || read() !== 52) throw new Error("taken");
    `;
    expect((await checkModel(getSource(31))).failure).toBeUndefined();
    expect((await checkModel(getSource(11))).failure?.message).toContain("loop");
  });

  it("throws the TypeErrors of an iterator that breaks the protocol", async () => {
    const result = await checkModel(`
      let log = "";
      const unstepped: { [key: symbol]: unknown } = {};
      unstepped[Symbol.iterator] = function () {
        return {
          next: function () {
            return 5;
          },
        };
      };
      const unclosed: { [key: symbol]: unknown } = {};
      unclosed[Symbol.iterator] = function () {
        return {
          next: function () {
            return { value: 1, done: false };
          },
          return: function () {
            return 3;
          },
        };
      };
      try {
        // @ts-ignore
        const [value] = unstepped;
      } catch (error) {
        log = log + (error instanceof TypeError ? "n" : "N");
      }
      try {
        // @ts-ignore
        const [value] = unclosed;
      } catch (error) {
        log = log + (error instanceof TypeError ? "c" : "C");
      }
      try {
        // @ts-ignore
        const [value] = {};
      } catch (error) {
        log = log + (error instanceof TypeError ? "i" : "I");
      }
      if (log !== "nci") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("rejects a pattern with defaults that destructures an object through its iterator", () => {
    expect(() =>
      compile(`
        const iterable = {
          [Symbol.iterator]: function () {
            return {
              next: function () {
                return { value: 1, done: false };
              },
            };
          },
        };
        const [value = 2] = iterable;
      `),
    ).toThrow("tla-ts can't destructure this object through its iterator");
  });

  it("binds a generator's parameter through an iterator as the call makes the generator", async () => {
    const getSource = (closedAtCall: number) => `
      let closed = 0;
      let seen: number = 0;
      const iterable = {
        [Symbol.iterator]: function () {
          return {
            next: function () {
              return { value: 7, done: false };
            },
            return: function () {
              closed += 1;
              return { value: 0, done: true };
            },
          };
        },
      };
      function* make([value] = iterable) {
        seen = value;
      }
      async function* later([value] = iterable) {}
      const made = make();
      const other = later();
      const read = (): number => seen;
      if (closed !== ${closedAtCall} || read() !== 0) throw new Error("call");
      made.next();
      if (read() !== 7) throw new Error("body");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(0))).failure?.message).toContain("call");
  });

  it("makes a method object each time a function's object literal runs", async () => {
    const getSource = (second: number) => `
      let closed = 0;
      let steps = 0;
      const iterable = {
        [Symbol.iterator]() {
          return {
            next() {
              steps += 1;
              return { value: steps * 10, done: false };
            },
            return() {
              closed += 1;
              return { value: 0, done: true };
            },
          };
        },
      };
      const [first, second] = iterable;
      if (first !== 10 || second !== ${second} || closed !== 1) throw new Error("pattern");
      const make = () => ({
        run() {
          return 1;
        },
      });
      const made = make();
      const other = make();
      if (made.run === other.run || typeof made.run !== "function") throw new Error("fresh");
      let caught = false;
      try {
        // @ts-ignore
        new made.run();
      } catch (error) {
        caught = error instanceof TypeError;
      }
      if (!caught) throw new Error("construct");
    `;
    expect((await checkModel(getSource(20))).failure).toBeUndefined();
    expect((await checkModel(getSource(30))).failure?.message).toContain("pattern");
  });

  it("returns an object whose functions call what they only call when they run", async () => {
    const getSource = (caughtType: string) => `
      const iterable: { [key: symbol]: unknown } = {};
      iterable[Symbol.iterator] = function () {
        return {
          next: function () {
            throw new RangeError("step");
          },
        };
      };
      // @ts-ignore
      function take([value] = iterable) {}
      let caught = false;
      try {
        take();
      } catch (error) {
        caught = error instanceof ${caughtType};
      }
      if (!caught) throw new Error("caught");
    `;
    expect((await checkModel(getSource("RangeError"))).failure).toBeUndefined();
    expect((await checkModel(getSource("TypeError"))).failure?.message).toContain("caught");
  });

  it("iterates an object through its iterator, and closes it where the loop leaves early", async () => {
    const getSource = (closedAfterBreak: number) => `
      let closed: number = 0;
      let steps = 0;
      const read = (): number => closed;
      const iterable = {
        [Symbol.iterator]: function () {
          steps = 0;
          return {
            next: function () {
              steps += 1;
              return { value: steps * 2, done: steps > 3 };
            },
            return: function () {
              closed += 1;
              return { value: 0, done: true };
            },
          };
        },
      };
      let sum = 0;
      for (const value of iterable) {
        sum += value;
      }
      if (sum !== 12 || read() !== 0) throw new Error("all");
      for (const value of iterable) {
        if (value === 4) break;
      }
      if (read() !== ${closedAfterBreak}) throw new Error("break");
      let caught = false;
      try {
        for (const value of iterable) {
          throw new RangeError("body");
        }
      } catch (error) {
        caught = error instanceof RangeError;
      }
      if (!caught || read() !== 2) throw new Error("throw");
    `;
    expect((await checkModel(getSource(1))).failure).toBeUndefined();
    expect((await checkModel(getSource(0))).failure?.message).toContain("break");
  });

  it("runs the spreads of a statement through the iterators of the objects they spread", async () => {
    const getSource = (stepsAfter: number) => `
      let steps = 0;
      const counted = {
        [Symbol.iterator]: function () {
          return {
            next: function () {
              steps += 1;
              return { value: steps, done: steps > 2 };
            },
          };
        },
      };
      const failing = {
        [Symbol.iterator]: function () {
          return {
            next: function () {
              throw new RangeError("step");
            },
          };
        },
      };
      [0, ...counted];
      const read = (): number => steps;
      if (read() !== ${stepsAfter}) throw new Error("steps");
      let caught = false;
      try {
        // @ts-ignore
        new function () {}(...failing);
      } catch (error) {
        caught = error instanceof RangeError;
      }
      if (!caught) throw new Error("caught");
    `;
    expect((await checkModel(getSource(3))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("steps");
  });

  it("rejects an array pattern whose value's type doesn't tell an array from an object", () => {
    expect(() =>
      compile(`
        const box = { size: 1 };
        const held: any = box;
        const [value] = held;
      `),
    ).toThrow("spec.ts:4:15 Give this pattern's value an array type");
  });

  it("resumes generators that an untyped variable holds", async () => {
    const result = await check(
      compile(
        `const object = {};\nfunction* numbers() {\n  yield 1;\n}\nfunction* words() {\n  yield "a";\n}\nlet iter;\niter = numbers();\nconst first = iter.next();\niter = words();\nconst second = iter.next();\nconst third = iter.next();\nif (first.value !== 1 || second.value !== "a" || third.done !== true) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("reads strings through their search, slice, and trim methods", async () => {
    const result = await check(
      compile(
        `const text: string = " abcab\\u00A0";\nlet found = 0;\nexport const step = () => {\n  if (text.trim() !== "abcab" || text.charAt(99) !== "" || text.at(-2) !== "b") throw new Error("missed");\n  if (text.slice(-3, -1) !== "ab" || text.substring(4, 1) !== "abc") throw new Error("missed");\n  if (!text.startsWith("b", 2) || !text.endsWith("ab", 6) || text.includes("ba")) throw new Error("missed");\n  found = text.indexOf("b", 3) * 10 + text.lastIndexOf("b", 4);\n};\nexport const invariant = () => found === 0 || found === 52;`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("calls a string method on a value that it converts to a string", async () => {
    const result = await check(
      compile(
        `const flag: boolean = true;\nif (String.prototype.slice.call(123, 1) !== "23" || String.prototype.trim.call(flag) !== "true") throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    await expect(
      check(
        compile(
          `const value: number | undefined = undefined;\nif (String.prototype.trim.call(value) === "") throw new Error("empty");`,
        ),
      ),
    ).rejects.toThrow("tla-ts can't throw the TypeError of a string method");
  });

  it("reads an array's constructor from Array.prototype", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      const items = [1, 2];
      const parts = "a b".split(" ");
      if (items.constructor !== Array || parts.constructor !== Array) throw new Error("array");
      Array.prototype.constructor = Object;
      if (items.constructor !== Object) throw new Error("replaced");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("makes a string of character codes", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      const code: number = 66;
      if (String.fromCharCode() !== "" || String.fromCharCode(65, code, 65601, -65471) !== "ABAA") throw new Error("char");
      if (String.fromCharCode(NaN).charCodeAt(0) !== 0) throw new Error("special");
      if (String.fromCodePoint(65, 90, -0) !== "AZ\\x00") throw new Error("point");
      if (String.fromCharCode(65.7, -65470.5) !== "AB") throw new Error("fraction");
    `);
    expect(result.failure).toBeUndefined();
    const fraction = (expected: string) =>
      `const box = { size: 0 };\nif (String.fromCharCode(65.7, -65470.5) !== "${expected}") throw new Error("fraction");`;
    expect((await checkModel(fraction("BB"))).failure?.message).toContain("fraction");
    const fractionPoint = await checkModel(
      `const box = { size: 0 };\nconst made = String.fromCodePoint(65.5);`,
    );
    expect(fractionPoint.failure?.message).toContain(
      "tla-ts can't throw the RangeError of String.fromCodePoint",
    );
    const outside = await checkModel(
      `const box = { size: 0 };\nconst code: number = -1;\nconst made = String.fromCodePoint(code);`,
    );
    expect(outside.failure?.message).toContain(
      "tla-ts can't throw the RangeError of String.fromCodePoint",
    );
  });

  it("stops where a branch that runs converts a function to a string", async () => {
    const source = (constructor: string) =>
      `const text = new String("ab");\nif (text.constructor !== ${constructor}) throw new Error("constructor " + text.constructor);`;
    expect((await checkModel(source("String"))).failure).toBeUndefined();
    expect((await checkModel(source("Number"))).failure?.message).toContain(
      "tla-ts can't convert a function to a string",
    );
  });

  it("repeats, concatenates, normalizes, and compares strings of ASCII", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      const text: string = "abc";
      if (text.repeat(3) !== "abcabcabc" || text.repeat(NaN) !== "" || ".".repeat(1000).length !== 1000) throw new Error("repeat");
      if (text.concat() !== "abc" || text.concat("d", "e") !== "abcde") throw new Error("concat");
      if (!text.isWellFormed() || text.toWellFormed() !== "abc" || text.normalize("NFKD") !== "abc") throw new Error("normalize");
      if (text.localeCompare("abc") !== 0) throw new Error("locale");
    `);
    expect(result.failure).toBeUndefined();
    const negative = await checkModel(
      `const box = { size: 0 };\nconst count: number = -1;\nconst made = "a".repeat(count);`,
    );
    expect(negative.failure?.message).toContain("tla-ts can't throw the RangeError of repeat");
  });

  it("splits and replaces at a string", async () => {
    const result = await checkModel(`
      const text: string = "one two  three";
      const pieces = text.split(" ");
      if (pieces.length !== 4 || pieces[2] !== "" || pieces[3] !== "three") throw new Error("split");
      const limited = text.split(" ", 2);
      const chars = "abc".split("");
      if (limited.length !== 2 || limited[1] !== "two" || chars[2] !== "c") throw new Error("limit");
      if ("a,b".split(",", 0).length !== 0 || "".split("x")[0] !== "") throw new Error("edge");
      const swapped = "a-b-c".replace("-", "[$&|$\`|$'|$$|$1]");
      if (swapped !== "a[-|a|b-c|$|$1]b-c") throw new Error(swapped);
      if ("ab".replaceAll("", "_") !== "_a_b_" || "a-b-c".replaceAll("-", "+") !== "a+b+c") throw new Error("all");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("truncates a fraction that split takes as its limit, at a string or a regexp", async () => {
    const split = (expected: number) => `
      const box = { size: 0 };
      const text = "a,b,c";
      if (text.split(",", 2.5).length !== 2 || text.split(",", -0.5).length !== 0) throw new Error("limit");
      if (text.split(",", -1.5).length !== ${expected}) throw new Error("limit");
      if ("a1b2c".split(/\\d/, 1.5).length !== 1 || "a1b2c".split(/\\d/, -1.5).length !== 3) throw new Error("regexp");
    `;
    expect((await checkModel(split(3))).failure).toBeUndefined();
    expect((await checkModel(split(2))).failure?.message).toContain("limit");
  });

  it("encodes and decodes URIs of ASCII", async () => {
    const result = await checkModel(`
      if (encodeURIComponent("a b&c/d") !== "a%20b%26c%2Fd") throw new Error("component");
      if (encodeURI("a b&c/d#?") !== "a%20b&c/d#?") throw new Error("encode");
      if (decodeURI("%3B%41%2f") !== "%3BA%2f") throw new Error("decode");
      if (decodeURIComponent("%3B%41%2f") !== ";A/") throw new Error("decode component");
      const thrown: string[] = [];
      for (const text of ["%", "%4", "%G1", "%C0%80", "%ED%A0%80", "%F4%90%80%80", "%E0%A0"]) {
        try {
          decodeURIComponent(text);
        } catch (error) {
          if (error instanceof URIError) thrown.push(text);
        }
      }
      if (thrown.length !== 7) throw new Error("thrown " + thrown.length);
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`if (decodeURIComponent("%41%42") !== "AC") throw new Error("wrong");`),
    ).rejects.toThrow("wrong");
    await expect(
      checkModel(`if (decodeURI("%C3%A9") === "") throw new Error("never");`),
    ).rejects.toThrow("tla-ts can't make a character outside ASCII");
  });

  it("takes a substring by its length", async () => {
    const result = await checkModel(`
      const text: string = "abcdef";
      if (text.substr(1, 2) !== "bc" || text.substr(-2) !== "ef" || text.substr(-10, 3) !== "abc") {
        throw new Error("substr");
      }
      if (text.substr(4, 10) !== "ef" || text.substr(2, -1) !== "" || text.substr(0, undefined) !== text) {
        throw new Error("length");
      }
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`if ("abcdef".substr(-2, 1) !== "ef") throw new Error("wrong");`),
    ).rejects.toThrow("wrong");
  });

  it("wraps a string in the element of an HTML method", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      if ("_".big() !== "<big>_</big>" || "<".bold() !== "<b><</b>" || "x".fixed() !== "<tt>x</tt>") {
        throw new Error("html");
      }
      if (String.prototype.sup.call(42) !== "<sup>42</sup>") throw new Error("call");
      let isThrown = false;
      try {
        String.prototype.sub.call(undefined);
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown) throw new Error("TypeError");
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`if ("_".italics() !== "<italics>_</italics>") throw new Error("wrong");`),
    ).rejects.toThrow("wrong");
  });

  it("joins the raw text of String.raw's template", async () => {
    const result = await checkModel(`
      const count = 2;
      if (String.raw\`a\\n\${count}b\${"c"}\\u0065\` !== "a\\\\n2bc\\\\u0065") throw new Error("raw");
      if (String.raw\`\` !== "") throw new Error("empty");
      if (String.raw\`a\r\nb\rc\` !== "a\\nb\\nc") throw new Error("line");
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`if (String.raw\`a\\n\` !== "a\\n") throw new Error("wrong");`),
    ).rejects.toThrow("wrong");
  });

  it("converts a value that may be a number or undefined to a string", async () => {
    const result = await checkModel(`
      const found = "Boston, MA 02134".match(/\\d{5}/);
      if (found === null || "at " + found.index !== "at 11") throw new Error("index");
      const values: (number | undefined)[] = [1, undefined];
      if (\`\${values[0]},\${values[1]}\` !== "1,undefined") throw new Error("template");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts the value that a String.prototype method reads through call", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      const trimEnd = String.prototype.trimEnd;
      let caught = 0;
      try {
        trimEnd.call(null);
      } catch (error) {
        if (error instanceof TypeError) caught += 1;
      }
      const empty = { toString: undefined, valueOf: undefined };
      try {
        // @ts-ignore
        String.prototype.trimStart.call(empty);
      } catch (error) {
        if (error instanceof TypeError) caught += 1;
      }
      if (caught !== 2) throw new Error("caught");
    `);
    expect(result.failure).toBeUndefined();
    const converted = await checkModel(`
      const log = { text: "" };
      const trimEnd = String.prototype.trimEnd;
      const value = {
        toString() {
          log.text += "t";
          return " ab ";
        },
        valueOf() {
          log.text += "v";
          return 3;
        },
      };
      const trimmed = trimEnd.call(value);
      const described = String.prototype.trim.call({});
      if (trimmed !== " ab" || log.text !== "t") throw new Error("converted");
      if (described !== "[object Object]") throw new Error("object");
    `);
    expect(converted.failure).toBeUndefined();
    const nullish = await checkModel(
      `const box = { size: 0 };\nconst value: number | undefined = undefined;\nconst trimmed = String.prototype.trim.call(value);`,
    );
    expect(nullish.failure?.message).toContain("TypeError");
  });

  it("throws the TypeError of a new of a built-in method that a declaration holds", async () => {
    const result = await checkModel(`
      const box = { size: 0 };
      const factory = String.prototype.charAt;
      let caught = false;
      try {
        // @ts-ignore
        const made = new factory();
      } catch (error) {
        caught = error instanceof TypeError;
      }
      if (!caught) throw new Error("constructed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("writes numbers in a radix", async () => {
    const result = await check(
      compile(
        `const value: number = -255;\nif (value.toString(16) !== "-ff" || (35).toString(36) !== "z" || Number.prototype.toString.call(value) !== "-255") throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    await expect(
      check(
        compile(
          `const value: number = 1;\nif (value.toString(37) === "") throw new Error("empty");`,
        ),
      ),
    ).rejects.toThrow("tla-ts can't throw the RangeError of a radix outside 2 to 36");
  });

  it("tells a value's kind through Object.prototype.toString", async () => {
    const result = await check(
      compile(
        `const object = {};\nconst list = [1];\nconst made: object = Object.create(Math);\nconst kinds = [Object.prototype.toString.call(object), Object.prototype.toString.call(list), Object.prototype.toString.call(made), Object.prototype.toString.call(Math), Object.prototype.toString.call(Array.prototype), Object.prototype.toString.call(new TypeError("x")), Object.prototype.toString.call(undefined), Object.prototype.toString.call(1)];\nif (kinds.join() !== "[object Object],[object Array],[object Math],[object Math],[object Array],[object Error],[object Undefined],[object Number]") throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("tests numbers through the global isNaN and isFinite", async () => {
    const result = await check(
      compile(
        `const object = {};\nconst values: number[] = [1, NaN, -Infinity];\nif (isNaN(values[0]) || !isNaN(values[1]) || !isFinite(values[0]) || isFinite(values[2])) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("names the functions that a parameter's defaults make", async () => {
    const result = await check(
      compile(
        `let names = "";\nlet lengths = 0;\nfunction f([arrow = () => {}, fn = function (a: number, b = 1) {}] = []) {\n  names = arrow.name + " " + fn.name;\n  lengths = arrow.length * 10 + fn.length;\n  if (typeof arrow !== "function" || Object.getOwnPropertyNames(arrow).length !== 2) throw new Error("missed");\n}\nf();\nif (names !== "arrow fn" || lengths !== 1) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("names the generator functions that a parameter's defaults make", async () => {
    const result = await check(
      compile(
        `let names = "";\nfunction f([gen = function* () {}, named = function* inner(a: number) {}] = []) {\n  names = gen.name + " " + named.name + " " + named.length;\n  if (typeof gen !== "function" || Object.getOwnPropertyNames(gen).join() !== "length,name,prototype") throw new Error("missed");\n}\nf();\nif (names !== "gen inner 1") throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("reads the constructor of an error that a script's class makes", async () => {
    const result = await check(
      compile(
        `const object = {};\nclass TestError extends Error {}\nclass OtherError extends Error {}\nlet matched = 0;\ntry {\n  throw new TestError("failed");\n} catch (error) {\n  if (typeof error === "object" && error !== null && error.constructor === TestError) matched += 1;\n  if (typeof error === "object" && error !== null && error.constructor === OtherError) matched += 10;\n}\nif (matched !== 1) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("makes errors of a class expression that a const holds", async () => {
    const result = await check(
      compile(
        `const Subclass = class extends TypeError {};\nconst Other = class extends TypeError {};\nconst sub = new Subclass("x");\nif (!(sub instanceof Subclass) || !(sub instanceof Error) || sub instanceof Other || sub instanceof RangeError) throw new Error("missed");\nif (sub.message !== "x" || sub.name !== "TypeError") throw new Error("missed");\ntry {\n  throw new Other("y");\n} catch (caught) {\n  if (!(caught instanceof Other) || caught instanceof Subclass) throw new Error("missed");\n}`,
      ),
    );
    expect(result.failure).toBeUndefined();
    await expect(
      check(
        compile(
          `const Subclass = class extends TypeError {};\nif (!(new Subclass() instanceof RangeError)) throw new Error("not a RangeError");`,
        ),
      ),
    ).rejects.toThrow("not a RangeError");
  });

  it("makes instances of classes that extend Object or a wrapper constructor", async () => {
    const result = await check(
      compile(
        `class Bln extends Boolean {}\nconst Str = class extends String {\n  extra = 1;\n  get first() {\n    return this.charAt(0);\n  }\n};\nclass Trimmed extends Str {\n  trim() {\n    return "own";\n  }\n}\nclass Plain extends Object {}\nconst flag = new Bln(0);\nconst text = new Str(" ab ");\nconst trimmed = new Trimmed(" cd ");\nconst plain = new Plain(5);\nif (flag.valueOf() !== false || !(flag instanceof Bln) || !(flag instanceof Boolean) || Object.getPrototypeOf(Bln) !== Boolean) throw new Error("missed");\nif (text.trim() !== "ab" || text.length !== 4 || text.extra !== 1 || text.first !== " " || !(text instanceof String)) throw new Error("missed");\nif (trimmed.trim() !== "own" || trimmed.valueOf() !== " cd " || !(trimmed instanceof Str)) throw new Error("missed");\nif (!(plain instanceof Plain) || !(plain instanceof Object) || Object.keys(plain).length !== 0) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    const failed = await check(
      compile(
        `class Num extends Number {}\nconst one = new Num(1);\nif (one.valueOf() !== 2) throw new Error("not two");`,
      ),
    );
    expect(failed.failure?.message).toContain("not two");
  });

  it("reads super from the prototype of an object literal's method", async () => {
    const result = await check(
      compile(
        `let fromA = "";\nlet fromB = "";\nconst A = { fromA: "a", fromB: "a" };\nconst B = { fromB: "b" };\nObject.setPrototypeOf(B, A);\nconst obj = {\n  fromA: "c",\n  fromB: "c",\n  method() {\n    const read = () => super.fromA;\n    fromA = read();\n    fromB = super["fromB"];\n  },\n};\nObject.setPrototypeOf(obj, B);\nobj.method();\nif (fromA !== "a" || fromB !== "b") throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    const failed = await check(
      compile(
        `const obj = {\n  method() {\n    return super.x;\n  },\n};\nObject.setPrototypeOf(obj, null);\nobj.method();`,
      ),
    );
    expect(failed.failure?.message).toContain(
      "tla-ts can't read super of an object without a prototype",
    );
    expect(() =>
      compile(
        `let obj = {\n  method() {\n    return super.x;\n  },\n};\nobj = { method: obj.method };\nobj.method();`,
      ),
    ).toThrow("Unsupported expression: super");
  });

  it("extends an empty class that the extends clause makes", async () => {
    const result = await check(
      compile(
        `class C extends class {} {\n  value = 1;\n  get double() {\n    return this.value * 2;\n  }\n}\nconst c = new C();\nif (Object.getPrototypeOf(C) === Function.prototype || Object.getPrototypeOf(C.prototype) === Object.prototype) throw new Error("missed");\nif (!(c instanceof C) || c.double !== 2) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    expect(() => compile(`class C extends class {\n  m() {}\n} {}\nconst c = new C();`)).toThrow(
      "Unsupported statement",
    );
  });

  it("runs the defaults that a call or a declaration certainly evaluates", async () => {
    const result = await check(
      compile(
        `let count = 0;\nlet ran = 0;\nconst next = (): number => {\n  count += 1;\n  return count;\n};\nconst fail = (): number => {\n  throw new Error("default");\n};\nlet total = 0;\nfunction pair([first = next(), second = next()]: number[] = []) {\n  total = first * 10 + second;\n}\npair([]);\nconst [third = next()] = [undefined];\nconst run = (value: number = fail()) => {\n  ran += value;\n};\nlet caught = 0;\ntry {\n  run();\n} catch {\n  caught += 1;\n}\nif (total !== 12 || third !== 3 || caught !== 1 || ran !== 0) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    expect(() =>
      compile(
        `let count = 0;\nconst bump = (value: number): number => {\n  count += value;\n  return count;\n};\nfunction pair([first = 1, second = bump(first)]: number[] = []) {}\npair([]);`,
      ),
    ).toThrow("tla-ts can't run this default before what it binds");
  });

  it("skips the defaults that a literal certainly gives a value", async () => {
    const result = await check(
      compile(
        `let count = 0;\nconst counter = (): number => {\n  count += 1;\n  return count;\n};\nlet total = 0;\nfunction pick([first = counter(), second = counter()]: number[] = [5, 0]) {\n  total = first + second;\n}\npick();\nconst { size = counter() } = { size: 3 };\nif (total !== 5 || size !== 3 || count !== 0) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("names the classes that a parameter's defaults make", async () => {
    const result = await check(
      compile(
        `let names = "";\nfunction make([named = class Named { static run(a: number) {} }, plain = class { static name() {} }] = []) {\n  names = named.name + " " + Object.getOwnPropertyNames(named).join();\n  if (typeof plain.name !== "function" || typeof named.prototype !== "object") throw new Error("missed");\n}\nmake();\nif (names !== "Named length,name,prototype,run") throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("names the functions and classes that a declaration's defaults make", async () => {
    const result = await check(
      compile(
        `const object = {};\nconst [arrow = () => {}, gen = function* () {}, named = class {}] = [];\nif (arrow.name !== "arrow" || gen.name !== "gen" || named.name !== "named") throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("gives the object that Object.defineProperty and Object.freeze change", async () => {
    const result = await check(
      compile(
        `let reads = 0;\nconst object = Object.defineProperty({ kept: 1 }, "counted", {\n  get: () => {\n    reads += 1;\n    return 2;\n  },\n  enumerable: true,\n});\nconst frozen = Object.freeze({ size: 3 });\nlet total = 0;\ntotal = object.kept + Object.keys(object).length + frozen.size;\nif (total !== 6 || reads !== 0) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
    expect(() =>
      compile(
        `const object = {};\nconst list = Object.freeze([1, 2]);\nif (list[0] !== 1) throw new Error("missed");`,
      ),
    ).toThrow("Unsupported call: Object.freeze");
  });

  it("compares the arrays that rest elements make by identity", async () => {
    const result = await check(
      compile(
        `const object = {};\nconst values = [2, 1, 3];\nlet same = 0;\nconst check = (left: unknown, right: unknown) => {\n  if (left === right) same += 1;\n};\nfunction take([...rest]: number[]) {\n  check(rest, values);\n  check(rest, rest);\n  if (!Array.isArray(rest) || rest[0] !== 2 || rest.length !== 3) throw new Error("missed");\n}\ntake(values);\nif (same !== 1) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("makes an arguments object for each call to a function that names it", async () => {
    const result = await check(
      compile(
        `const object = {};\nfunction f(a: number, b: number) {\n  return arguments;\n}\nconst args = f(1, 2);\nconst other = f(1, 2);\nif (args === other) throw new Error("same");\nif (args.length !== 2 || args[0] !== 1 || args[1] !== 2) throw new Error("values");\nif (Object.prototype.toString.call(args) !== "[object Arguments]") throw new Error("tag");\nif (Object.keys(args).join() !== "0,1") throw new Error("keys");\nif (Object.getOwnPropertyNames(args).join() !== "0,1,length,callee") throw new Error("names");\nif (Object.getPrototypeOf(args) !== Object.prototype) throw new Error("proto");\nfunction g() {\n  arguments[0] = 5;\n  return arguments.length + (arguments[0] as number);\n}\nconst result = g();\nif (result !== 5) throw new Error("write");\nfunction h(a: number, b?: number, c?: number) {\n  const inner = function (b: number) {\n    return arguments.length + b;\n  };\n  const value = inner(3);\n  return arguments.length * 100 + value + (arguments[0] as number);\n}\nconst nested = h(7, 8, 9);\nif (nested !== 311) throw new Error("nested");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("makes the objects that a for-of iterates before its first iteration", async () => {
    const result = await check(
      compile(
        `let x = 0;\nlet counter = 0;\nconst seen: object[] = [];\nfor (const [{ x: inner }] of [[{ x: 2 }], [{ x: 3 }]]) {\n  x += inner;\n  counter += 1;\n}\nfor ({ x } of [{ x: 7 }]) counter += 1;\nif (x !== 7 || counter !== 3) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("makes the functions that a for-of pattern's defaults make on each iteration", async () => {
    const result = await check(
      compile(
        `const object = {};\nlet count = 0;\nlet first: unknown = undefined;\nlet isSame = false;\nfor (var [made = () => 1, named = function inner() {}] of [[], []]) {\n  if (made.name !== "made" || named.name !== "inner") throw new Error("name");\n  if (count === 0) first = made;\n  else isSame = first === made;\n  count += 1;\n}\nif (count !== 2 || isSame) throw new Error("after");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("reads the properties of a built-in function that a Function holds", async () => {
    const result = await check(
      compile(
        `const object = {};\nconst held: Function = Array;\nconst named = held.name;\nconst length = held.length;\nif (named !== "Array" || length !== 1) throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("wraps a primitive in the object that new Boolean, Number, or String makes", async () => {
    const result = await check(
      compile(
        `const object = {};\nconst flag = new Boolean(false);\nconst count = new Number(-123);\nconst text = new String("ab");\nif (typeof flag !== "object" || typeof text !== "object") throw new Error("typeof");\nif (Object.prototype.toString.call(flag) !== "[object Boolean]") throw new Error("tag b");\nif (Object.prototype.toString.call(count) !== "[object Number]") throw new Error("tag n");\nif (Object.prototype.toString.call(text) !== "[object String]") throw new Error("tag s");\nif (Object.getPrototypeOf(text) !== String.prototype) throw new Error("proto");\nif (Object.getOwnPropertyNames(text).join() !== "0,1,length") throw new Error("names");\nif (Object.keys(text).join() !== "0,1") throw new Error("keys");\nif (text[1] !== "b" || text.length !== 2) throw new Error("index");\nconst left = new Boolean(false);\nconst right = new Boolean(false);\nif (left === right || left !== left) throw new Error("identity");\nif (Array.isArray(flag)) throw new Error("array");\nconst holder = {};\nObject.defineProperty(holder, "p", { value: 1, configurable: count as unknown as boolean });\nconst described = Object.getOwnPropertyDescriptor(holder, "p");\nif (described!.configurable !== true) throw new Error("descriptor");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("calls a string's methods on the primitive that a String object wraps", async () => {
    const result = await checkModel(`
      const text = new String(" ab");
      const count = new Number(-123);
      const found = text.indexOf("b");
      const trimmed = text.trim();
      const digits = count.toString(16);
      if (found !== 2 || trimmed !== "ab" || digits !== "-7b") throw new Error("missed");
    `);
    expect(result.failure).toBeUndefined();
    const shadowed = await checkModel(`
      const text = new String("ab");
      Object.defineProperty(text, "indexOf", { value: 1 });
      const found = text.indexOf("b");
      if (found !== 1) throw new Error("missed");
    `);
    expect(shadowed.failure?.message).toContain("tla-ts can't call this method");
  });

  it("gives the primitive of a wrapper object or a primitive prototype through valueOf and toString", async () => {
    const result = await checkModel(`
      const flag = new Boolean(1);
      const isSet = flag.valueOf();
      const shown = flag.toString();
      const zero = Number.prototype.toString();
      const empty = String.prototype.valueOf();
      if (isSet !== true || shown !== "true" || zero !== "0" || empty !== "") {
        throw new Error("missed");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("calls valueOf on a value whose type doesn't tell what it is", async () => {
    expect(
      (
        await check(
          compile(
            `const object = {};\nlet seen: unknown = undefined;\n[1].forEach(function (this: { [key: string]: unknown }) {\n  seen = this.valueOf();\n}, false);\nif (seen !== false) throw new Error("diff");`,
          ),
        )
      ).failure,
    ).toBeUndefined();
    expect(
      (
        await check(
          compile(
            `const object: { [key: string]: unknown } = {};\nconst result = object.valueOf();\nif (result !== object) throw new Error("diff");`,
          ),
        )
      ).failure,
    ).toBeUndefined();
    expect(
      (
        await check(
          compile(
            `const object = {};\nObject.defineProperty(Boolean.prototype, "valueOf", { value: () => 9 });\nlet seen: unknown = undefined;\n[1].forEach(function (this: { [key: string]: unknown }) {\n  seen = this.valueOf();\n}, false);\nif (seen !== 9) throw new Error("diff");`,
          ),
        )
      ).failure?.message,
    ).toContain("tla-ts can't call valueOf");
  });

  it("divides numbers in a script with objects, and stops on a fraction", async () => {
    const result = await checkModel(`
      const negative = 1 / -0;
      const zero = 1 / -Infinity;
      const quotient = -6 / 3;
      if (negative !== -Infinity || !Object.is(zero, -0) || quotient !== -2) {
        throw new Error("missed");
      }
    `);
    expect(result.failure).toBeUndefined();
    const fraction = await checkModel(`
      const object = {};
      const half = 7 / 2;
      if (half !== 3) throw new Error("missed");
    `);
    expect(fraction.failure?.message).toContain("tla-ts can't represent the fraction 7 / 2");
  });

  it("compares, writes, and truncates the fractions that literals give", async () => {
    const result = await checkModel(`
      const keyed: Record<string, number> = { "1.5": 3 };
      const values: number[] = [6.99, -0.5, 2.5];
      if (values[0] === 7 || values[0] !== 6.99 || !(values[1] < 0) || !(-0.5 > -1)) {
        throw new Error("order");
      }
      if (!(2.5 > 2) || !(2.5 < 3) || !(2.5 < 6.99) || !(-6.99 < -2.5) || 2.5 >= 6.99) {
        throw new Error("order");
      }
      if (String(6.99) !== "6.99" || \`\${-0.5}\` !== "-0.5" || keyed[1.5] !== 3) {
        throw new Error("text");
      }
      if (Math.floor(2.5) !== 2 || Math.trunc(-2.5) !== -2 || Math.floor(-2.5) !== -3) {
        throw new Error("integer");
      }
      if (!Object.is(Math.ceil(-0.5), -0) || Math.ceil(2.5) !== 3 || Math.floor(7) !== 7) {
        throw new Error("integer");
      }
      if (Math.round(2.5) !== 3 || Math.round(-2.5) !== -2 || !Object.is(Math.round(-0.4), -0)) {
        throw new Error("round");
      }
      if (Math.sign(-2.5) !== -1 || Math.sign(0.5) !== 1 || !Object.is(Math.sign(-0), -0)) {
        throw new Error("sign");
      }
      if ([0, 1, 2, 3, 4].slice(2.5, 4).length !== 2 || [1, 2, 3].at(-1.5) !== 3) {
        throw new Error("index");
      }
      if ((6.99 | 0) !== 6 || ~2.5 !== -3 || (-6.99 >> 0) !== -6) throw new Error("bits");
      const items = [1, 2, 3];
      const removed = items.splice(0, 1.5);
      if (removed.length !== 1 || [[1], [[2], [3]]].flat(1.5).length !== 3) throw new Error("count");
      if (typeof 2.5 !== "number" || Number.isInteger(2.5) || !Number.isFinite(-2.5)) {
        throw new Error("kind");
      }
      if (Math.max(1, 2.5) !== 2.5 || Math.min(-0.5, 0) !== -0.5 || Math.abs(-2.5) !== 2.5) {
        throw new Error("extremes");
      }
      if (2.5 * 1 !== 2.5 || 0 + 2.5 !== 2.5 || -(-2.5) !== 2.5 || 0.5 ** Infinity !== 0) {
        throw new Error("arithmetic");
      }
    `);
    expect(result.failure).toBeUndefined();
    const converted = await checkModel(`
      const object = {};
      if (parseFloat("2.5") !== 2.5 || JSON.parse("-0.5") !== -0.5 || +"1.5" !== 1.5) {
        throw new Error("fraction");
      }
      if (!Number.isNaN(Number("abc")) || Number("-Infinity") !== -Infinity) throw new Error("special");
    `);
    expect(converted.failure).toBeUndefined();
    const sum = await checkModel(`
      const object = {};
      const sum = 0.1 + 0.2;
      if (sum === 0.3) throw new Error("missed");
    `);
    expect(sum.failure?.message).toContain("tla-ts can't add fractions");
  });

  it("runs a parenthesized call that makes an object as a statement", async () => {
    const result = await checkModel(`
      const held = (function (first: number) {
        return arguments;
      }(4));
      let other: unknown = undefined;
      other = (function (second: number) {
        return arguments;
      }(5));
      if (held[0] !== 4 || (other as IArguments)[0] !== 5) throw new Error("missed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("evaluates a call's arguments though the callee doesn't read them", async () => {
    const getSource = (call: string) => `
      const holder: { [key: string]: unknown } = Object.defineProperty({}, "poisoned", {
        get: function () {
          throw new Error("poison");
        },
      });
      function ignore(first: unknown) {
        return 1;
      }
      const skip = (first: unknown) => 1;
      let isCaught = false;
      try {
        ${call};
      } catch {
        isCaught = true;
      }
      if (!isCaught) throw new Error("missed");
    `;
    for (const call of [
      "ignore(holder.poisoned)",
      "const result = ignore(holder.poisoned) + 1",
      "const result = skip(holder.poisoned) + 1",
    ]) {
      expect((await checkModel(getSource(call))).failure).toBeUndefined();
    }
  });

  it("binds a rest parameter to the arguments after the others", async () => {
    const result = await checkModel(`
      let total = 0;
      function add(first: number, ...others: number[]) {
        total = first + others.length + (others[1] ?? 0);
      }
      add(1, 5, 7);
      if (total !== 10) throw new Error("missed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("inlines a top-level helper whose parameters have defaults or rest", async () => {
    const result = await checkModel(`
      function pick(first: number = 1) {
        return first;
      }
      function count(first: number, ...others: number[]) {
        return first + others.length;
      }
      const picked = pick();
      const counted = count(1, 2, 3);
      if (picked !== 1 || counted !== 3) throw new Error("missed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("calls a function through a non-null assertion", async () => {
    const result = await checkModel(`
      const probe: (() => number) | undefined = () => 4;
      const found = probe!();
      if (found !== 4) throw new Error("missed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs or stops on a getter that a pattern reads where the pattern runs", async () => {
    const getSource = (statements: string) => `
      let count = 0;
      const source = {
        get v() {
          count = count + 1;
          return 2;
        },
      };
      ${statements}
      if (count !== 1) throw new Error("missed");
    `;
    for (const statements of [
      "const { v } = source;",
      "function take({ v }: { v: number }) { return 1; } const taken = take(source);",
      "for (const { v } of [source]) {}",
    ]) {
      expect((await checkModel(getSource(statements))).failure).toBeUndefined();
    }
    expect(
      (await checkModel(getSource("let v = 0; ({ v } = source);"))).failure?.message,
    ).toContain("tla-ts can't call getters");
  });

  it("makes an object of the properties that an object pattern's rest element takes", async () => {
    const result = await checkModel(`
      const prototype = { inherited: 1 };
      const source: { [key: string]: unknown } = Object.create(prototype);
      source.a = 1;
      source.b = 2;
      Object.defineProperty(source, "hidden", { value: 3, enumerable: false });
      const { a, ...rest } = source;
      const keys = Object.keys(rest);
      if (keys.length !== 1 || rest.b !== 2 || rest.hidden !== undefined) throw new Error("keys");
      if (rest.inherited !== undefined || Object.getPrototypeOf(rest) !== Object.prototype) {
        throw new Error("prototype");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("makes symbols that differ from each other and key their own properties", async () => {
    const result = await checkModel(`
      const first: symbol = Symbol("key");
      const second: symbol = Symbol("key");
      if (first === second || typeof first !== "symbol") throw new Error("identity");
      if (first.description !== "key" || String(first) !== "Symbol(key)") throw new Error("text");
      if (first.toString() !== "Symbol(key)" || first.valueOf() !== first) throw new Error("methods");
      if (first.toString !== Symbol.prototype.toString) throw new Error("method");
      if (Symbol.iterator.description !== "Symbol.iterator") throw new Error("well-known");
      const object: { [key: symbol]: number; name: number } = { name: 1 };
      object[first] = 2;
      if (object[first] !== 2 || object[second] !== undefined) throw new Error("keys");
      if (Object.keys(object).length !== 1) throw new Error("string keys");
      const symbols = Object.getOwnPropertySymbols(object);
      if (symbols.length !== 1 || symbols[0] !== first) throw new Error("symbol keys");
      const copy: { [key: symbol]: number } = { ...object };
      if (copy[first] !== 2) throw new Error("spread");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("gives the registry's symbol for a key", async () => {
    const result = await checkModel(`
      const registered: symbol = Symbol.for("key");
      const again: symbol = Symbol.for("key");
      const fresh: symbol = Symbol("key");
      if (again !== registered || fresh === registered) throw new Error("for");
      if (Symbol.keyFor(registered) !== "key") throw new Error("keyFor");
      if (Symbol.keyFor(Symbol.iterator) !== undefined) throw new Error("unregistered");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("keys properties by well-known symbols, as the built-in objects do", async () => {
    const result = await checkModel(`
      const object: { [key: symbol]: number } = {};
      object[Symbol.iterator] = 1;
      if (object[Symbol.iterator] !== 1) throw new Error("own");
      if (Object.getOwnPropertySymbols(object).length !== 1) throw new Error("symbols");
      if (Array.prototype[Symbol.iterator] !== Array.prototype.values) throw new Error("array");
      if (Object.getOwnPropertySymbols(Array.prototype).length !== 2) throw new Error("listed");
      if (Math[Symbol.toStringTag] !== "Math") throw new Error("tag");
      const tagged: { [key: symbol]: string } = {};
      tagged[Symbol.toStringTag] = "Tagged";
      if (Object.prototype.toString.call(tagged) !== "[object Tagged]") throw new Error("own tag");
      if (Object.prototype.toString.call(new Map()) !== "[object Map]") throw new Error("map tag");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("defines an object literal's methods under computed keys", async () => {
    const result = await checkModel(`
      const iterable = {
        [Symbol.iterator]() {
          return 3;
        },
        ["plain" + "Key"]() {
          return 4;
        },
      };
      if (typeof iterable[Symbol.iterator] !== "function") throw new Error("typeof");
      if (Object.getOwnPropertySymbols(iterable).length !== 1) throw new Error("symbols");
      if (Object.keys(iterable).join() !== "plainKey") throw new Error("keys");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("disposes a block's resources last first as it leaves the block", async () => {
    const source = (expected: string) => `
      const order: string[] = [];
      const make = (name: string) => ({
        name,
        [Symbol.dispose]() {
          order.push(this.name);
        },
      });
      {
        using first = make("a"), second = make("b");
        using third = make("c");
        using nothing = null;
        order.push("body");
      }
      const run = (): number => {
        using held = make("run");
        return 1;
      };
      if (run() !== 1) throw new Error("result");
      for (let step = 0; step < 3; step++) {
        using held = make(String(step));
        if (step === 1) break;
      }
      let index = 0;
      for (using held = make("for"); index < 2; index++) order.push("loop");
      if (order.join() !== "${expected}") throw new Error(order.join());
    `;
    const result = await checkModel(source("body,c,b,a,run,0,1,loop,loop,for"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("body,a,b,c,run,0,1,loop,loop,for"));
    expect(wrong.failure?.message).toContain("body,c,b,a,run,0,1,loop,loop,for");
  });

  it("disposes what a for-of's using declaration holds at the end of each iteration", async () => {
    const source = (expected: string) => `
      const order: string[] = [];
      const make = (name: string) => ({
        name,
        [Symbol.dispose]() {
          order.push(this.name);
        },
      });
      const resources = [make("a"), make("b"), make("c")];
      for (using held of resources) {
        order.push("body");
        if (held.name === "b") continue;
        if (held.name === "c") break;
      }
      const run = () => {
        for (using held of resources) {
          order.push("run");
          return 1;
        }
        return 2;
      };
      if (run() !== 1) throw new Error("run");
      if (order.join() !== "${expected}") throw new Error(order.join());
    `;
    const result = await checkModel(source("body,a,body,b,body,c,run,a"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("body,a,body,b,body,c,a,run"));
    expect(wrong.failure?.message).toContain("body,a,body,b,body,c,run,a");
  });

  it("throws what disposing a resource throws, suppressing the error before it", async () => {
    const source = (expected: number) => `
      let count = 0;
      try {
        using held = { [Symbol.dispose]() { count += 1; } };
        throw new RangeError("body");
      } catch (error) {
        if (error instanceof RangeError) count += 10;
      }
      try {
        using held = { [Symbol.dispose]() { throw new TypeError("dispose"); } };
        throw new RangeError("body");
      } catch (error) {
        if (error instanceof SuppressedError) count += 100;
        if (error instanceof SuppressedError && error.error instanceof TypeError) count += 1000;
        if (error instanceof SuppressedError && error.suppressed instanceof RangeError) {
          count += 10000;
        }
      }
      try {
        using held = {} as Disposable;
      } catch (error) {
        if (error instanceof TypeError) count += 100000;
      }
      if (count !== ${expected}) throw new Error(String(count));
    `;
    const result = await checkModel(source(111111));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source(11111));
    expect(wrong.failure?.message).toContain("111111");
  });

  it("reads the properties of DisposableStack and AsyncDisposableStack", async () => {
    const source = (length: number) => `
      if (DisposableStack.prototype.adopt.length !== ${length}) throw new Error("adopt");
      if (AsyncDisposableStack.prototype.disposeAsync.name !== "disposeAsync") {
        throw new Error("name");
      }
      if (typeof DisposableStack.prototype[Symbol.dispose] !== "function") {
        throw new Error("dispose");
      }
      if (Object.getPrototypeOf(SuppressedError) !== Error) throw new Error("proto");
    `;
    const result = await checkModel(source(2));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source(1));
    expect(wrong.failure?.message).toContain("adopt");
  });

  it("runs a DisposableStack's methods, disposing last first", async () => {
    const source = (expected: string) => `
      const order: string[] = [];
      const stack = new DisposableStack();
      const resource = { [Symbol.dispose]() { order.push("use"); } };
      function onAdopt(value: string) { order.push("adopt " + value); }
      function onDefer() { order.push("defer"); }
      if (stack.use(resource) !== resource) throw new Error("use");
      if (stack.adopt("x", onAdopt) !== "x") throw new Error("adopt");
      stack.defer(onDefer);
      const moved = stack.move();
      if (!stack.disposed || moved.disposed) throw new Error("move");
      try { stack.defer(onDefer); } catch (error) { if (error instanceof ReferenceError) order.push("disposed"); }
      stack.dispose();
      moved[Symbol.dispose]();
      moved.dispose();
      if (order.join() !== "${expected}") throw new Error(order.join());
    `;
    const result = await checkModel(source("disposed,defer,adopt x,use"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("disposed,use,adopt x,defer"));
    expect(wrong.failure?.message).toContain("disposed,defer,adopt x,use");
  });

  it("suppresses the errors that disposing a DisposableStack throws, and ignores re-entry", async () => {
    const source = (expected: string) => `
      const order: string[] = [];
      const stack = new DisposableStack();
      function first() { order.push("first"); throw new RangeError("first"); }
      function second() { order.push("second"); throw new TypeError("second"); }
      function reenter() { order.push("reenter"); stack.dispose(); }
      stack.defer(first);
      stack.defer(second);
      stack.defer(reenter);
      try {
        stack.dispose();
      } catch (error) {
        if (error instanceof SuppressedError && error.error instanceof ${expected}) {
          order.push("suppressed");
        }
      }
      if (order.join() !== "reenter,second,first,suppressed") throw new Error(order.join());
    `;
    const result = await checkModel(source("RangeError"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("TypeError"));
    expect(wrong.failure?.message).toContain("reenter,second,first");
  });

  it("awaits what an AsyncDisposableStack disposes, as Node does", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const stack = new AsyncDisposableStack();
      const resource = { async [Symbol.asyncDispose]() { order.push("async"); } };
      const syncResource = { [Symbol.dispose]() { order.push("sync"); } };
      function onDefer() { order.push("defer"); }
      stack.use(resource);
      stack.use(null);
      stack.use(syncResource);
      stack.defer(onDefer);
      const done = stack.disposeAsync();
      order.push("after call");
      Promise.resolve()
        .then(() => order.push("tick 1"))
        .then(() => order.push("tick 2"))
        .then(() => order.push("tick 3"))
        .then(() => order.push("tick 4"));
      done.then((value) => order.push("done " + String(value) + " " + String(stack.disposed)));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(
      source("defer,after call,sync,tick 1,async,tick 2,tick 3,done undefined true,tick 4"),
    );
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(
      source("defer,after call,sync,tick 1,tick 2,async,tick 3,done undefined true,tick 4"),
    );
    expect(wrong.failure).toBeDefined();
  });

  it("awaits what an await using declaration disposes, as Node does", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const run = async () => {
        await using first = { [Symbol.dispose]() { order.push("sync"); } };
        await using second = {
          [Symbol.asyncDispose]() { order.push("async"); },
        } as unknown as AsyncDisposable;
        {
          await using nothing = null;
          order.push("body");
        }
        order.push("left");
      };
      const done = run();
      order.push("after call");
      Promise.resolve()
        .then(() => order.push("tick 1"))
        .then(() => order.push("tick 2"))
        .then(() => order.push("tick 3"));
      done.then(() => order.push("done"));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const expected = "body,after call,left,async,tick 1,sync,tick 2,tick 3,done";
    const result = await checkModel(source(expected));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source(expected.replace("left,async", "async,left")));
    expect(wrong.failure).toBeDefined();
  });

  it("awaits an async dispose method, which a function's object literal may hold", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const asyncTest = (testFunc: () => Promise<void>) => {
        testFunc().then(() => order.push("done"));
      };
      asyncTest(async function () {
        const resource = {
          async [Symbol.asyncDispose]() {
            order.push("dispose");
            await null;
            order.push("disposed");
          },
        };
        {
          await using held = resource;
          order.push("body");
        }
        order.push("left");
      });
      order.push("after call");
      Promise.resolve()
        .then(() => order.push("tick 1"))
        .then(() => order.push("tick 2"))
        .then(() => order.push("tick 3"))
        .then(() => order.push("tick 4"));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const expected = "body,dispose,after call,disposed,tick 1,left,tick 2,done,tick 3,tick 4";
    const result = await checkModel(source(expected));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source(expected.replace("disposed,tick 1", "tick 1,disposed")));
    expect(wrong.failure).toBeDefined();
  });

  it("rejects what an async function returns where disposing throws", async () => {
    const source = (expected: number) => `
      declare function setTimeout(callback: () => void): void;
      let count = 0;
      const run = async () => {
        await using held = { [Symbol.dispose]() { throw new TypeError("dispose"); } };
        throw new RangeError("body");
      };
      const fail = async () => {
        await using held = {} as AsyncDisposable;
      };
      const check = async () => {
        try {
          await run();
        } catch (error) {
          if (
            error instanceof SuppressedError &&
            error.error instanceof TypeError &&
            error.suppressed instanceof RangeError
          ) {
            count += 1;
          }
        }
        try {
          await fail();
        } catch (error) {
          if (error instanceof TypeError) count += 10;
        }
      };
      check();
      setTimeout(() => {
        if (count !== ${expected}) throw new Error(String(count));
      });
    `;
    const result = await checkModel(source(11));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source(10));
    expect(wrong.failure).toBeDefined();
  });

  it("rejects a symbol key on a value that isn't an object", () => {
    expect(() => compile("const map = new Map();\nconst read = map[Symbol.iterator];")).toThrow(
      "tla-ts can't read what a symbol keys on this value",
    );
  });

  it("stops where a script reads a built-in getter that a well-known symbol keys", async () => {
    const result = await checkModel(`
      const holder = {};
      const species = Array[Symbol.species];
    `);
    expect(result.failure?.message).toContain("tla-ts can't call getters");
  });

  it("stops where a script makes more symbols than it has calls of Symbol", async () => {
    const result = await checkModel(`
      let count = 0;
      for (let index = 0; index < 10; index++) {
        const made: symbol = Symbol();
        count++;
      }
    `);
    expect(result.failure?.message).toContain("tla-ts can't make more symbols");
  });

  it("runs promise reactions as jobs in the order JavaScript queues them", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const first = Promise.resolve(1);
      first.then(() => { log = log + "a"; }).then(() => { log = log + "b"; });
      Promise.reject(2).catch(() => { log = log + "c"; }).then(() => { log = log + "d"; });
      first.then(() => {
        log = log + "e";
        return Promise.resolve(5);
      }).then((value: number) => { log = log + "f" + value; });
      log = log + "s";
      setTimeout(() => {
        if (log !== "saceb" + "df5") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("fulfills a promise with an object whose then isn't callable", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      const nonThenable = { then: null as unknown };
      let seen: unknown = undefined;
      Promise.resolve(nonThenable).then((value) => {
        seen = value;
      });
      setTimeout(() => {
        if (seen !== nonThenable) throw new Error("seen");
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("calls a thenable's then in a job, which settles the promise once", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const thenable = {
        then(resolve: (value: number) => void) {
          log += "t";
          resolve(1);
          resolve(2);
        },
      };
      const throwing = {
        then: (resolve: (value: number) => void) => {
          resolve(5);
          throw 6;
        },
      };
      Promise.resolve(thenable).then((value) => {
        log += "a" + value;
      });
      Promise.resolve(throwing).then((value) => {
        log += "d" + value;
      });
      Promise.resolve(0)
        .then(() => {
          log += "1";
        })
        .then(() => {
          log += "2";
        });
      setTimeout(() => {
        if (log !== "t1a1d52") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("gives a promise's callback the locals of the call that made it", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      function make(count: number) {
        Promise.resolve(0).then(() => { log = log + count; });
      }
      make(1);
      make(2);
      setTimeout(() => {
        if (log !== "12") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("fulfills Promise.any with the first value, or rejects it with an AggregateError", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.any([Promise.reject(1), Promise.resolve(2)]).then((value) => {
        log += "a" + value;
      });
      Promise.any([Promise.reject(3), Promise.reject(4)]).catch((error: AggregateError) => {
        log += "b" + error.errors.length + error.errors[0] + error.errors[1];
        log += String(error instanceof AggregateError) + String(error instanceof TypeError);
      });
      Promise.any([]).catch((error: AggregateError) => {
        log += "c" + error.errors.length;
      });
      Promise.resolve(0)
        .then(() => {
          log += "1";
        })
        .then(() => {
          log += "2";
        })
        .then(() => {
          log += "3";
        });
      setTimeout(() => {
        if (log !== "c01a2b234truefalse23") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads the prototype of a promise", async () => {
    const result = await checkModel(`
      async function make() {}
      const made = make();
      const all = Promise.all([]);
      const constructed = new Promise(() => {});
      if (!(made instanceof Promise) || !(constructed instanceof Promise)) throw new Error("made");
      if (made instanceof Array || !(made instanceof Object)) throw new Error("array");
      if (Object.getPrototypeOf(all) !== Promise.prototype) throw new Error("prototype");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError where a Promise function's this can't make a promise", async () => {
    const result = await checkModel(`
      function ZeroArgConstructor() {}
      const arrow = () => {};
      let log = "";
      const attempt = (run: () => void) => {
        try {
          run();
          log += "n";
        } catch (error) {
          log += error instanceof TypeError ? "t" : "x";
        }
      };
      attempt(() => Promise.all.call(undefined, []));
      attempt(() => Promise.race.call(86, [3]));
      attempt(() => Promise.any.call(Symbol(), []));
      attempt(() => Promise.allSettled.call(ZeroArgConstructor, []));
      attempt(() => Promise.reject.call(arrow, 4));
      if (log !== "ttttt") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("tells which error class made a promise's reason", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.reject(new TypeError("t")).catch((error) => {
        log += String(error instanceof TypeError) + String(error instanceof RangeError);
      });
      Promise.reject(3).catch((error) => {
        log += String(error instanceof TypeError);
      });
      setTimeout(() => {
        if (log !== "truefalsefalse") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs async functions that then, catch and Array.fromAsync call back", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.resolve(1)
        .then(async (value) => {
          log += "a" + String(value);
          await null;
          log += "w";
          return value + 1;
        })
        .then((value) => {
          log += "b" + String(value);
        });
      Promise.resolve()
        .then(async () => {
          throw "x";
        })
        .catch(async (error) => {
          log += "c" + String(error);
        });
      const holder = { name: "h" };
      Array.fromAsync(
        [1, 2],
        async function (this: { name: string }, value: number, k: number) {
          log += this.name;
          return value + k;
        },
        holder,
      ).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      Promise.resolve()
        .then(() => { log += "0"; })
        .then(() => { log += "1"; })
        .then(() => { log += "2"; })
        .then(() => { log += "3"; })
        .then(() => { log += "4"; })
        .then(() => { log += "5"; })
        .then(() => { log += "6"; })
        .then(() => { log += "7"; })
        .then(() => { log += "8"; })
        .then(() => { log += "9"; });
      setTimeout(() => {
        if (log !== "a10wh12b2cx3h4567[1,3]89") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs Array.fromAsync of a generator, which it closes where a value rejects", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const first = (function* () {
        log += "a";
        yield 1;
        log += "b";
        yield 2;
        log += "c";
      })();
      Array.fromAsync(first, (value: number, k: number) => value * 10 + k).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      const second = (function* () {
        log += "d";
        throw "t";
      })();
      Array.fromAsync(second).catch((error) => {
        log += "<" + String(error) + ">";
      });
      const third = (function* () {
        log += "e";
        yield Promise.reject("r");
        log += "f";
      })();
      Array.fromAsync(third).catch((error) => {
        log += "(" + String(error) + ")";
      });
      const fourth = (function* () {
        yield 1;
        log += "x";
      })();
      Array.fromAsync(fourth, () => {
        throw "m";
      }).catch((error) => {
        log += "{" + String(error) + "}";
      });
      Promise.resolve()
        .then(() => { log += "0"; })
        .then(() => { log += "1"; })
        .then(() => { log += "2"; })
        .then(() => { log += "3"; })
        .then(() => { log += "4"; })
        .then(() => { log += "5"; })
        .then(() => { log += "6"; })
        .then(() => { log += "7"; })
        .then(() => { log += "8"; });
      setTimeout(() => {
        if (log !== "ade0<t>1b(r)23{m}4c567[10,21]8") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("awaits a namespace's async function that awaits what a callback gives", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      namespace checks {
        export async function settles(func: () => unknown) {
          let result: unknown = undefined;
          result = func();
          log += "s";
          try {
            await result;
            log += "f";
          } catch (error) {
            log += "<" + String(error) + ">";
          }
        }
      }
      const run = async () => {
        await checks.settles(() => Promise.reject("r"));
        log += "a";
        await checks.settles(() => Promise.resolve(1));
        log += "b";
        await checks.settles(() => 5);
        log += "c";
        await checks.settles(() => new Promise((resolve, reject) => reject("n")));
        log += "d";
      };
      run();
      Promise.resolve()
        .then(() => { log += "0"; })
        .then(() => { log += "1"; })
        .then(() => { log += "2"; })
        .then(() => { log += "3"; })
        .then(() => { log += "4"; })
        .then(() => { log += "5"; })
        .then(() => { log += "6"; })
        .then(() => { log += "7"; })
        .then(() => { log += "8"; })
        .then(() => { log += "9"; });
      setTimeout(() => {
        if (log !== "s<r>0as1f2bs3f4cs5<n>6d789") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs Array.fromAsync of an async generator, which it closes where a mapping throws", async () => {
    // V8 settles a rejected request two jobs later than the spec, whose order a for await gives.
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const first = (async function* () {
        log += "a";
        yield 1;
        log += "b";
        yield Promise.resolve(2);
        log += "c";
      })();
      Array.fromAsync(first, (value: number, k: number) => value * 10 + k).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      const second = (async function* () {
        log += "d";
        throw "t";
      })();
      Array.fromAsync(second).catch((error) => {
        log += "<" + String(error) + ">";
      });
      const third = (async function* () {
        yield 1;
        log += "x";
      })();
      Array.fromAsync(third, () => {
        throw "m";
      }).catch((error) => {
        log += "{" + String(error) + "}";
      });
      async function* fourth() {
        yield "p";
        yield "q";
      }
      Array.fromAsync({ [Symbol.asyncIterator]: fourth }, async (value: string) => value + "!").then(
        (values) => {
          log += "(" + values.join(",") + ")";
        },
      );
      Promise.resolve()
        .then(() => { log += "0"; })
        .then(() => { log += "1"; })
        .then(() => { log += "2"; })
        .then(() => { log += "3"; })
        .then(() => { log += "4"; })
        .then(() => { log += "5"; })
        .then(() => { log += "6"; })
        .then(() => { log += "7"; })
        .then(() => { log += "8"; })
        .then(() => { log += "9"; });
      setTimeout(() => {
        if (log !== "ad0<t>1b23{m}4c56[10,21](p!,q!)789") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs Array.fromAsync of an object whose iterator is a generator function", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      function* first() {
        log += "a";
        yield 1;
        log += "b";
        yield Promise.resolve(2);
      }
      Array.fromAsync({ [Symbol.iterator]: first }).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      const second = (async function* () {
        log += "c";
        yield* [3, 4];
        log += "d";
      })();
      Array.fromAsync(second).then((values) => {
        log += "(" + values.join(",") + ")";
      });
      const third = (async function* () {
        yield 5;
        log += "x";
      })();
      Array.fromAsync(third, async () => {
        throw "m";
      }).catch((error) => {
        log += "{" + String(error) + "}";
      });
      Promise.resolve()
        .then(() => { log += "0"; })
        .then(() => { log += "1"; })
        .then(() => { log += "2"; })
        .then(() => { log += "3"; })
        .then(() => { log += "4"; })
        .then(() => { log += "5"; })
        .then(() => { log += "6"; })
        .then(() => { log += "7"; })
        .then(() => { log += "8"; })
        .then(() => { log += "9"; });
      setTimeout(() => {
        if (log !== "ac0b1234{m}5[1,2]6d78(3,4)9") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("awaits the thenable that an Array.fromAsync mapping returns", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      let count = 0;
      Array.fromAsync([1, 2], () => {
        return {
          then(resolve: (value: number) => void) {
            count++;
            log += "t";
            resolve(count * 10);
          },
        };
      }).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      Promise.resolve()
        .then(() => { log += "0"; })
        .then(() => { log += "1"; })
        .then(() => { log += "2"; })
        .then(() => { log += "3"; })
        .then(() => { log += "4"; })
        .then(() => { log += "5"; })
        .then(() => { log += "6"; })
        .then(() => { log += "7"; })
        .then(() => { log += "8"; });
      setTimeout(() => {
        if (log !== "01t2345t678[10,20]") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws from a generator's pattern default to the code that resumes the generator", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const fail = (): number => {
        throw new Error("e");
      };
      function* sync() {
        const [x = fail()] = [undefined];
        log += x;
      }
      const iterator = sync();
      try {
        iterator.next();
      } catch (error) {
        log += "<" + (error as Error).message + ">";
      }
      async function* declared() {
        const [x = fail()] = [undefined];
        log += x;
      }
      declared().next().then(
        () => { log += "resolved"; },
        (error) => { log += "(" + (error as Error).message + ")"; },
      );
      async function* looped() {
        for await (const [x = fail()] of [[undefined]]) {
          log += x;
        }
      }
      looped().next().then(
        () => { log += "resolved"; },
        (error) => { log += "[" + (error as Error).message + "]"; },
      );
      setTimeout(() => {
        if (log !== "<e>(e)[e]") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("closes a generator that suspended in try through its finally and catch", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      function* guarded(): Generator<number, number | void> {
        try {
          log += "a";
          yield 1;
          log += "x";
        } finally {
          log += "f";
        }
        log += "y";
      }
      const first = guarded();
      first.next();
      const returned = first.return(5);
      log += "(" + returned.value + "," + returned.done + ")";
      const after = first.next();
      log += after.done;
      function* caught() {
        try {
          yield 1;
          log += "x";
        } catch (error) {
          log += "<" + String(error) + ">";
          yield 2;
          log += "b";
        }
        return 3;
      }
      const second = caught();
      second.next();
      const thrown = second.throw("t");
      log += "(" + thrown.value + "," + thrown.done + ")";
      const ended = second.next();
      log += "(" + ended.value + "," + ended.done + ")";
      function* yielding(): Generator<number, number | void> {
        try {
          yield 1;
        } finally {
          yield 2;
          log += "g";
        }
      }
      const third = yielding();
      third.next();
      const again = third.return(7);
      log += "(" + again.value + "," + again.done + ")";
      const last = third.next();
      log += "(" + last.value + "," + last.done + ")";
      function* rethrowing() {
        try {
          yield 1;
        } finally {
          log += "h";
        }
      }
      const fourth = rethrowing();
      fourth.next();
      try {
        fourth.throw("u");
      } catch (error) {
        log += "[" + String(error) + "]";
      }
      for (const value of guarded()) {
        log += value;
        break;
      }
      setTimeout(() => {
        if (log !== "af(5,true)true<t>(2,false)b(3,true)(2,false)g(7,true)h[u]a1f") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs Array.fromAsync of the values() of an array written in place", async () => {
    // V8 rejects a job later than the spec, whose order a for await gives.
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const input = [1, 2, 3].values();
      Array.fromAsync(input, (value: number, k: number) => value * 10 + k).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      const thenable = {
        then(resolve: (value: number) => void, reject: (reason: unknown) => void) {
          log += "t";
          reject("r");
        },
      };
      const rejecting = [thenable].values();
      Array.fromAsync(rejecting as Iterable<unknown>).catch((error) => {
        log += "<" + String(error) + ">";
      });
      Promise.resolve()
        .then(() => { log += "0"; })
        .then(() => { log += "1"; })
        .then(() => { log += "2"; })
        .then(() => { log += "3"; })
        .then(() => { log += "4"; })
        .then(() => { log += "5"; })
        .then(() => { log += "6"; })
        .then(() => { log += "7"; })
        .then(() => { log += "8"; });
      setTimeout(() => {
        if (log !== "t012<r>345678[10,21,32]") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops at Array.fromAsync of an array's values() that another call steps", () => {
    expect(() =>
      compile(`
        const input = [1, 2].values();
        input.next();
        Array.fromAsync(input);
      `),
    ).toThrow("Pass Array.fromAsync");
  });

  it("runs Array.fromAsync of an array-like object and of a string", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const items = { length: 2, 0: 1, 1: Promise.resolve(2) };
      Array.fromAsync(items, (value: number, k: number) => {
        log += "m";
        return value * 10 + k;
      }).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      Array.fromAsync("ab").then((values) => {
        log += "(" + values.join(",") + ")";
      });
      Array.fromAsync({ length: 1, 0: Promise.reject("r") }).catch((error) => {
        log += "<" + String(error) + ">";
      });
      Promise.resolve()
        .then(() => {
          log += "0";
        })
        .then(() => {
          log += "1";
        })
        .then(() => {
          log += "2";
        })
        .then(() => {
          log += "3";
        })
        .then(() => {
          log += "4";
        })
        .then(() => {
          log += "5";
        });
      setTimeout(() => {
        if (log !== "m0<r>1m23[10,21]45(a,b)") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("takes Array.fromAsync's elements and mapped values a job apart", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Array.fromAsync([1, Promise.resolve(2)], (value: number, k: number) => {
        log += "m";
        return value * 10 + k;
      }).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      Promise.resolve()
        .then(() => {
          log += "0";
        })
        .then(() => {
          log += "1";
        })
        .then(() => {
          log += "2";
        })
        .then(() => {
          log += "3";
        })
        .then(() => {
          log += "4";
        })
        .then(() => {
          log += "5";
        })
        .then(() => {
          log += "6";
        })
        .then(() => {
          log += "7";
        });
      setTimeout(() => {
        if (log !== "0m123m4567[10,21]") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("rejects Array.fromAsync with an element's reason or a mapping function's throw", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Array.fromAsync([1, Promise.reject("r"), 3]).catch((error) => {
        log += "<" + String(error) + ">";
      });
      Array.fromAsync([1], () => {
        throw "t";
      }).catch((error) => {
        log += "(" + String(error) + ")";
      });
      Promise.resolve()
        .then(() => {
          log += "0";
        })
        .then(() => {
          log += "1";
        })
        .then(() => {
          log += "2";
        })
        .then(() => {
          log += "3";
        })
        .then(() => {
          log += "4";
        })
        .then(() => {
          log += "5";
        })
        .then(() => {
          log += "6";
        })
        .then(() => {
          log += "7";
        });
      setTimeout(() => {
        if (log !== "012(t)3<r>4567") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads the properties of a promise's reason without a type", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.any([Promise.reject("reason"), Promise.reject(2)]).then(undefined, (error) => {
        log +=
          String(error instanceof AggregateError) +
          String(error.errors.length) +
          error.errors[0] +
          String(error.errors[1]);
      });
      Promise.reject({ code: 3 }).catch((error) => {
        log += String(error.code);
      });
      setTimeout(() => {
        if (log !== "3true2reason2") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where it can't tell whether a promise's reason is an instance of an error", async () => {
    const result = await checkModel(`
      const reason: object = Object.create(TypeError.prototype);
      Promise.reject(reason).catch((error) => {
        if (error instanceof TypeError) throw new Error("no");
      });
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't tell whether this object is an instance",
    );
    const getSource = (expected: string) => `
      let seen = "";
      Promise.reject({})
        .catch((error) => {
          seen = error instanceof TypeError ? "type" : "plain";
        })
        .then(() => {
          if (seen !== "${expected}") throw new Error(seen);
        });
    `;
    expect((await checkModel(getSource("plain"))).failure).toBeUndefined();
    expect((await checkModel(getSource("type"))).failure).toBeDefined();
  });

  it("runs a script's constructor with the executor of a promise capability", async () => {
    const result = await checkModel(`
      let log = "";
      const attempt = (run: () => void) => {
        try {
          run();
          log += "n";
        } catch (error) {
          log += error instanceof TypeError ? "t" : error instanceof RangeError ? "r" : "x";
        }
      };
      function Thrower() {
        throw new RangeError("c");
      }
      attempt(() => Promise.reject.call(Thrower, 1));
      attempt(() =>
        Promise.resolve.call(function (executor: (resolve: unknown, reject: unknown) => void) {
          log += "a";
          executor(123, "invalid value");
          log += "b";
        }, {}),
      );
      attempt(() =>
        Promise.all.call(function (executor: (resolve: unknown, reject: unknown) => void) {
          executor(function () {}, undefined);
          log += "e";
          executor(undefined, function () {});
          log += "f";
        }, []),
      );
      attempt(() => Promise.withResolvers.call(undefined));
      if (log !== "rabtett") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("rejects new AggregateError, whose first argument isn't a message", () => {
    expect(() => compile(`const error = new AggregateError([1], "message");`)).toThrow(
      "Unsupported constructor: new AggregateError",
    );
  });

  it("stops where a promise's callback reads a local that changes", () => {
    expect(() =>
      compile(`
        function make() {
          let count = 1;
          Promise.resolve(0).then(() => count);
          count = 2;
        }
        make();
      `),
    ).toThrow("reads a local that changes");
  });

  it("suspends an async function at each await until its promise settles", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      async function inner(value: number) {
        log = log + "i" + value;
        const got = await value;
        log = log + "j" + got;
        return got + 1;
      }
      async function outer() {
        log = log + "o";
        const first = await inner(1);
        log = log + "p" + first;
        try {
          await Promise.reject(7);
        } catch (error) {
          log = log + "c" + error;
        }
        return "r";
      }
      outer().then((value: string) => { log = log + value; });
      Promise.resolve(0).then(() => { log = log + "t"; }).then(() => { log = log + "u"; });
      log = log + "s";
      setTimeout(() => {
        if (log !== "oi1sj1tp2uc7r") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("settles a promise from its executor once", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const first = new Promise<number>((resolve, reject) => {
        log = log + "e";
        resolve(1);
        reject(2);
      });
      first.then((value: number) => { log = log + "f" + value; });
      new Promise<number>(() => {
        throw new Error("thrown");
      }).catch(() => { log = log + "c"; });
      new Promise<number>((resolve) => resolve(first)).then((value: number) => {
        log = log + "a" + value;
      });
      log = log + "s";
      setTimeout(() => {
        if (log !== "esf1ca1") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("calls a promise's resolve and reject through the variables that hold them", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      let resolveFirst: unknown = undefined;
      let rejectSecond: unknown = undefined;
      const first = new Promise<number>((resolve) => { resolveFirst = resolve; });
      const second = new Promise<number>((resolve, reject) => { rejectSecond = reject; });
      first.then((value: number) => { log = log + "f" + value; });
      second.catch((value: number) => { log = log + "r" + value; });
      log = log + typeof resolveFirst;
      (rejectSecond as (value: number) => void)(2);
      (resolveFirst as (value: number) => void)(1);
      (resolveFirst as (value: number) => void)(3);
      setTimeout(() => {
        if (log !== "functionr2f1") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("settles each next of an async generator once its body yields", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      async function* numbers(start: number) {
        log = log + "b" + start;
        yield start;
        const got = await Promise.resolve(10);
        yield got + start;
      }
      const iterator = numbers(1);
      log = log + "s";
      iterator.next().then((result: IteratorResult<number>) => { log = log + "n" + result.value; });
      iterator.next().then((result: IteratorResult<number>) => { log = log + "m" + result.value; });
      iterator.next().then((result: IteratorResult<number>) => {
        log = log + (result.done === true ? "d" : "?");
      });
      Promise.resolve(0).then(() => { log = log + "t"; }).then(() => { log = log + "u"; });
      setTimeout(() => {
        if (log !== "sb1tn1um11d") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("awaits each element of a for await two jobs before its body", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.resolve()
        .then(() => { log = log + "1"; })
        .then(() => { log = log + "2"; })
        .then(() => { log = log + "3"; })
        .then(() => { log = log + "4"; })
        .then(() => { log = log + "5"; })
        .then(() => { log = log + "6"; })
        .then(() => { log = log + "7"; });
      const rejected = Promise.reject("r");
      async function run() {
        for await (const [x, y] of [[1, 2], [3, 4]]) {
          log = log + "x" + x + y;
        }
        log = log + "a";
        for await (const value of [5, 6]) {
          log = log + "v" + value;
          break;
        }
        log = log + "b";
        try {
          for await (const value of [rejected]) {
            log = log + "no";
          }
        } catch (error) {
          log = log + "c" + error;
        }
        return "e";
      }
      run().then((value: string) => { log = log + value; });
      log = log + "s";
      setTimeout(() => {
        if (log !== "s12x1234x3456a7v5bcre") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("yields each element of an array that yield* takes", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.resolve()
        .then(() => { log = log + "1"; })
        .then(() => { log = log + "2"; })
        .then(() => { log = log + "3"; })
        .then(() => { log = log + "4"; })
        .then(() => { log = log + "5"; })
        .then(() => { log = log + "6"; })
        .then(() => { log = log + "7"; })
        .then(() => { log = log + "8"; });
      const rejected = Promise.reject("r");
      async function* gen() {
        log = log + "g";
        yield* [10, 20];
        log = log + "h";
        try {
          yield* [rejected];
        } catch (error) {
          log = log + "c" + error;
        }
      }
      const iterator = gen();
      iterator.next().then((result: IteratorResult<number>) => {
        log = log + "a" + result.value + (result.done === true);
      });
      iterator.next().then((result: IteratorResult<number>) => {
        log = log + "b" + result.value + (result.done === true);
      });
      iterator.next().then((result: IteratorResult<number>) => {
        log = log + "d" + result.value + (result.done === true);
      });
      function* sync() {
        yield* [1, 2];
        log = log + "e";
      }
      const syncIterator = sync();
      const first = syncIterator.next();
      const second = syncIterator.next();
      const third = syncIterator.next();
      log = log + "x" + (first.value === 1) + (second.value === 2) + (third.done === true);
      setTimeout(() => {
        if (log !== "gextruetruetrue123a10false45b20false6h78crdundefinedtrue") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("iterates an async generator with for await, and returns it on break", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.resolve()
        .then(() => { log = log + "1"; })
        .then(() => { log = log + "2"; })
        .then(() => { log = log + "3"; })
        .then(() => { log = log + "4"; })
        .then(() => { log = log + "5"; })
        .then(() => { log = log + "6"; })
        .then(() => { log = log + "7"; })
        .then(() => { log = log + "8"; })
        .then(() => { log = log + "9"; });
      const first = (async function* () {
        yield* [1, 2];
        yield 3;
        log = log + "f";
      })();
      const second = (async function* () {
        yield 4;
        log = log + "no";
      })();
      async function run() {
        for await (const value of first) {
          log = log + "v" + value;
        }
        log = log + "a";
        for await (const value of second) {
          log = log + "w" + value;
          break;
        }
        log = log + "b";
      }
      run().then(() => { log = log + "e"; });
      log = log + "s";
      setTimeout(() => {
        if (log !== "s123v1456v2789v3faw4be") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a for await over an async generator inside another async generator", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let count = 0;
      const inner = (async function* () {
        yield* [[1, 2]];
      })();
      async function* outer() {
        for await (const [x, y] of inner) {
          count = count + x + y;
        }
      }
      outer().next();
      setTimeout(() => {
        if (count !== 3) throw new Error("missed");
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where a return would close a generator inside yield*", async () => {
    await expect(
      checkModel(`
        function* gen() {
          yield* [1, 2];
        }
        const iterator = gen();
        iterator.next();
        iterator.return();
      `),
    ).rejects.toThrow("tla-ts can't close a generator that suspended in yield* or a helper");
  });

  it("throws and returns from inside loops", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      let found = "";
      const find = (values: number[], target: number) => {
        for (const value of values) {
          if (value === target) {
            found = found + "found" + value;
            return;
          }
          log = log + value;
        }
        found = found + "none";
      };
      find([1, 2, 3], 2);
      find([4], 9);
      log = log + found;
      try {
        for (let index = 0; index < 5; index++) {
          log = log + "i" + index;
          if (index === 2) throw new Error("e" + index);
        }
        log = log + "no";
      } catch (error) {
        log = log + (error as Error).message;
      }
      async function run() {
        let count = 0;
        while (count < 3) {
          count = count + 1;
          if (count === 2) throw "w" + count;
        }
        return count;
      }
      run().catch((error: string) => { log = log + error; });
      setTimeout(() => {
        if (log !== "14found2nonei0i1i2e2w2") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("destructures nested patterns inside try", async () => {
    const result = await checkModel(`
      let total = 0;
      try {
        const [[first, second], { third }] = [[1, 2], { third: 3 }] as const;
        total = first + second + third;
      } catch {
        total = -1;
      }
      if (total !== 6) throw new Error("missed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs the defaults that a for await's pattern evaluates", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let initCount = 0;
      function counter() {
        initCount += 1;
        return initCount * 10;
      }
      let log = "";
      async function fn() {
        for await (const [w = counter(), x = counter(), y = counter()] of [[null, undefined, ""]]) {
          log = log + (w === null) + (x === 10) + (y === "") + initCount;
        }
      }
      fn();
      setTimeout(() => {
        if (log !== "truetruetrue1") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("takes a for-of's array pattern from the generators of an array written in place", async () => {
    const result = await checkModel(`
      let log = "";
      const first = (function* () {
        yield 1;
        yield 2;
        yield 3;
      })();
      const second = [4, 5];
      const third = (function* () {
        yield 6;
      })();
      for (const [a, b] of [first, second, third]) {
        log += String(a) + String(b) + ";";
      }
      const rest = first.next();
      log += rest.done ? "done" : "more";
      if (log !== "12;45;6undefined;done") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("gives a generator from an assignment of what a pattern takes from it", async () => {
    const getSource = (length: number) => `
      const box = { size: 1 };
      const isSame = (actual: unknown, expected: unknown) => {
        if (!Object.is(actual, expected)) throw new Error("same");
      };
      var count = 0;
      var g = function* () {
        count += 1;
        yield;
        count += 1;
        yield;
        count += 1;
      };
      var x;
      var result;
      var vals = g();
      result = [...x] = vals;
      isSame(count, 3);
      isSame(result, vals);
      isSame(x.length, ${length});
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain('"same"');
  });

  it("takes a for await's array pattern from the generators that an async yield* yields", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const first = (function* () {
        yield 1;
        yield 2;
        yield 3;
      })();
      const second = (function* () {
        yield 4;
      })();
      const asyncIter = (async function* () {
        yield* [first, second];
      })();
      async function fn() {
        for await (const [a, b] of asyncIter) {
          log += String(a) + String(b) + ";";
        }
      }
      fn();
      Promise.resolve(0)
        .then(() => {
          log += "1";
        })
        .then(() => {
          log += "2";
        })
        .then(() => {
          log += "3";
        });
      setTimeout(() => {
        const rest = first.next();
        log += rest.done ? "done" : "more";
        if (log !== "1212;34undefined;done") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("takes a for await's array pattern from a generator element", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.resolve()
        .then(() => { log = log + "1"; })
        .then(() => { log = log + "2"; })
        .then(() => { log = log + "3"; })
        .then(() => { log = log + "4"; })
        .then(() => { log = log + "5"; });
      function* g() {
        log = log + "g";
        yield 7;
        log = log + "h";
        yield 8;
      }
      const failing = (function* () {
        log = log + "f";
        throw "x";
      })();
      async function fn() {
        for await (const [a] of [g()]) {
          log = log + "a" + a;
        }
        try {
          for await (const [,] of [failing]) {
            log = log + "no";
          }
        } catch (error) {
          log = log + "c" + error;
        }
      }
      fn();
      log = log + "s";
      setTimeout(() => {
        if (log !== "s12ga7345fcx") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs calls that change state inside expressions in order", async () => {
    const result = await checkModel(`
      let count = 0;
      function counter() {
        count += 1;
        return count;
      }
      const values = [counter(), counter()];
      const object = { first: counter(), second: counter() + count };
      if (counter() !== 5) throw new Error("if");
      const total = values[0] + values[1] + object.first + object.second;
      if (total !== 14) throw new Error("total");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a call after an operand that reads what it changes, with the value read before", async () => {
    const result = await checkModel(`
      let count = 0;
      function counter() {
        count += 1;
        return count;
      }
      const total = count + counter();
      if (total !== 1) throw new Error("total");
    `);
    expect(result.status).toBe("deadlock");
  });

  it("rejects running a call before a call whose function reads what it changes", () => {
    expect(() =>
      compile(`
        let count = 0;
        const getCount = (offset: number) => count + offset;
        function counter() {
          count += 1;
          return count;
        }
        const total = getCount(0) + counter();
      `),
    ).toThrow("tla-ts can't run this before what reads what it changes");
  });

  it("describes a property with Reflect.getOwnPropertyDescriptor", async () => {
    const result = await checkModel(`
      const object = {};
      const getter = function () {};
      Object.defineProperty(object, "p", { get: getter, configurable: true });
      const accessor = Reflect.getOwnPropertyDescriptor(object, "p")!;
      if (accessor.enumerable !== false || accessor.get !== getter) throw new Error("accessor");
      const data = Reflect.getOwnPropertyDescriptor({ a: 1 }, "a")!;
      if (data.value !== 1 || data.writable !== true) throw new Error("data");
      const missing = Reflect.getOwnPropertyDescriptor({ a: 1 }, "b");
      if (missing !== undefined) throw new Error("missing");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("converts conditions to booleans in scripts as JavaScript does", async () => {
    const result = await checkModel(`
      let log = "";
      const values: unknown[] = [0, 1, "", "a", null, undefined, {}, [], NaN, -0, false, true];
      for (const value of values) {
        if (value) log = log + "t";
        else log = log + "f";
        if (!value) log = log + "n";
        log = log + (value ? "y" : "x");
      }
      let count = 3;
      while (count) count = count - 1;
      if (log !== "fnxtyfnxtyfnxfnxtytyfnxfnxfnxty" || count !== 0) throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("returns the value of an await that calls an async method", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      class C {
        static async #m(value: number) {
          return await value;
        }
        static async m(value: number) {
          return await this.#m(value);
        }
      }
      C.m(1).then((value: number) => { log = log + value; });
      setTimeout(() => {
        if (log !== "1") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("fulfills Promise.all with each value, or rejects it with the first reason", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.resolve()
        .then(() => { log = log + "1"; })
        .then(() => { log = log + "2"; })
        .then(() => { log = log + "3"; })
        .then(() => { log = log + "4"; })
        .then(() => { log = log + "5"; });
      const later = Promise.resolve(2).then((value: number) => value * 10);
      async function make(value: number) {
        await 0;
        return value + 100;
      }
      Promise.all([1, later, make(3)]).then((values: number[]) => {
        log = log + "a" + values[0] + "," + values[1] + "," + values[2];
      });
      Promise.all([]).then((values: number[]) => {
        log = log + "e" + values.length;
      });
      const rejected = Promise.reject("r");
      Promise.all([later, rejected, make(4)]).then(
        () => { log = log + "no"; },
        (reason: string) => { log = log + "c" + reason; },
      );
      log = log + "s";
      setTimeout(() => {
        if (log !== "s1e02cr3a1,20,10345") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError where call gives a collection's method another receiver", async () => {
    const result = await checkModel(`
      let count = 0;
      const attempt = (callback: () => void) => {
        try {
          callback();
        } catch (error) {
          if (error instanceof TypeError) count = count + 1;
        }
      };
      attempt(() => { Set.prototype.clear.call(false); });
      attempt(() => { Set.prototype.add.call({}, 1); });
      attempt(() => { Set.prototype.has.call(new Map(), 1); });
      attempt(() => { Map.prototype.get.call([], 1); });
      attempt(() => { Map.prototype.set.call(Map.prototype, 1, 2); });
      attempt(() => { WeakMap.prototype.set.call({}, {}, 1); });
      attempt(() => { WeakSet.prototype.add.call(Symbol(), {}); });
      attempt(() => { Set.prototype.values.call(undefined); });
      attempt(() => { Set.prototype.has.call(new WeakSet(), 1); });
      attempt(() => {
        const set = new Set<number>();
        set.clear.call(0);
      });
      if (count !== 10) throw new Error(String(count));
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where a script replaced a collection's method that call runs", async () => {
    const result = await checkModel(`
      Object.defineProperty(Set.prototype, "clear", { value: () => {} });
      Set.prototype.clear.call(false);
    `);
    expect(result.failure?.message).toContain("where a script replaced it");
  });

  it("throws a TypeError where a definition takes a value that isn't an object", async () => {
    const result = await checkModel(`
      let log = "";
      const attempt = (name: string, callback: () => void) => {
        try {
          callback();
          log = log + name + "ok,";
        } catch (error) {
          log = log + name + (error instanceof TypeError ? "T," : "E,");
        }
      };
      attempt("a", () => { Object.defineProperty(5, "foo", {}); });
      attempt("b", () => { Object.defineProperty(undefined, "foo", {}); });
      attempt("c", () => { Object.defineProperty("s", "foo", {}); });
      attempt("d", () => { Object.defineProperty({}, "foo", true); });
      const obj: { property?: unknown } = {};
      attempt("e", () => { Object.defineProperty(obj, "property", Math); });
      attempt("g", () => { Object.defineProperties(null, {}); });
      const described = Object.getOwnPropertyDescriptor(obj, "property");
      log = log + ("property" in obj) + String(obj.property) + (described!.writable === false);
      if (log !== "aT,bT,cT,dT,eok,gT,trueundefinedtrue") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("uses a function that a function called in place declares as a value", async () => {
    const result = await checkModel(`
      let log = 0;
      (function () {
        const obj: { x?: number } = {};
        function getFunc() {
          return 10;
        }
        Object.defineProperty(obj, "x", { get: getFunc });
        log = obj.x!;
      })();
      if (log !== 10) throw new Error(String(log));
    `);
    expect(result.failure).toBeUndefined();
  });

  it("tells that a resolving function that a callback assigns is extensible", async () => {
    const result = await checkModel(`
      var resolveFunction;
      new Promise(function (resolve) {
        resolveFunction = resolve;
      });
      if (!Object.isExtensible(resolveFunction)) throw new Error("not extensible");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where a script reads a promise's properties", async () => {
    const result = await checkModel(`
      const promise = Promise.resolve(3);
      if (promise.finally !== Promise.prototype.finally) throw new Error("no");
    `);
    expect(result.failure?.message).toContain(
      "can't read the properties of a generator or a promise",
    );
  });

  it("joins values that aren't all strings as JavaScript does", async () => {
    const result = await checkModel(`
      const values: unknown[] = [1, "a", undefined, null, true, 2];
      const numbers = [1, 2, 3];
      const label = values.join(",") + "|" + numbers.join("-") + "|" + [].join();
      if (label !== "1,a,,,true,2|1-2-3|") throw new Error(label);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("settles Promise.race with the first element and Promise.allSettled with each", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      Promise.resolve().then(() => { log = log + "1"; }).then(() => { log = log + "2"; }).then(() => { log = log + "3"; }).then(() => { log = log + "4"; });
      const later = Promise.resolve(2).then((value: number) => value * 10);
      const rejected = Promise.reject("r");
      Promise.race([later, 5]).then((value: number) => { log = log + "a" + value; });
      Promise.race([rejected, later]).then(() => { log = log + "no"; }, (reason: string) => { log = log + "b" + reason; });
      Promise.race([later, rejected]).then(() => { log = log + "no2"; }, (reason: string) => { log = log + "c" + reason; });
      Promise.allSettled([1, rejected, later]).then((results) => {
        const first = results[0];
        const second = results[1];
        const value: number = (first as PromiseFulfilledResult<number>).value;
        const reason: string = (second as PromiseRejectedResult).reason;
        log = log + "d" + first.status + value + second.status + reason + results.length;
      });
      Promise.allSettled([]).then((results) => { log = log + "e" + results.length; });
      log = log + "s";
      setTimeout(() => {
        if (log !== "s1e02a5brcr3dfulfilled1rejectedr34") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a ReferenceError where a statement reads a name that nothing declares", async () => {
    const result = await checkModel(`
      let log = "";
      try {
        // @ts-ignore
        w;
        log = log + "no";
      } catch (error) {
        log = log + (error instanceof ReferenceError ? "r" : "o");
      }
      const read = () => {
        // @ts-ignore
        x;
      };
      try {
        read();
      } catch (error) {
        log = log + (error instanceof ReferenceError ? "R" : "O");
      }
      if (log !== "rR") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a ReferenceError where a default that runs names nothing", async () => {
    const result = await checkModel(`
      let log = "";
      class C {
        // @ts-ignore
        method([x = unresolvableReference]: unknown[] = []) {
          log = log + "ran";
        }
        other({ y = 5 }: { y?: number } = {}) {
          log = log + y;
        }
      }
      try {
        new C().method();
      } catch (error) {
        log = log + (error instanceof ReferenceError ? "r" : "o");
      }
      new C().method([1]);
      new C().other();
      if (log !== "rran5") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where a nested pattern destructures an element that an array lacks", async () => {
    const result = await checkModel(`
      const values: { x: number }[][] = [[]];
      const read = () => {
        for (const [{ x }] of values) {
          return;
        }
      };
      read();
      const other: { x: number }[][] = [[{ x: 1 }]];
      for (const [{ x }] of other) {
        if (x !== 1) throw new Error("x");
      }
    `);
    expect(result.failure?.message).toContain("can't throw the TypeError of destructuring");
  });

  it("destructures an array that the heap holds and gives the array back", async () => {
    const source = `
      const holder = { seen: 0 };
      let a: unknown;
      let b: unknown;
      let c: unknown;
      let result: unknown;
      const vals = [1, , 3];
      result = [a, b = 9, c] = vals;
      if (a !== 1 || b !== 9 || c !== 3) throw new Error("values");
      if (result !== vals) throw new Error("identity");
      const [p, q = 5, r] = vals;
      if (p !== 1 || q !== 5 || r !== 3) throw new Error("declared");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    for (const [from, to, message] of [
      ["b !== 9", "b !== 2", "values"],
      ["result !== vals", "result === vals", "identity"],
      ["q !== 5", "q !== 2", "declared"],
    ]) {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    }
  });

  it("reads each element of an array that the heap holds as the pattern reaches it", async () => {
    const source = `
      const holder = { seen: 0 };
      const vals = [1, 2, 3];
      let a: unknown;
      let p: unknown;
      let q: unknown;
      let r: unknown = 9;
      let result: unknown;
      result = [vals[1], a, ...[p, q, r]] = vals;
      if (a !== 1 || p !== 3 || q !== undefined || r !== undefined) throw new Error("read");
      const empty: unknown[] = [];
      let x: unknown = 9;
      result = [empty[1] = 5, x] = empty;
      if (x !== undefined || empty.length !== 2) throw new Error("done");
      if (result !== empty) throw new Error("identity");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    for (const [from, to, message] of [
      ["a !== 1", "a !== 2", "read"],
      ["x !== undefined", "x !== 5", "done"],
    ]) {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    }
  });

  it("rejects a declared pattern that changes objects as it destructures an array that the heap holds", () => {
    expect(() =>
      compile(
        `
          const holder = { y: 0 };
          const vals = [, 2];
          const [p = (holder.y = 1), q] = vals;
          if (p !== 1 || q !== 2) throw new Error("values");
        `,
        "spec.ts",
      ),
    ).toThrow(
      "tla-ts can't destructure an array that the heap holds while the pattern changes objects",
    );
  });

  it("throws the ReferenceError of a name that no declaration binds where the read runs", async () => {
    const source = `
      const holder = { seen: 0 };
      class Failure extends Error {}
      let value: unknown = 2;
      let other: unknown = 0;
      let logical = "";
      let made = "";
      try {
        // @ts-ignore
        value &&= unresolvedName;
      } catch (error) {
        logical = error instanceof ReferenceError ? "ref" : "other";
      }
      // @ts-ignore
      other &&= unresolvedName;
      try {
        // @ts-ignore
        throw new Failure("a" + (unresolvedName + 1));
      } catch (error) {
        made = error instanceof ReferenceError ? "ref" : "other";
      }
      if (logical !== "ref" || value !== 2 || other !== 0) throw new Error("logical");
      if (made !== "ref") throw new Error("new");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    for (const [from, to, message] of [
      ["let value: unknown = 2;", "let value: unknown = 0;", "logical"],
      ['made !== "ref"', 'made === "ref"', "new"],
    ]) {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    }
  });

  it("indexes a list with a key that may not be a number as the index it names", async () => {
    const source = `
      const holder = { seen: "" };
      const list = ["a", "b", "c"];
      const keys: unknown[] = ["1", 2, "length"];
      const joined = list[keys[0] as number] + list[keys[1] as number] + list["0"];
      if (joined !== "bca") throw new Error("joined " + joined);
      holder.seen = joined;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"bca"', '"bcb"');
    expect((await checkModel(wrong)).failure?.message).toContain("joined");
    const named = source.replace(
      "holder.seen = joined;",
      "holder.seen = String(list[keys[2] as number]);",
    );
    expect((await checkModel(named)).failure?.message).toContain(
      "tla-ts can't read this key of an array",
    );
  });

  it("visits a list's indices as strings in a for-in, and indexes the list with them", async () => {
    const source = `
      const holder = { seen: "" };
      const list = Object.keys({ a: 1, b: 2, c: 3 });
      let keys = "";
      let joined = "";
      for (const key in list) {
        keys += key;
        joined += list[key as unknown as number];
      }
      if (keys !== "012") throw new Error("keys " + keys);
      if (joined !== "abc") throw new Error("joined " + joined);
      holder.seen = keys;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    for (const [from, to, message] of [
      ['keys !== "012"', 'keys !== "123"', "keys"],
      ['joined !== "abc"', 'joined !== "bca"', "joined"],
    ]) {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    }
  });

  it("reads an array that the heap holds through for-in, instanceof, and a cast", async () => {
    const source = `
      const holder: { seen: string } = { seen: "" };
      const arr = [1, , 3];
      (arr as unknown as { name: number }).name = 4;
      let keys = "";
      for (const key in arr) keys += key;
      if (keys !== "02name") throw new Error("keys " + keys);
      if (!(arr instanceof Array)) throw new Error("instance");
      if (Object.keys(arr as unknown as object).length !== 3) throw new Error("cast");
      holder.seen = keys;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    for (const [from, to, message] of [
      ['keys !== "02name"', 'keys !== "012name"', "keys"],
      ["!(arr instanceof Array)", "arr instanceof Array", "instance"],
      ["length !== 3", "length !== 2", "cast"],
    ]) {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    }
  });

  it("destructures a rest element into an object pattern", async () => {
    const source = `
      let x: unknown = null;
      let length: unknown;
      let y: unknown;
      [y, ...{ 0: x, length }] = [1, 2, 3];
      if (y !== 1 || x !== 2 || length !== 2) throw new Error("rest");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("length !== 2", "length !== 3");
    expect((await checkModel(wrong)).failure?.message).toContain("rest");
  });

  it("stops where a promise resolves with an array that Array.prototype gives a then", async () => {
    const result = await checkModel(`
      Object.defineProperty(Array.prototype, "then", {
        value: (resolve: (value: unknown) => void) => { resolve(5); },
        configurable: true,
      });
      Promise.all([]);
    `);
    expect(result.failure?.message).toContain(
      "can't resolve a promise with an object that has a then",
    );
  });

  it("evaluates the left operand of a comma and gives the right one", async () => {
    const result = await checkModel(`
      const holder = { count: 1 };
      // @ts-ignore
      const value = (holder.count, 2);
      if (value !== 2) throw new Error("comma");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("keeps a WeakMap's and a WeakSet's object keys", async () => {
    const result = await checkModel(`
      const foo = {};
      const bar = {};
      let map = new WeakMap<object, number>([[foo, 42]]);
      map.set(bar, 1);
      map.delete(foo);
      let seen = new WeakSet<object>();
      seen.add(foo);
      if (map.has(foo) || map.get(bar) !== 1 || !seen.has(foo) || seen.has(bar)) {
        throw new Error("weak");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError where a WeakMap's method gets a Map", async () => {
    const result = await checkModel(`
      const foo = {};
      const map = new WeakMap<object, number>();
      let threw = false;
      try {
        map.delete.call(new Map(), foo);
      } catch (error) {
        threw = error instanceof TypeError;
      }
      if (!threw) throw new Error("misreceived");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a module's body after the jobs that settle what it awaits", async () => {
    const result = await checkModel(`
      const holder = {};
      let log = "";
      Promise.resolve().then(() => { log = log + "a"; }).then(() => { log = log + "c"; });
      log = log + "0";
      await undefined;
      log = log + "b";
      let caught: unknown = undefined;
      try {
        await Promise.reject(holder);
      } catch (thrown) {
        caught = thrown;
      }
      const five = await Promise.resolve(5);
      log = log + (caught === holder ? "d" : "x") + five;
      if (log !== "0abcd5") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads a hole as undefined where its array goes straight into a pattern", async () => {
    const result = await checkModel(`
      const holder = {};
      let log = "";
      const read = ([x = 23]: (number | undefined)[]) => {
        log = log + x;
      };
      read([,]);
      const [y = 5, z] = [, 2];
      let w: number | undefined;
      [w = 7] = [,];
      log = log + y + z + w;
      if (log !== "23527") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("rejects a hole in an array that no variable holds", () => {
    expect(() => compile("const holder = {};\nconst items = [[1, , 3]];")).toThrow(
      "Unsupported expression",
    );
  });

  it("evaluates a statement that only reads", async () => {
    const result = await checkModel(`
      const box = { get value(): number { throw new Error("getter"); } };
      void await null;
      typeof box;
      box.value;
    `);
    expect(result.failure?.message).toContain("getter");
  });

  it("fails where a module's body awaits a promise that rejects", async () => {
    const result = await checkModel(`
      const holder = {};
      await Promise.reject(holder);
    `);
    expect(result.failure?.message).toContain("await Promise.reject(holder)");
  });

  it("gives whether a set or a map held the key it deletes", async () => {
    const result = await checkModel(`
      let seen = new Set<number>([1, 2]);
      const gone = seen.delete(2);
      const missing = seen.delete(3);
      let named = new Map<string, number>([["a", 1]]);
      const dropped = named.delete("a");
      if (!gone || missing || seen.has(2) || !seen.has(1) || !dropped || named.has("a")) {
        throw new Error("delete");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError where a WeakMap gets a registered symbol", async () => {
    const result = await checkModel(`
      let map = new WeakMap<symbol, number>();
      const own = Symbol();
      map.set(own, 0);
      let threw = false;
      try {
        map.set(Symbol.for("key"), 1);
      } catch (error) {
        threw = error instanceof TypeError;
      }
      if (!threw || map.get(own) !== 0) throw new Error("registered");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where a new WeakMap gets a registered symbol", async () => {
    const result = await checkModel(`
      const key = Symbol.for("key");
      try {
        let map = new WeakMap<symbol, number>([[key, 0]]);
      } catch (error) {}
    `);
    expect(result.failure?.message).toContain("tla-ts can't throw the TypeError of a new WeakMap");
  });

  it("gives a WeakMap WeakMap.prototype", async () => {
    const result = await checkModel(`
      const holder = {};
      if (Object.getPrototypeOf(new WeakMap()) !== WeakMap.prototype) throw new Error("prototype");
      if (Object.prototype.toString.call(new WeakSet()) !== "[object WeakSet]") {
        throw new Error("tag");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("rejects a script that assigns a collection's method", () => {
    expect(() =>
      compile(`
        const holder = {};
        const add = WeakSet.prototype.add;
        WeakSet.prototype.add = function (value) {
          return add.call(this, value);
        };
      `),
    ).toThrow("tla-ts can't replace a collection's methods");
  });

  it("evaluates the operand of void and gives undefined", async () => {
    const result = await checkModel(`
      const holder = { count: 1 };
      const values = [void 0, void holder.count];
      if (values[0] !== undefined || values[1] !== undefined || values.length !== 2) {
        throw new Error("void");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("names a default function through parentheses but not through a comma", async () => {
    const result = await checkModel(`
      let log = "";
      const holder = {};
      const read = ([
        cover = (function () {}),
        // @ts-ignore
        xCover = (0, function () {}),
        // @ts-ignore
        arrow = (0, () => 1),
      ]: unknown[]) => {
        log = log + (cover as Function).name + "," + (xCover as Function).name + "," + (arrow as Function).name;
      };
      read([]);
      if (log !== "cover,,") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("calls a function that a function body declares", async () => {
    const result = await checkModel(`
      let log = "";
      function outer() {
        function inner() { log = log + "i"; }
        inner();
        inner();
      }
      outer();
      if (log !== "ii") throw new Error(log);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("calls async methods with their object as this", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const object = {
        count: 1,
        async method(step: number) {
          log = log + "m" + this.count;
          await 0;
          this.count = this.count + step;
          return this.count;
        },
      };
      class C {
        value = 5;
        async get() {
          return this.value;
        }
      }
      object.method(2).then((value: number) => { log = log + "v" + value; });
      new C().get().then((value: number) => { log = log + "c" + value; });
      log = log + "s";
      setTimeout(() => {
        if (log !== "m1sc5v3") throw new Error(log);
      });
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where a script replaces an async method before calling it", async () => {
    const result = await checkModel(`
      let log = "";
      const object = {
        async method() { log = log + "original"; },
      };
      object.method = async () => { log = log + "replaced"; };
      object.method();
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell which method this call runs");
  });

  it("stops where a timer finds a promise's handler threw", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let caught: unknown = undefined;
      Promise.resolve(1)
        .then(() => { throw new Error("handler"); })
        .catch((error: unknown) => { caught = error; });
      setTimeout(() => {
        if (caught === undefined) throw new Error("not caught");
        throw new Error("caught");
      });
    `);
    expect(result.failure?.message).toContain("A timer threw an exception");
  });

  it("stops where a script replaces Promise.prototype.then", async () => {
    const result = await checkModel(`
      const original = Promise.prototype.then;
      Promise.prototype.then = function (this: Promise<unknown>, onFulfilled: unknown) {
        return original.call(this, onFulfilled as never);
      } as never;
      Promise.resolve(1).then(() => {});
    `);
    expect(result.failure?.message).toContain("where a script replaced it");
  });

  it("runs a class's static fields and blocks in order as a script loads", async () => {
    const result = await check(
      compile(
        `let order = "";\nclass Counter {\n  static #count = 1;\n  static { order += "a" + this.#count; }\n  static total = Counter.#count + 1;\n  static { order += "b" + this.total; }\n  static #read() { return this.#count; }\n  static read() { return Counter.#read(); }\n}\nif (order !== "a1b2" || Counter.read() !== 1 || Object.keys(Counter).join() !== "total") throw new Error("missed");`,
      ),
    );
    expect(result.failure).toBeUndefined();
  });

  it("rejects unknown tags", () => {
    expect(() =>
      compile(`let count = 0;\n/** @fiar */\nexport const step = () => { count++; };`),
    ).toThrow("Unknown tag: @fiar");
  });
});

describe("without a file system", () => {
  const directory = dirname(ts.getDefaultLibFilePath({}));
  const libraries = new Map(
    readdirSync(directory)
      .filter((fileName) => /^lib\..*\.d\.ts$/.test(fileName))
      .map((fileName) => [fileName, readFileSync(join(directory, fileName), "utf8")]),
  );

  it("compiles with TypeScript's declaration files passed in", () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/examples/die-hard/die-hard.ts");
    const source = readFileSync(path, "utf8");
    const compiled = compile(source, "die-hard.ts", libraries);
    const expected = compile(source, "die-hard.ts");
    expect([printModule(compiled.source), compiled.config]).toEqual([
      printModule(expected.source),
      expected.config,
    ]);
  });

  it("reports type errors", () => {
    expect(() => compile(`let count: number = "one";`, "spec.ts", libraries)).toThrow(
      "spec.ts(1,5): error TS2322: Type 'string' is not assignable to type 'number'.",
    );
  });
});

describe("regions", () => {
  const getLinks = (source: string) => {
    const printed = printRegions(compile(source));
    return printed.regions.map((region) => [
      region.kind,
      region.name,
      source.slice(region.source.start, region.source.end),
      printed.text.slice(region.output.start, region.output.end),
    ]);
  };

  it("links each definition to the statement it compiles from", () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/examples/die-hard/die-hard.ts");
    const links = getLinks(readFileSync(path, "utf8"));
    expect(links).toContainEqual(["variable", "big", "big", "big"]);
    expect(links).toContainEqual(["init", "small", "let small = 0;", "small = 0"]);
    expect(links).toContainEqual([
      "action",
      "fillSmallJug",
      "export const fillSmallJug = () => {\n  small = 3;\n};",
      "fillSmallJug == /\\ small' = 3\n                /\\ UNCHANGED <<big>>",
    ]);
    expect(links).toContainEqual([
      "next",
      "fillSmallJug",
      "export const fillSmallJug = () => {\n  small = 3;\n};",
      "fillSmallJug",
    ]);
    expect(links).toContainEqual([
      "predicate",
      "notSolved",
      "export const notSolved = () => big !== 4;",
      "notSolved == big # 4",
    ]);
  });

  it("links helpers, steps with parameters, and properties", () => {
    const links = getLinks(`type Id = 1 | 2;
let owner: Id = 1;
const other = (id: Id): Id => (id === 1 ? 2 : 1);
export const pass = (id: Id) => {
  if (owner !== id) return;
  owner = other(id);
};
/** @eventually */
export const returns = () => owner === 1;
`);
    expect(links).toContainEqual([
      "definition",
      "other",
      "const other = (id: Id): Id => (id === 1 ? 2 : 1);",
      "other(id_1) == IF id_1 = 1 THEN 2 ELSE 1",
    ]);
    expect(links).toContainEqual([
      "next",
      "pass",
      "export const pass = (id: Id) => {\n  if (owner !== id) return;\n  owner = other(id);\n};",
      "\\E id \\in {1, 2} : pass(id)",
    ]);
    expect(links).toContainEqual([
      "property",
      "returns",
      "export const returns = () => owner === 1;",
      "returns == <>(owner = 1)",
    ]);
  });

  it("links a step to its disjunct of Next, not to its fairness condition", () => {
    const source = `let ticks = 0;
/** @fair */
export const tick = () => {
  if (ticks >= 2) return;
  ticks += 1;
};
/** @eventually */
export const finishes = () => ticks === 2;
`;
    const printed = printRegions(compile(source));
    const next = printed.regions.find((region) => region.kind === "next");
    expect(next?.output.start).toBe(printed.text.indexOf("Next == tick") + "Next == ".length);
  });

  it("links each use of a state variable to its declaration", () => {
    const source = `let count = 0;
const limit = 3;
export const step = () => {
  if (count >= limit) return;
  count = count + 1;
};
`;
    const compiled = compile(source);
    const declaration = compiled.regions.find((region) => region.kind === "variable");
    const references = compiled.regions.filter(
      (region) => region.kind === "read" || region.kind === "write",
    );
    expect(
      references.map((region) => source.slice(region.source.start, region.source.end)),
    ).toEqual(["count", "count", "count"]);
    expect(references.map((region) => region.output)).toEqual(
      references.map(() => declaration?.output),
    );
  });

  it("tells the uses that assign, increment, or mutate a state variable from those that read it", () => {
    const source = `let count = 0;
let log: number[] = [];
let pair = [0, 0];
export const step = () => {
  if (count >= 3) return;
  count = count + 1;
  log.push(count);
};
export const reset = () => {
  count++;
  log[0] = log.length;
  [pair[0], count] = [count, 0];
};
`;
    const references = compile(source)
      .regions.filter((region) => region.kind === "read" || region.kind === "write")
      .map((region) => [region.kind, source.slice(region.source.start, region.source.end)]);
    expect(references).toEqual([
      ["read", "count"],
      ["write", "count"],
      ["read", "count"],
      ["write", "log"],
      ["read", "count"],
      ["write", "count"],
      ["write", "log"],
      ["read", "log"],
      ["write", "pair"],
      ["write", "count"],
      ["read", "count"],
    ]);
  });
});

describe("state variables", () => {
  it("gives each variable's TypeScript type, split into union members, and its initializer", () => {
    const compiled = compile(`type Data = "d1" | "d2";
let val: Data;
let rdy!: 0 | 1;
let count = 0;
let done = false;
export const step = () => {
  count = count + 1;
};
`);
    expect(compiled.variables).toEqual([
      { name: "val", types: ['"d1"', '"d2"'], initial: undefined },
      { name: "rdy", types: ["0", "1"], initial: undefined },
      { name: "count", types: ["number"], initial: "0" },
      { name: "done", types: ["false", "true"], initial: "false" },
    ]);
  });
});

describe("proxies", () => {
  it("runs a proxy's get and has traps with the target, the key, and the proxy", async () => {
    const result = await checkModel(`
      const target: { attr: number; other?: number } = { attr: 1 };
      let seen: unknown[] = [];
      const handler = {
        get: function (this: unknown, inner: object, key: string | symbol, receiver: unknown) {
          seen = [this, inner, key, receiver];
          return 2;
        },
        has: function (inner: object, key: string | symbol) {
          return key === "other";
        },
      };
      const proxy = new Proxy<typeof target>(target, handler);
      if (proxy.attr !== 2) throw new Error("get");
      if (proxy["other"] !== 2) throw new Error("get");
      if (seen[0] !== handler || seen[1] !== target || seen[2] !== "other" || seen[3] !== proxy) {
        throw new Error("arguments");
      }
      if ("attr" in proxy) throw new Error("has");
      if (!("other" in proxy)) throw new Error("has");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("forwards to the target where the handler has no trap", async () => {
    const result = await checkModel(`
      const target: { attr: number; other?: number } = { attr: 1 };
      const proxy = new Proxy(target, {});
      if (proxy.attr !== 1) throw new Error("get");
      if (proxy.other !== undefined) throw new Error("get");
      if (!("attr" in proxy)) throw new Error("has");
      if ("other" in proxy) throw new Error("has");
      if (typeof proxy !== "object" || typeof new Proxy(function () {}, {}) !== "function") {
        throw new Error("typeof");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError where a trap disagrees with a property the target can't change", async () => {
    const result = await checkModel(`
      const target: { fixed?: number } = {};
      Object.defineProperty(target, "fixed", { value: 1 });
      const getting = new Proxy(target, { get: () => 2 });
      const hiding = new Proxy(target, { has: () => false });
      let count = 0;
      try { getting.fixed; } catch (error) { if (error instanceof TypeError) count += 1; }
      try { "fixed" in hiding; } catch (error) { if (error instanceof TypeError) count += 1; }
      if (count !== 2) throw new Error("missed");
      if (new Proxy(target, { get: () => 1 }).fixed !== 1) throw new Error("same");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError where a script reads a revoked proxy", async () => {
    const result = await checkModel(`
      const revocable = Proxy.revocable({ attr: 1 }, {});
      if (revocable.proxy.attr !== 1) throw new Error("read");
      revocable.revoke();
      if (revocable.revoke() !== undefined) throw new Error("revoke");
      let isThrown = false;
      try { revocable.proxy.attr; } catch (error) { isThrown = error instanceof TypeError; }
      if (!isThrown || typeof revocable.revoke !== "function") throw new Error("missed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a proxy's set and deleteProperty traps, and Reflect's", async () => {
    const result = await checkModel(`
      const target: { attr?: number; fixed?: number } = {};
      let seen: unknown[] = [];
      const handler = {
        set: function (inner: object, key: string | symbol, value: unknown, receiver: unknown) {
          seen = [inner, key, value, receiver];
          return true;
        },
      };
      const proxy = new Proxy<typeof target>(target, handler);
      proxy.attr = 3;
      if (seen[0] !== target || seen[1] !== "attr" || seen[2] !== 3 || seen[3] !== proxy) {
        throw new Error("arguments");
      }
      if ("attr" in target) throw new Error("set");
      const refusing = new Proxy(target, { set: () => false, deleteProperty: () => false });
      if (Reflect.set(refusing, "attr", 1) !== false) throw new Error("Reflect.set");
      if (Reflect.deleteProperty(refusing, "attr") !== false) throw new Error("Reflect.deleteProperty");
      let count = 0;
      try { refusing.attr = 1; } catch (error) { if (error instanceof TypeError) count += 1; }
      try { delete refusing.attr; } catch (error) { if (error instanceof TypeError) count += 1; }
      if (count !== 2) throw new Error("strict");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("sets and deletes the target's key where the handler has no trap", async () => {
    const result = await checkModel(`
      const target: { attr?: number; fixed?: number } = {};
      Object.defineProperty(target, "fixed", { value: 1 });
      const proxy = new Proxy(target, {});
      proxy.attr = 5;
      if (target.attr !== 5) throw new Error("set");
      delete proxy.attr;
      if ("attr" in target) throw new Error("delete");
      let count = 0;
      try { proxy.fixed = 2; } catch (error) { if (error instanceof TypeError) count += 1; }
      try { delete proxy.fixed; } catch (error) { if (error instanceof TypeError) count += 1; }
      const lying = new Proxy(target, { set: () => true, deleteProperty: () => true });
      try { lying.fixed = 2; } catch (error) { if (error instanceof TypeError) count += 1; }
      try { delete lying.fixed; } catch (error) { if (error instanceof TypeError) count += 1; }
      if (count !== 4) throw new Error("fixed");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a proxy's getOwnPropertyDescriptor trap and checks the descriptor it gives", async () => {
    const getSource = (expected: number) => `
      const target: { attr?: number; fixed?: number } = { attr: 1 };
      Object.defineProperty(target, "fixed", { value: 2 });
      let seen: unknown[] = [];
      const handler = {
        getOwnPropertyDescriptor: function (this: unknown, inner: object, key: string | symbol) {
          seen = [this, inner, key];
          return key === "attr" ? { value: 5, configurable: true } : undefined;
        },
      };
      const proxy = new Proxy(target, handler);
      const described = Object.getOwnPropertyDescriptor(proxy, "attr");
      if (described === undefined || described.value !== ${expected}) throw new Error("unexpected");
      if (described.writable !== false || described.enumerable !== false) throw new Error("fields");
      if (seen[0] !== handler || seen[1] !== target || seen[2] !== "attr") throw new Error("seen");
      if (Reflect.getOwnPropertyDescriptor(proxy, "other") !== undefined) throw new Error("other");
      let count = 0;
      try { Object.getOwnPropertyDescriptor(proxy, "fixed"); } catch (error) { if (error instanceof TypeError) count += 1; }
      if (count !== 1) throw new Error("fixed");
      const forwarding = new Proxy(target, {});
      const forwarded = Object.getOwnPropertyDescriptor(forwarding, "fixed");
      if (forwarded === undefined || forwarded.value !== 2 || forwarded.configurable) {
        throw new Error("forward");
      }
    `;
    expect((await checkModel(getSource(5))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
  });

  it("runs a proxy's ownKeys trap and checks the keys it gives", async () => {
    const getSource = (expected: string) => `
      const target: { attr?: number; hidden?: number } = { attr: 1 };
      Object.defineProperty(target, "hidden", { value: 2, configurable: true });
      let seen: unknown[] = [];
      const handler = {
        ownKeys: function (this: unknown, inner: object) {
          seen = [this, inner];
          return ["hidden", "attr", "extra"];
        },
      };
      const proxy = new Proxy(target, handler);
      const keys = Object.keys(proxy);
      if (keys.length !== 1 || keys[0] !== "${expected}") throw new Error("unexpected");
      if (seen[0] !== handler || seen[1] !== target) throw new Error("seen");
      const names = Object.getOwnPropertyNames(proxy);
      if (names.length !== 3 || names[0] !== "hidden" || names[2] !== "extra") throw new Error("names");
      const forwarded = Reflect.ownKeys(new Proxy(target, {}));
      if (forwarded.length !== 2 || forwarded[1] !== "hidden") throw new Error("forward");
      let count = 0;
      try { Object.keys(new Proxy({}, { ownKeys: () => ["a", "a"] })); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.keys(new Proxy({}, { ownKeys: () => [1] as unknown as string[] })); } catch (error) { if (error instanceof TypeError) count += 1; }
      const fixed: { fixed?: number } = {};
      Object.defineProperty(fixed, "fixed", { value: 1 });
      try { Object.keys(new Proxy(fixed, { ownKeys: () => [] })); } catch (error) { if (error instanceof TypeError) count += 1; }
      const closed = {};
      Object.preventExtensions(closed);
      try { Object.keys(new Proxy(closed, { ownKeys: () => ["new"] })); } catch (error) { if (error instanceof TypeError) count += 1; }
      if (count !== 4) throw new Error("checks");
    `;
    expect((await checkModel(getSource("attr"))).failure).toBeUndefined();
    expect((await checkModel(getSource("hidden"))).failure?.message).toContain("unexpected");
  });

  it("runs a proxy's prototype and extensibility traps and checks what they give", async () => {
    const getSource = (expected: number) => `
      const parent = {};
      const target = {};
      let seen: unknown[] = [];
      const handler = {
        getPrototypeOf: function (this: unknown, inner: object) {
          seen = [this, inner];
          return parent;
        },
        setPrototypeOf: function (inner: object, prototype: object | null) {
          seen = [inner, prototype];
          return true;
        },
        isExtensible: function (inner: object) {
          return true;
        },
        preventExtensions: function (inner: object) {
          return false;
        },
      };
      const proxy = new Proxy(target, handler);
      if (Object.getPrototypeOf(proxy) !== parent) throw new Error("getPrototypeOf");
      if (seen[0] !== handler || seen[1] !== target) throw new Error("seen");
      if (Object.setPrototypeOf(proxy, null) !== proxy) throw new Error("setPrototypeOf");
      if (seen[0] !== target || seen[1] !== null) throw new Error("set seen");
      if (Object.getPrototypeOf(target) !== Object.prototype) throw new Error("unchanged");
      if (!Object.isExtensible(proxy)) throw new Error("isExtensible");
      if (Reflect.preventExtensions(proxy) !== false) throw new Error("preventExtensions");
      let count = 0;
      try { Object.preventExtensions(proxy); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.isExtensible(new Proxy({}, { isExtensible: () => false })); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.preventExtensions(new Proxy({}, { preventExtensions: () => true })); } catch (error) { if (error instanceof TypeError) count += 1; }
      const closed = {};
      Object.preventExtensions(closed);
      try { Object.getPrototypeOf(new Proxy(closed, { getPrototypeOf: () => parent })); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.setPrototypeOf(new Proxy(closed, { setPrototypeOf: () => true }), parent); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.getPrototypeOf(new Proxy({}, { getPrototypeOf: () => 1 as unknown as object })); } catch (error) { if (error instanceof TypeError) count += 1; }
      if (count !== ${expected}) throw new Error("unexpected");
      const forwarding = new Proxy(target, {});
      if (Object.setPrototypeOf(forwarding, parent) !== forwarding) throw new Error("forward set");
      if (Reflect.getPrototypeOf(forwarding) !== parent) throw new Error("forward get");
      if (Object.preventExtensions(forwarding) !== forwarding) throw new Error("forward prevent");
      if (Reflect.isExtensible(forwarding) !== false) throw new Error("forward isExtensible");
      if (Reflect.setPrototypeOf(forwarding, null) !== false) throw new Error("forward refuse");
    `;
    expect((await checkModel(getSource(6))).failure).toBeUndefined();
    expect((await checkModel(getSource(5))).failure?.message).toContain("unexpected");
  });

  it("runs a proxy's defineProperty trap with a copy of the descriptor and checks it", async () => {
    const getSource = (expected: boolean) => `
      const target: { attr?: number; fixed?: number } = {};
      Object.defineProperty(target, "fixed", { value: 1, writable: true });
      let seen: unknown[] = [];
      const handler = {
        defineProperty: function (
          this: unknown,
          inner: object,
          key: string | symbol,
          descriptor: PropertyDescriptor,
        ) {
          seen = [this, inner, key, descriptor.value, descriptor.enumerable, "writable" in descriptor];
          return true;
        },
      };
      const proxy = new Proxy(target, handler);
      if (Object.defineProperty(proxy, "attr", { value: 3, enumerable: true }) !== proxy) {
        throw new Error("define");
      }
      if (seen[0] !== handler || seen[1] !== target || seen[2] !== "attr" || seen[3] !== 3) {
        throw new Error("seen");
      }
      if (seen[4] !== true || seen[5] !== ${expected}) throw new Error("unexpected");
      if ("attr" in target) throw new Error("trapped");
      const refusing = new Proxy(target, { defineProperty: () => false });
      if (Reflect.defineProperty(refusing, "attr", { value: 1 }) !== false) throw new Error("refuse");
      let count = 0;
      try { Object.defineProperty(refusing, "attr", { value: 1 }); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.defineProperty(proxy, "attr", { value: 1, configurable: false }); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.defineProperty(proxy, "fixed", { value: 1, writable: false }); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.defineProperty(proxy, "fixed", { value: 1, configurable: true }); } catch (error) { if (error instanceof TypeError) count += 1; }
      if (count !== 4) throw new Error("checks");
      const forwarding = new Proxy(target, {});
      Object.defineProperty(forwarding, "attr", { value: 4, configurable: true });
      if (target.attr !== 4) throw new Error("forward");
      if (Reflect.defineProperty(forwarding, "fixed", { get: () => 1 }) !== false) {
        throw new Error("forward refuse");
      }
    `;
    expect((await checkModel(getSource(false))).failure).toBeUndefined();
    expect((await checkModel(getSource(true))).failure?.message).toContain("unexpected");
  });

  it("runs a proxy's apply and construct traps and checks what construct gives", async () => {
    const getSource = (expected: number) => `
      const target = function (value: number) { return value + 1; };
      let seen: unknown[] = [];
      const handler = {
        apply: function (this: unknown, inner: object, receiver: unknown, values: unknown[]) {
          seen = [this, inner, receiver, values.length, values[0]];
          return 7;
        },
      };
      const proxy = new Proxy<typeof target>(target, handler);
      if (proxy(3) !== ${expected}) throw new Error("unexpected");
      if (seen[0] !== handler || seen[1] !== target || seen[2] !== undefined || seen[4] !== 3) {
        throw new Error("seen");
      }
      class Point { x = 0; constructor(left?: number, right?: number) {} }
      const made = { x: 2 };
      const constructing = new Proxy<typeof Point>(Point, {
        construct: function (inner: object, values: unknown[], newTarget: unknown) {
          seen = [inner, values.length, newTarget];
          return made;
        },
      });
      const point: unknown = new constructing(1, 2);
      if (point !== made) throw new Error("construct");
      if (seen[0] !== Point || seen[1] !== (2 as unknown) || seen[2] !== constructing) {
        throw new Error("construct seen");
      }
      let count = 0;
      const revocable = Proxy.revocable(function () {}, {});
      revocable.revoke();
      try { revocable.proxy(); } catch (error) { if (error instanceof TypeError) count += 1; }
      const primitive = new Proxy<typeof Point>(Point, { construct: () => 1 as unknown as object });
      try { new primitive(); } catch (error) { if (error instanceof TypeError) count += 1; }
      if (count !== 2) throw new Error("checks");
    `;
    expect((await checkModel(getSource(7))).failure).toBeUndefined();
    expect((await checkModel(getSource(8))).failure?.message).toContain("unexpected");
  });

  it("forwards through a proxy target whose handler has no trap either", async () => {
    const getSource = (expected: number) => `
      const target: { attr?: number; hidden?: number } = { attr: 1 };
      Object.defineProperty(target, "hidden", { value: 2 });
      const outer = new Proxy(new Proxy(target, {}), {});
      if (Object.getPrototypeOf(outer) !== Object.prototype) throw new Error("getPrototypeOf");
      const array = new Proxy(new Proxy([], {}), {});
      if (Object.getPrototypeOf(array) !== Array.prototype) throw new Error("array");
      if (!Object.isExtensible(outer)) throw new Error("isExtensible");
      if (outer.attr !== 1) throw new Error("get");
      if (!("hidden" in outer)) throw new Error("has");
      const described = Object.getOwnPropertyDescriptor(outer, "hidden");
      if (described === undefined || described.value !== 2 || described.enumerable) {
        throw new Error("describe");
      }
      const keys = Object.keys(outer);
      if (keys.length !== 1 || keys[0] !== "attr") throw new Error("keys");
      if (Reflect.ownKeys(outer).length !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
  });

  it("seals and freezes a proxy through its preventExtensions trap", async () => {
    const getSource = (isRefusing: boolean) => `
      let calls = 0;
      const target: { attr: number; extra?: number } = { attr: 1 };
      const proxy = new Proxy(target, {});
      if (Object.isFrozen(proxy)) throw new Error("frozen early");
      if (Object.seal(proxy) !== proxy) throw new Error("seal");
      if (!Object.isSealed(target)) throw new Error("sealed");
      if (Object.isFrozen(proxy)) throw new Error("frozen");
      Object.freeze(proxy);
      if (!Object.isFrozen(target)) throw new Error("freeze");
      const counted = new Proxy({ attr: 1 }, {
        preventExtensions(innerTarget) {
          calls += 1;
          Object.preventExtensions(innerTarget);
          return ${!isRefusing};
        },
      });
      let isThrown = false;
      try {
        Object.freeze(counted);
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (calls !== 1 || isThrown) throw new Error("unexpected");
      if (!Object.isFrozen(counted)) throw new Error("counted");
    `;
    expect((await checkModel(getSource(false))).failure).toBeUndefined();
    expect((await checkModel(getSource(true))).failure?.message).toContain("unexpected");
  });

  it("reads the values and entries of a proxy whose handlers trap none of their reads", async () => {
    const getSource = (expected: number) => `
      const proxy = new Proxy(new Proxy({ first: 1, second: 2 }, {}), {});
      const values = Object.values(proxy);
      const entries = Object.entries(proxy);
      if (entries.length !== 2 || entries[1][0] !== "second") throw new Error("entries");
      if (values[1] !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
  });

  it("runs IsArray through proxies, throwing a TypeError for a revoked one", async () => {
    const getSource = (isRevoked: boolean) => `
      const handle = Proxy.revocable<unknown[]>([], {});
      const nested = new Proxy(handle.proxy, {});
      const plain = new Proxy({}, {});
      if (!Array.isArray(nested) || Array.isArray(plain)) throw new Error("isArray");
      if (Object.prototype.toString.call(nested) !== "[object Array]") throw new Error("toString");
      const json = JSON.stringify({ first: 1, second: 2 }, new Proxy(["second"], {}));
      if (json !== '{"second":2}') throw new Error("replacer");
      const written = JSON.stringify(new Proxy({ first: [1] }, {}));
      if (written !== '{"first":[1]}') throw new Error("value");
      ${isRevoked ? "handle.revoke();" : ""}
      let isThrown = false;
      try {
        Object.prototype.toString.call(handle.proxy);
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (isThrown) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(false))).failure).toBeUndefined();
    expect((await checkModel(getSource(true))).failure?.message).toContain("unexpected");
  });

  it("runs the traps of a proxy's target where the proxy's handler has none", async () => {
    const getSource = (expected: number) => `
      const log: string[] = [];
      const inner = new Proxy<{ attr?: number }>({ attr: 1 }, {
        get(innerTarget, key, receiver) {
          log.push("get");
          return key === "attr" ? 5 : undefined;
        },
        deleteProperty(innerTarget, key) {
          log.push("delete");
          return true;
        },
      });
      const outer = new Proxy(inner, {});
      if (outer.attr !== 5) throw new Error("get");
      delete outer.attr;
      if (log.length !== 2 || log[1] !== "delete") throw new Error("log");
      const revocable = Proxy.revocable({ attr: 1 }, {});
      const holding = new Proxy(revocable.proxy, {});
      revocable.revoke();
      let isThrown = false;
      try {
        const read = holding.attr;
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown) throw new Error("revoked");
      if (inner.attr !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(5))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
  });

  it("calls and constructs through proxies and Reflect", async () => {
    const getSource = (expected: number) => `
      let calls = 0;
      let seen: unknown;
      const sum = (left: number, right: number) => left + right;
      const summing = new Proxy(new Proxy(sum, {}), {});
      if (summing(1, 2) !== 3) throw new Error("apply");
      if (Reflect.apply(summing, undefined, [3, 4]) !== 7) throw new Error("Reflect.apply");
      const Target = new Proxy(function () {} as unknown as new (...values: number[]) => { sum: number }, {
        construct(innerTarget, values, newTarget) {
          calls += 1;
          seen = newTarget;
          return { sum: values[0] + values[1] };
        },
      });
      const Outer = new Proxy(Target, { construct: undefined });
      function NewTarget() {}
      const made: { sum: number } = Reflect.construct(Outer, [3, 4], NewTarget);
      if (calls !== 1 || seen !== NewTarget) throw new Error("construct");
      if (made.sum !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(7))).failure).toBeUndefined();
    expect((await checkModel(getSource(12))).failure?.message).toContain("unexpected");
  });

  it("runs a trap on the left of a short-circuit or in a condition first", async () => {
    const getSource = (expected: number) => `
      const log: string[] = [];
      const proxy = new Proxy<{ attr: number }>({ attr: 1 }, {
        get(innerTarget, key) {
          log.push("get");
          return 2;
        },
      });
      if (proxy.attr !== 2 || log.length !== 1) throw new Error("or");
      if (proxy.attr === 2 && log.length < 2) throw new Error("and");
      const fallback: number = 0;
      const picked = Reflect.has(proxy, "attr") ? log.length : fallback;
      if (picked !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
  });

  it("runs a proxy's traps on each key that Object's functions read", async () => {
    const getSource = (expected: number) => `
      const log: unknown[] = [];
      const getCount = (): number => log.length;
      const symbol = Symbol();
      const target: Record<string | symbol, number> = {};
      target[symbol] = 1;
      target.foo = 2;
      target[0] = 3;
      const proxy = new Proxy(target, {
        getOwnPropertyDescriptor(innerTarget, key) {
          log.push(key);
          return Reflect.getOwnPropertyDescriptor(innerTarget, key);
        },
      });
      const keys = Object.keys(proxy);
      if (keys.length !== 2 || keys[0] !== "0" || keys[1] !== "foo") throw new Error("keys");
      if (getCount() !== 2 || log[1] !== "foo") throw new Error("log");
      const values = Object.values(proxy);
      if (values.length !== 2 || values[1] !== 2 || getCount() !== 4) throw new Error("values");
      const copy: Record<string | symbol, number> = {};
      Object.assign(copy, proxy);
      if (copy.foo !== 2 || copy[symbol] !== 1 || getCount() !== 7 || log[6] !== symbol) {
        throw new Error("assign");
      }
      if (Object.isFrozen(proxy)) throw new Error("isFrozen");
      Object.freeze(proxy);
      if (getCount() !== 10 || !Object.isFrozen(target)) throw new Error("freeze");
      if (!Object.isFrozen(proxy) || getCount() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(13))).failure).toBeUndefined();
    expect((await checkModel(getSource(10))).failure?.message).toContain("unexpected");
  });

  it("throws what a trap on a key throws, and a TypeError where it disagrees", async () => {
    const getSource = (isExtensible: boolean) => `
      const seen: (string | symbol)[] = [];
      const listed = [Symbol(), "foo", "0"];
      class Marked extends Error {}
      const source = new Proxy<{ attr: number | null }>({ attr: null }, {
        getOwnPropertyDescriptor() {
          throw new Marked();
        },
      });
      let isMarked = false;
      try {
        Object.assign({}, source);
      } catch (error) {
        isMarked = error instanceof Marked;
      }
      if (!isMarked) throw new Error("marked");
      const listing = new Proxy({}, {
        getOwnPropertyDescriptor(innerTarget, key) {
          seen.push(key);
          return undefined;
        },
        ownKeys() {
          return listed;
        },
      });
      Object.assign({}, listing);
      if (seen.length !== 3 || seen[0] !== listed[0] || seen[2] !== "0") throw new Error("order");
      const fixed = {};
      Object.defineProperty(fixed, "kept", { value: 1 });
      const lying = new Proxy(fixed, {
        getOwnPropertyDescriptor() {
          return undefined;
        },
      });
      ${isExtensible ? "" : "Object.preventExtensions(fixed);"}
      let isTypeError = false;
      try {
        Object.isFrozen(lying);
      } catch (error) {
        isTypeError = error instanceof TypeError;
      }
      if (!isTypeError) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(false))).failure).toBeUndefined();
    expect((await checkModel(getSource(true))).failure?.message).toContain("unexpected");
  });

  it("copies a proxy's enumerable keys in a spread, a rest element, and its descriptors", async () => {
    const getSource = (expected: number) => `
      const seen: (string | symbol)[] = [];
      const getCount = (): number => seen.length;
      const symbol = Symbol();
      const listed = [symbol, "foo", "0", "hidden"];
      const proxy = new Proxy<Record<string, number>>({}, {
        getOwnPropertyDescriptor(innerTarget, key) {
          seen.push(key);
          return key === "hidden"
            ? undefined
            : { value: 1, writable: true, enumerable: key !== "0", configurable: true };
        },
        get(innerTarget, key) {
          return key === "foo" ? 7 : 9;
        },
        ownKeys() {
          return listed;
        },
      });
      const spread: Record<string | symbol, number> = { ...proxy };
      if (getCount() !== 4 || spread.foo !== 7 || spread[symbol] !== 9 || "0" in spread) {
        throw new Error("spread");
      }
      const { ...rest }: Record<string | symbol, number> = proxy;
      if (getCount() !== 8 || rest.foo !== 7 || Object.keys(rest).length !== 1) {
        throw new Error("rest");
      }
      const described = Object.getOwnPropertyDescriptors(proxy);
      if (described.foo.value !== 1 || described[0].enumerable || "hidden" in described) {
        throw new Error("descriptors");
      }
      if (getCount() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(12))).failure).toBeUndefined();
    expect((await checkModel(getSource(11))).failure?.message).toContain("unexpected");
  });

  it("defines the descriptors that a proxy gives Object.defineProperties", async () => {
    const getSource = (expected: number) => `
      const seen: (string | symbol)[] = [];
      const getCount = (): number => seen.length;
      const symbol = Symbol();
      const target: PropertyDescriptorMap = {};
      target[symbol] = { value: 1, enumerable: true };
      target.foo = { get: () => 5 };
      target[0] = { value: 3 };
      const proxy = new Proxy(target, {
        getOwnPropertyDescriptor(innerTarget, key) {
          seen.push(key);
          return Reflect.getOwnPropertyDescriptor(innerTarget, key);
        },
      });
      const made: Record<string | symbol, unknown> = {};
      Object.defineProperties(made, proxy);
      if (getCount() !== 3 || seen[0] !== "0" || seen[2] !== symbol) throw new Error("order");
      if (made.foo !== 5 || made[0] !== 3 || made[symbol] !== 1) throw new Error("defined");
      if (Object.keys(made).length !== 0) throw new Error("enumerable");
      let isTypeError = false;
      try {
        Object.defineProperties(1 as unknown as object, proxy);
      } catch (error) {
        isTypeError = error instanceof TypeError;
      }
      if (!isTypeError || getCount() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(3))).failure).toBeUndefined();
    expect((await checkModel(getSource(4))).failure?.message).toContain("unexpected");
  });

  it("runs Reflect.defineProperty in a trap that Object.seal runs", async () => {
    const getSource = (expected: number) => `
      const target: Record<string | symbol, number> = {};
      const symbol = Symbol();
      target[symbol] = 1;
      target.foo = 2;
      target[0] = 3;
      const keys: (string | symbol)[] = [];
      const getCount = (): number => keys.length;
      const proxy = new Proxy(target, {
        defineProperty(innerTarget, key, descriptor) {
          keys.push(key);
          return Reflect.defineProperty(innerTarget, key, descriptor);
        },
      });
      Object.seal(proxy);
      if (keys[0] !== "0" || keys[2] !== symbol || !Object.isSealed(target)) throw new Error("seal");
      if (getCount() !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(3))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("unexpected");
  });

  it("spreads a proxy beside plain properties, in the order that they run", async () => {
    const getSource = (expected: number) => `
      let reads = 0;
      const symbol = Symbol();
      const proxy = new Proxy<Record<string | symbol, number>>({ attr: 1, other: 2 }, {
        get(innerTarget, key) {
          reads += 1;
          return 5;
        },
      });
      const made: Record<string | symbol, number> = {
        [symbol]: 0,
        attr: 0,
        first: reads,
        ...proxy,
        last: reads,
      };
      const keys = Reflect.ownKeys(made);
      if (made.attr !== 5 || keys[0] !== "attr" || keys[3] !== "last" || keys[4] !== symbol) {
        throw new Error("order");
      }
      if (made.first !== 0 || made.last !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(0))).failure?.message).toContain("unexpected");
  });

  it("reads each key that a pattern names through a proxy's traps, in order", async () => {
    const getSource = (expected: string) => `
      const log: (string | symbol)[] = [];
      const getCount = (): number => log.length;
      const proxy = new Proxy<Record<string | symbol, number>>(
        { attr: 1, other: 2, 0: 3, last: 4 },
        {
          get(innerTarget, key) {
            log.push(key);
            return innerTarget[key];
          },
          getOwnPropertyDescriptor(innerTarget, key) {
            log.push(typeof key === "string" ? \`d:\${key}\` : key);
            return Reflect.getOwnPropertyDescriptor(innerTarget, key);
          },
        },
      );
      const { attr } = proxy;
      if (attr !== 1 || getCount() !== 1) throw new Error("attr");
      const { other, 0: zero, missing = 9, ...rest } = proxy;
      if (other !== 2 || zero !== 3 || missing !== 9) throw new Error("values");
      if (log[1] !== "other" || log[2] !== "0" || log[3] !== "missing") throw new Error("order");
      if (rest.attr !== 1 || rest.last !== 4 || "other" in rest || "0" in rest) {
        throw new Error("rest");
      }
      if (getCount() !== 8 || log[4] !== "d:attr" || log[5] !== "${expected}") {
        throw new Error("unexpected");
      }
    `;
    expect((await checkModel(getSource("attr"))).failure).toBeUndefined();
    expect((await checkModel(getSource("last"))).failure?.message).toContain("unexpected");
  });

  it("looks up the traps of a handler that's a proxy through its get trap", async () => {
    const getSource = (expected: string) => `
      let log = "";
      const getLog = (): string => log;
      const object = { a: 0, b: 0 };
      const handler: ProxyHandler<{ a: number; b: number }> = {
        get(target, key) {
          log += \`|get:\${typeof key === "string" ? key : "symbol"}\`;
          return 1;
        },
      };
      const check: ProxyHandler<ProxyHandler<{ a: number; b: number }>> = {
        get(target, key) {
          log += \`|trap:\${typeof key === "string" ? key : "symbol"}\`;
          return key in target ? target[key as keyof typeof target] : undefined;
        },
      };
      const proxy = new Proxy(object, new Proxy(handler, check));
      if (proxy.a !== 1 || getLog() !== "|trap:get|get:a") throw new Error("get");
      const keys = Object.keys(proxy);
      if (keys.length !== 2) throw new Error("keys");
      if (getLog() !== "${expected}") throw new Error("unexpected");
    `;
    const expected =
      "|trap:get|get:a|trap:ownKeys|trap:getOwnPropertyDescriptor|trap:getOwnPropertyDescriptor";
    expect((await checkModel(getSource(expected))).failure).toBeUndefined();
    expect((await checkModel(getSource("|trap:get|get:a"))).failure?.message).toContain(
      "unexpected",
    );
  });

  it("stops the check where something else reads a proxy", async () => {
    const result = await checkModel(`
      const proxy = new Proxy({ attr: { value: 1 } }, {});
      Object.create({}, proxy);
    `);
    expect(result.failure?.message).toContain("tla-ts can't run a proxy's internal method here");
  });
});

describe("regular expressions", () => {
  it("stop where a regexp without objects would keep a lastIndex", async () => {
    const result = await checkModel(`
      const pattern = /a/g;
      let found = pattern.test("aa");
    `);
    expect(result.failure?.message).toContain("tla-ts can't keep the lastIndex");
  });

  it("stop where a class can't tell a character outside ASCII", async () => {
    const result = await checkModel(`
      let found = /[^\\u00e0-\\u05ff]/.test("é");
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell whether a class matches");
  });

  it("keep a regexp's lastIndex on the heap as exec and string methods set it", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      const pattern = /a(b)?/g;
      const first = pattern.exec("xab ab");
      if (first === null || first[0] !== "ab" || first[1] !== "b" || first.index !== 1) {
        throw new Error("first");
      }
      if (first.input !== "xab ab" || pattern.lastIndex !== 3) throw new Error("lastIndex");
      const second = pattern.exec("xab ab");
      if (second === null || second.index !== 4 || second[1] !== "b") throw new Error("second");
      const third = pattern.exec("xab ab");
      const after: number = pattern.lastIndex;
      if (third !== null || after !== 0) throw new Error("third");
      pattern.lastIndex = 4;
      if (!pattern.test("xab ab") || pattern.lastIndex !== 6) throw new Error("test");
      pattern.lastIndex = 2;
      if ("abcb".search(pattern) !== 0 || (pattern.lastIndex as number) !== 2) {
        throw new Error("search");
      }
      if ("a-b-c".replace(/-/g, "+") !== "a+b+c") throw new Error("replace");
      if ("ab".replace(pattern, "$&!") !== "ab!") throw new Error("global replace");
      if ((pattern.lastIndex as number) !== 0) throw new Error("replace's lastIndex");
      const sticky = /b/y;
      sticky.lastIndex = 1;
      if ("abb".replace(sticky, "c") !== "acb" || (sticky.lastIndex as number) !== 2) {
        throw new Error("sticky");
      }
      const parts = "a1b2c".split(/(\\d)/, 4);
      if (parts.length !== 4 || parts[3] !== "2") throw new Error("split");
      const all = "a1b22".match(/\\d+/g);
      if (all === null || all.length !== 2 || all[1] !== "22") throw new Error("match");
      const named = /(?<word>\\w+)/.exec("hi there");
      if (named === null || named.groups === undefined || named.groups.word !== "hi") {
        throw new Error("groups");
      }
      const made = new RegExp("a/b", "gi");
      if (made.source !== "a\\\\/b" || made.flags !== "gi") throw new Error("made");
      if (!made.test("A/B")) throw new Error("made's test");
    `);
    expect(result.status).toBe("deadlock");
  });

  it("hold an array on the heap where a script gives it a property other than an index", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      var expected = ["ab", "b"];
      // @ts-ignore
      expected.index = 1;
      const found = /a(b)/.exec("xab");
      // @ts-ignore
      if (found === null || found.index !== expected.index || found.length !== expected.length) {
        throw new Error("expected");
      }
      for (var position = 0; position < expected.length; position++) {
        if (found[position] !== expected[position]) throw new Error("element");
      }
    `);
    expect(result.status).toBe("deadlock");
  });

  it("throw the TypeError of replaceAll with a regexp that isn't global", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      let isThrown = false;
      try {
        "ab".replaceAll(/b/, "c");
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown) throw new Error("replaceAll");
    `);
    expect(result.status).toBe("deadlock");
  });

  it("throw the SyntaxError of new RegExp with a pattern that isn't valid", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      let name = "none";
      try {
        throw new Error("made " + new RegExp("a**"));
      } catch (error) {
        name = error instanceof SyntaxError ? "SyntaxError" : "other";
      }
      if (name !== "SyntaxError") throw new Error(name);
    `);
    expect(result.status).toBe("deadlock");
  });

  it("run a replace function for each match where a script has objects", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      const escapes = new Map([["a", "A"], ["\\n", "\\\\n"]]);
      const escape = (text: string) =>
        text.replace(
          /[a\\n\\x00-\\x1f]/g,
          (character) =>
            escapes.get(character) ??
            \`\\\\u\${character.charCodeAt(0).toString(16).padStart(4, "0")}\`,
        );
      if (escape("xa\\n\\x01") !== "xA\\\\n\\\\u0001") throw new Error("escape");
      const sticky = /(b)(c)?/y;
      sticky.lastIndex = 1;
      const swapped = "abcb".replace(
        sticky,
        (all, first, second, at, whole) => \`[\${all}\${first}\${second}\${at}\${whole}]\`,
      );
      if (swapped !== "a[bcbc1abcb]b" || sticky.lastIndex !== 3) throw new Error("sticky");
      const global = /b/g;
      global.lastIndex = 2;
      const counted = "abab".replace(global, () => String(global.lastIndex));
      if (counted !== "a0a0") throw new Error("counted");
    `);
    expect(result.status).toBe("deadlock");
  });

  it("stop where a replace function would take the object of a match's groups", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      const grouped = "ab".replace(/(?<letter>b)/, (all, letter, at, whole, groups) =>
        groups === undefined ? "none" : all,
      );
    `);
    expect(result.failure?.message).toContain("tla-ts can't pass a replace function");
  });

  it("call a regexp literal's method in an expression where a script has objects", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      const isWord = (character: string) => /[A-Za-z0-9_]/.test(character);
      const read = (source: string, at: number) => {
        const character = source[at];
        if (character === "\\\\" && /[a-z]/.test(source[at + 1] ?? "")) return "word";
        if (character === "+" && isWord(source[at + 1] ?? "")) return "plus";
        return "none";
      };
      if (read("x\\\\in", 1) !== "word" || read("+a", 0) !== "plus") throw new Error("read");
      if (read("+-", 0) !== "none") throw new Error("none");
      if (holder.tag === "made" && "a-b".split(/-/).length !== 2) throw new Error("split");
      if (holder.tag === "made" && "a.b".replace(/\\./g, "!") !== "a!b") throw new Error("replace");
    `);
    expect(result.status).toBe("deadlock");
  });

  it("stop where a script changed the method that a regexp literal's call reads", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      RegExp.prototype.test = () => false;
      const found = holder.tag === "made" && /a/.test("a");
    `);
    expect(result.failure?.message).toContain("tla-ts can't call a regexp's method");
  });

  it("read a call's result through an optional chain where a script has objects", async () => {
    const result = await checkModel(`
      const holder: { tag?: string } = {};
      holder.tag = "made";
      const rest = "abc";
      const number = /^\\d+/.exec(rest)?.[0];
      if (number !== undefined) throw new Error("number");
      const word = /^[a-z]+/.exec(rest)?.[0];
      if (word !== "abc") throw new Error("word");
    `);
    expect(result.status).toBe("deadlock");
  });

  it("stop where a script changed what a regexp's method reads", async () => {
    const result = await checkModel(`
      const pattern = /a/;
      Object.defineProperty(pattern, "exec", { value: () => null });
      let found = pattern.test("a");
    `);
    expect(result.failure?.message).toContain("tla-ts can't call a regexp's method");
  });

  it("stop where a regexp with the u flag matches text outside ASCII", async () => {
    const result = await checkModel(`
      let found = /./u.test("😀");
    `);
    expect(result.failure?.message).toContain("tla-ts can't match a regexp with the u flag");
  });

  it("run a String object's regexp methods on its string", async () => {
    const result = await checkModel(`
      const text = new String("hello");
      const pieces = text.split(/l/);
      if (pieces.length !== 3 || pieces[0] !== "he" || pieces[2] !== "o") throw new Error("split");
      const found = text.match(/l+/);
      if (found === null || found[0] !== "ll") throw new Error("match");
      if (text.replace(/l/g, "L") !== "heLLo") throw new Error("replace " + text.replace(/l/g, "L"));
      if (text.search(/l+o/) !== 2) throw new Error("search");
    `);
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(`
      const text = new String("hello");
      if (text.search(/lo/) !== 4) throw new Error("wrong");
    `);
    expect(wrong.failure?.message).toContain("wrong");
    const replaced = await checkModel(`
      const text = new String("hello");
      Object.defineProperty(text, "toString", { value: () => "other" });
      if (text.split(/l/).length !== 3) throw new Error("split");
    `);
    expect(replaced.failure?.message).toContain("tla-ts can't");
  });

  it("search and match with a regexp that a string's pattern makes", async () => {
    const result = await checkModel(`
      const text = new String("hello");
      if (text.search("l+o") !== 2 || "a.c".search(".") !== 0 || "abc".search("x") !== -1) {
        throw new Error("search");
      }
    `);
    expect(result.failure).toBeUndefined();
    const matched = await checkModel(`
      const found = "abcabc".match("b(c)");
      if (found === null || found[1] !== "c" || found.index !== 1) throw new Error("match");
    `);
    expect(matched.failure).toBeUndefined();
    const wrong = await checkModel(`
      const text = new String("hello");
      if (text.search("lo") !== 4) throw new Error("wrong");
    `);
    expect(wrong.failure?.message).toContain("wrong");
  });
});

describe("calls through values", () => {
  it("returns an object that a function called through a variable makes", async () => {
    const result = await checkModel(`
      type Factory = (a: number, b: unknown) => unknown;
      function add(a: number, b: unknown) { return a + (b as number); }
      function make(a: number, b: unknown) { return new Int8Array(a); }
      const fs: Factory[] = [add, make];
      let out = "";
      for (let k = 0; k < fs.length; ++k) {
        const factory = fs[k];
        const made = factory(3, 2);
        out += typeof made + ";";
      }
      const run = (f: (a: number) => void) => { for (let k = 0; k < 2; ++k) f(k); };
      run(function (k) { const factory = fs[k]; const made = factory(3, 2); out += typeof made + ";"; });
      if (out !== "number;object;number;object;") throw new Error(out);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("skips a function that a callback takes but doesn't name", async () => {
    const result = await checkModel(`
      const marker = new Uint8Array(1);
      const each = (f: (value: number, make: (inner: unknown) => unknown) => void) => {
        for (let k = 0; k < 2; ++k) {
          const base = k;
          f(base, function (inner: unknown) { return [base, inner]; });
        }
      };
      let out = 0;
      each(function (value) { out += value; });
      if (out !== 1) throw new Error("sum");
    `);
    expect(result.failure).toBeUndefined();
  });
});

describe("buffers", () => {
  it("copies a typed array's elements into another, and makes one through its constructor", async () => {
    const getSource = (expected: string) => `
      const grow = <T extends Uint8Array<ArrayBuffer> | Int32Array<ArrayBuffer>>(array: T): T => {
        const grown = new (array.constructor as new (length: number) => T)(2 * array.length);
        grown.set(array);
        return grown;
      };
      let kinds = new Uint8Array(2);
      kinds[1] = 3;
      kinds = grow(kinds);
      const source = new Uint8Array([1, 255, 3]);
      const target = new Int32Array(5);
      target.set(source, 1);
      const bytes = new Uint8Array(3);
      bytes.set(new Int32Array([-1, 256]));
      let threw = "";
      try {
        target.set(source, 3);
      } catch (error) {
        threw = error instanceof RangeError ? "range" : "other";
      }
      const result = [
        kinds.length,
        kinds[1],
        kinds instanceof Uint8Array,
        target.join(","),
        bytes.join(","),
        threw,
        target.set(source),
      ].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect(
      (await checkModel(getSource("4;3;true;0,1,255,3,0;255,0,0;range;"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(getSource("4;3;true;0,1,255,3,0;255,1,0;range;"))).failure?.message,
    ).toContain("255,0,0");
  });

  it("reads and writes the elements of typed arrays that share a buffer", async () => {
    const result = await checkModel(`
      const buffer = new ArrayBuffer(8);
      if (buffer.byteLength !== 8) throw new Error("byteLength");
      const bytes = new Uint8Array(buffer);
      if (bytes[2] !== 0 || bytes.length !== 8) throw new Error("bytes");
      bytes[3] = 300;
      if (bytes[3] !== 44) throw new Error("wrap");
      if (bytes[9] !== undefined) throw new Error("oob");
      const signed = new Int8Array(buffer, 3, 2);
      if (signed[0] !== 44 || signed.length !== 2 || signed.byteOffset !== 3) throw new Error("signed");
      bytes[4] = 255;
      if (signed[1] !== -1) throw new Error("negative");
      const floats = new Float64Array([1, -2, 1024]);
      if (floats[0] !== 1 || floats[1] !== -2 || floats[2] !== 1024) throw new Error("floats");
      const halves = new Uint16Array(new Uint8Array([1, 2, 3]));
      if (halves[2] !== 3 || halves.byteLength !== 6) throw new Error("copy");
      if (!(1 in halves) || 3 in halves) throw new Error("in");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("gets and sets a DataView's numbers, in either byte order", async () => {
    const result = await checkModel(`
      const buffer = new ArrayBuffer(12, { maxByteLength: 16 });
      const view = new DataView(buffer, 2);
      view.setUint8(0, 200);
      if (view.getUint8(0) !== 200) throw new Error("get");
      if (view.getInt8(0) !== -56) throw new Error("int8");
      view.setInt16(1, -2);
      if (view.getInt16(1) !== -2) throw new Error("int16");
      if (view.getUint8(1) !== 255) throw new Error("int16 high");
      if (view.getUint8(2) !== 254) throw new Error("int16 low");
      if (view.getUint16(1, true) !== 65279) throw new Error("little");
      view.setFloat64(0, -1024);
      if (view.getFloat64(0) !== -1024) throw new Error("float");
      view.setFloat32(4, NaN);
      if (!Number.isNaN(view.getFloat32(4))) throw new Error("nan");
      view.setFloat16(0, -0);
      if (!Object.is(view.getFloat16(0), -0)) throw new Error("minus zero");
      let caught = "";
      try { view.getInt32(8); } catch (error) { caught = error instanceof RangeError ? "range" : "other"; }
      if (caught !== "range") throw new Error("range");
      const before: number = view.byteLength;
      if (before !== 10) throw new Error("length");
      buffer.resize(16);
      if (view.byteLength !== 14) throw new Error("resize");
      if (buffer.byteLength !== 16) throw new Error("buffer resize");
      view.setInt32(10, 2147483647);
      if (view.getInt32(10) !== 2147483647) throw new Error("max");
      view.setInt32(10, -2147483647);
      if (view.getInt32(10) !== -2147483647) throw new Error("min");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("calls RegExp.prototype's getters that a descriptor holds on any receiver", async () => {
    const getSource = (expected: string) => `
      const global = Object.getOwnPropertyDescriptor(RegExp.prototype, "global")!.get!;
      const flags = Object.getOwnPropertyDescriptor(RegExp.prototype, "flags")!.get!;
      const source = Object.getOwnPropertyDescriptor(RegExp.prototype, "source")!.get!;
      if (global.call(/a/g) !== true) throw new Error("global");
      if (global.call(/a/) !== false) throw new Error("not global");
      if (global.call(RegExp.prototype) !== undefined) throw new Error("prototype");
      if (source.call(RegExp.prototype) !== "(?:)") throw new Error("source");
      if (flags.call(/a/gimsuy) !== "gimsuy") throw new Error("flags");
      if (flags.call(RegExp.prototype) !== "") throw new Error("no flags");
      const flagged: Record<string, unknown> = { global: 1, multiline: 0, sticky: "y" };
      if (flags.call(flagged) !== "${expected}") throw new Error("unexpected");
      for (const receiver of [undefined, 3, {}, []]) {
        let isTypeError = false;
        try { global.call(receiver); } catch (error) { isTypeError = error instanceof TypeError; }
        if (!isTypeError) throw new Error("receiver");
      }
      let isTypeError = false;
      try { global.call(() => {}); } catch (error) { isTypeError = error instanceof TypeError; }
      if (!isTypeError) throw new Error("function");
    `;
    expect((await checkModel(getSource("gy"))).failure).toBeUndefined();
    expect((await checkModel(getSource("gmy"))).failure?.message).toContain("unexpected");
  });

  it("reads a regexp's flag through a key that it computes", async () => {
    const getSource = (expected: boolean) => `
      const sample = /^|^/;
      const key: string = ["glo", "bal"].join("");
      const sourceKey: string = ["sou", "rce"].join("");
      const flagged = sample as unknown as Record<string, unknown>;
      if ((/ab/g as unknown as Record<string, unknown>)[sourceKey] !== "ab") throw new Error("source");
      if (flagged[key] !== ${expected}) throw new Error("unexpected");
    `;
    expect((await checkModel(getSource(false))).failure).toBeUndefined();
    await expect(checkModel(getSource(true))).rejects.toThrow("unexpected");
  });

  it("calls the getters of a symbol's description and an object's __proto__", async () => {
    const result = await checkModel(`
      const description = Object.getOwnPropertyDescriptor(Symbol.prototype, "description")!.get!;
      const proto = Object.getOwnPropertyDescriptor(Object.prototype, "__proto__")!.get!;
      const symbol = Symbol("test");
      const empty = Symbol();
      if (description.call(symbol) !== "test") throw new Error("description");
      if (description.call(empty) !== undefined) throw new Error("empty");
      let isTypeError = false;
      try { description.call("test"); } catch (error) { isTypeError = error instanceof TypeError; }
      if (!isTypeError) throw new Error("string");
      const parent = {};
      const plain = {};
      if (proto.call(plain) !== Object.prototype) throw new Error("object");
      const child: object = Object.create(parent);
      if (proto.call(child) !== parent) throw new Error("parent");
      isTypeError = false;
      try { proto.call(null); } catch (error) { isTypeError = error instanceof TypeError; }
      if (!isTypeError) throw new Error("null");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("slices a buffer's bytes into a new buffer", async () => {
    const result = await checkModel(`
      const buffer = new ArrayBuffer(6);
      const bytes = new Uint8Array(buffer);
      bytes[1] = 1;
      bytes[2] = 2;
      bytes[4] = 4;
      const copy = buffer.slice(1, -1);
      if (copy.byteLength !== 4) throw new Error("length");
      const copied = new Uint8Array(copy);
      if (copied[0] !== 1 || copied[1] !== 2 || copied[3] !== 4) throw new Error("bytes");
      copied[0] = 9;
      if (bytes[1] !== 1) throw new Error("shared");
      if (buffer.slice(4, 2).byteLength !== 0) throw new Error("empty");
      if (buffer.slice(-2).byteLength !== 2) throw new Error("negative");
      if (Object.getPrototypeOf(copy) !== ArrayBuffer.prototype) throw new Error("prototype");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("constructs the typed array that a variable holds", async () => {
    const result = await checkModel(`
      const constructors = [Int8Array, Uint16Array, Float64Array];
      let sizes = "";
      for (const TA of constructors) {
        const sample = new TA(3);
        sample[1] = -1;
        sizes += sample.byteLength + "," + sample[1] + ";";
      }
      if (sizes !== "3,-1;6,65535;24,-1;") throw new Error(sizes);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads the properties of the typed array constructor that a variable holds", async () => {
    const result = await checkModel(`
      const constructors = [Int8Array, Float64Array, Float16Array];
      let sizes = 0;
      let names = "";
      for (const TA of constructors) {
        sizes += TA.BYTES_PER_ELEMENT;
        names += TA.name;
      }
      if (sizes !== 11) throw new Error("sizes");
      if (names !== "Int8ArrayFloat64ArrayFloat16Array") throw new Error(names);
      const TypedArray: Int8ArrayConstructor = Object.getPrototypeOf(Int8Array);
      const typedArrays = [TypedArray];
      if (typedArrays[0] !== Object.getPrototypeOf(Float16Array)) throw new Error("prototype");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("makes a typed array of the values of an iterator that a script gives", async () => {
    const result = await checkModel(`
      interface ArrayValues {
        src: unknown[];
        index: number;
        next: (this: ArrayValues) => IteratorResult<unknown>;
      }
      interface ArrayIterable {
        src: unknown[];
        [Symbol.iterator]: (this: ArrayIterable) => ArrayValues;
      }
      function stepValues(this: ArrayValues): IteratorResult<unknown> {
        if (this.index < this.src.length) {
          const value = this.src[this.index];
          this.index += 1;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      }
      function openValues(this: ArrayIterable): ArrayValues {
        return { src: this.src, index: 0, next: stepValues };
      }
      function make(elements: unknown[]): unknown {
        return { src: elements, [Symbol.iterator]: openValues };
      }
      const constructors = [Int8Array, Float64Array];
      let out = "";
      for (const TA of constructors) {
        const sample = new TA(make([1, -2, 3]) as never);
        out += sample.length + ":" + sample[1] + ";";
      }
      if (out !== "3:-2;3:-2;") throw new Error(out);
      const plain = new Uint8Array(make([]) as never);
      if (plain.length !== 0) throw new Error("empty");
      function failing(this: ArrayValues): IteratorResult<unknown> {
        throw new RangeError("step");
      }
      function openFailing(this: ArrayIterable): ArrayValues {
        return { src: this.src, index: 0, next: failing };
      }
      const failingIterable: unknown = { src: [], [Symbol.iterator]: openFailing };
      let caught = "";
      try {
        const failed = new Int16Array(failingIterable as never);
      } catch (error) {
        caught = error instanceof RangeError ? "range" : "other";
      }
      if (caught !== "range") throw new Error("caught " + caught);
    `);
    expect(result.failure).toBeUndefined();
  });

  it("makes a typed array of an array-like object's elements", async () => {
    const result = await checkModel(`
      const like: { [index: number]: unknown; length: number } = { length: 3 };
      like[0] = 4;
      like[1] = "5";
      const fromLike = new Int8Array(like as never);
      if (fromLike.length !== 3 || fromLike[1] !== 5 || fromLike[2] !== 0) throw new Error("like");
      const values: unknown[] = [];
      values[0] = 1;
      values[1] = 2;
      const fromArray = new Uint16Array(values as never);
      if (fromArray.length !== 2 || fromArray[1] !== 2) throw new Error("array");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("assigns a typed array of an iterator's values or an array-like object's elements", async () => {
    const result = await checkModel(`
      function openNone(this: unknown) {
        return { next: stepNone };
      }
      function stepNone(this: unknown) {
        return { value: 7, done: true };
      }
      const like: unknown = { length: 2, 0: 3, 1: 4 };
      let sample = new Int8Array(1);
      sample = new Int8Array(like as never);
      if (sample.length !== 2 || sample[1] !== 4) throw new Error("assigned");
      const empty: unknown = { [Symbol.iterator]: openNone };
      sample = new Int8Array(empty as never);
      if (sample.length !== 0) throw new Error("empty");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("runs a typed array's methods", async () => {
    const result = await checkModel(`
      const check = (actual: unknown, expected: unknown, label: string) => {
        if (!Object.is(actual, expected)) throw new Error(label);
      };
      const sample = new Int16Array([5, -1, 5, NaN, 7]);
      check(sample.at(-1), 7, "at");
      check(sample.at(9), undefined, "at past");
      check(sample.includes(-1), true, "includes");
      check(sample.includes(5, 3), false, "includes from");
      check(sample.indexOf(5, 1), 2, "indexOf");
      check(sample.indexOf(9), -1, "indexOf missing");
      check(sample.lastIndexOf(5), 2, "lastIndexOf");
      check(sample.lastIndexOf(5, -4), 0, "lastIndexOf from");
      check(sample.join("-"), "5--1-5-0-7", "join");
      check(sample.fill(3, 1, -2), sample, "fill");
      check(sample.join(), "5,3,3,0,7", "filled");
      sample.reverse();
      check(sample.join(), "7,0,3,3,5", "reverse");
      const sliced = sample.slice(1, 3);
      sliced[0] = 9;
      check(sliced.join(), "9,3", "slice");
      check(sample[1], 0, "slice copies");
      check(sliced instanceof Int16Array, true, "slice kind");
      const floats = new Float64Array([NaN, -0]);
      check(floats.includes(NaN), true, "NaN includes");
      check(floats.indexOf(NaN), -1, "NaN indexOf");
      check(floats.indexOf(0), 1, "zero indexOf");
      check(floats.join(), "NaN,0", "float join");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError from a method of a typed array out of its buffer's bounds", async () => {
    const result = await checkModel(`
      const buffer = new ArrayBuffer(4, { maxByteLength: 8 });
      const sample = new Int8Array(buffer, 0, 4);
      buffer.resize(2);
      let threw = false;
      try {
        sample.fill(3);
      } catch (error) {
        threw = error instanceof TypeError;
      }
      if (!threw) throw new Error("out of bounds");
      const tracking = new Int8Array(buffer);
      tracking.fill(6);
      if (tracking.join() !== "6,6") throw new Error("tracking");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads the length and elements of an array or a typed array typed as array-like", async () => {
    const result = await checkModel(`
      function compareArray(a: ArrayLike<unknown>, b: ArrayLike<unknown>) {
        if (b.length !== a.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!Object.is(b[i], a[i])) return false;
        }
        return true;
      }
      const sample = new Int8Array([42, 43, -0]);
      sample.reverse();
      if (!compareArray(sample, [0, 43, 42])) throw new Error("reverse");
      if (compareArray(sample, [0, 43])) throw new Error("shorter");
      if (compareArray(sample, [0, 43, 42, undefined])) throw new Error("longer");
      const values = [1, NaN];
      if (!compareArray(values, [1, NaN])) throw new Error("NaN");
      if (compareArray(values, [1, 2])) throw new Error("other");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("makes a typed array's subarray, which views the same buffer", async () => {
    const result = await checkModel(`
      const check = (actual: unknown, expected: unknown, label: string) => {
        if (!Object.is(actual, expected)) throw new Error(label);
      };
      const sample = new Int16Array([1, 2, 3, 4, 5]);
      const middle = sample.subarray(1, -1);
      check(middle.length, 3, "length");
      check(middle.byteOffset, 2, "offset");
      check(middle.buffer, sample.buffer, "shares");
      middle[0] = 9;
      check(sample[1], 9, "writes through");
      const rest = sample.subarray(-2);
      check(rest.join(), "4,5", "rest");
      const none = sample.subarray(4, 1);
      check(none.length, 0, "empty");
      check(none.byteOffset, 8, "empty offset");
      const buffer = new ArrayBuffer(4, { maxByteLength: 8 });
      const tracking = new Int8Array(buffer);
      const tail = tracking.subarray(1);
      const fixed = tracking.subarray(1, undefined);
      check(tail.length, 3, "tail");
      buffer.resize(6);
      check(tail.length, 5, "tail tracks");
      check(fixed.length, 5, "explicit undefined tracks");
      const bounded = tracking.subarray(1, 3);
      buffer.resize(8);
      check(bounded.length, 2, "bounded stays");
      const fixedView = new Int8Array(buffer, 0, 8);
      const later = new Int8Array(buffer, 4, 4);
      buffer.resize(2);
      const outOfBounds = fixedView.subarray(1, 2);
      check(outOfBounds.length, 0, "zero view");
      let thrown = "";
      try {
        later.subarray(1, 2);
      } catch (error) {
        thrown = error instanceof RangeError ? "RangeError" : "other";
      }
      check(thrown, "RangeError", "past the end");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("throws a TypeError where a typed array's method runs through call on another value", async () => {
    const result = await checkModel(`
      function throws(expected: Function, func: () => unknown, message: string) {
        try {
          func();
        } catch (thrown) {
          if (typeof thrown !== "object" || thrown === null) throw new Error(message);
          if (thrown.constructor !== expected) throw new Error(message);
          return;
        }
        throw new Error(message);
      }
      const TypedArray: Int8ArrayConstructor = Object.getPrototypeOf(Int8Array);
      const copyWithin = TypedArray.prototype.copyWithin;
      const fill = TypedArray.prototype.fill;
      throws(TypeError, function () {
        copyWithin.call({}, 0, 0);
      }, "object");
      throws(TypeError, function () {
        copyWithin.call([], 0, 0);
      }, "array");
      const buffer = new ArrayBuffer(8);
      throws(TypeError, function () {
        copyWithin.call(buffer, 0, 0);
      }, "buffer");
      throws(TypeError, function () {
        fill.call(undefined, 0);
      }, "undefined");
      throws(TypeError, function () {
        fill.call(42, 0);
      }, "number");
      const sample = new Int8Array(2);
      fill.call(sample, 3);
      if (sample[1] !== 3) throw new Error("fill");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops at a number a typed array's float can't hold exactly", async () => {
    const result = await checkModel(`
      const floats = new Float32Array(1);
      floats[0] = 16777217;
    `);
    expect(result.failure?.message).toContain("tla-ts can't round a number to a float");
  });

  it("stops where something else reads a typed array's properties", async () => {
    const result = await checkModel(`
      const bytes = new Uint8Array(2);
      const keys = Object.keys(bytes);
      if (keys.length !== 2) throw new Error("keys");
    `);
    expect(result.failure?.message).toContain("tla-ts can't");
  });
});

describe("BigInts", () => {
  it("computes with BigInts and tells them from numbers", async () => {
    const result = await checkModel(`
      const a = 7n;
      const b = -2n;
      if (a + b !== 5n || a - b !== 9n || a * b !== -14n) throw new Error("ring");
      if (a / b !== -3n || a % b !== 1n || -a % 2n !== -1n || b ** 3n !== -8n) throw new Error("division");
      if (\`\${a}\` !== "7" || String(b) !== "-2") throw new Error("strings");
      if (!(b < a) || a <= b || !(a > 3) || 7 > a || !(a >= 7)) throw new Error("order");
      const value: unknown = 1n;
      const one: unknown = 1;
      if (value === one || Object.is(value, one) || !Object.is(value, 1n)) throw new Error("equality");
      if (typeof value !== "bigint" || -a !== -7n || ~a !== -8n) throw new Error("unary");
      let zero = 0n;
      zero = zero * 1n;
      if (zero) throw new Error("truthiness");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("reads a BigInt's methods from BigInt.prototype", async () => {
    const getSource = (expected: string) => `
      const box = { kind: "bigint" };
      if (box.kind !== "bigint") throw new Error("box");
      const n = 1n;
      const method: unknown = n.toString;
      if (method !== ${expected}) throw new Error("method");
      let caught = "";
      const make = () => {
        new (n.valueOf as unknown as new () => object)();
      };
      try {
        make();
      } catch (error) {
        caught = error instanceof TypeError ? "TypeError" : "other";
      }
      if (caught !== "TypeError") throw new Error(caught);
    `;
    expect((await checkModel(getSource("BigInt.prototype.toString"))).failure).toBeUndefined();
    expect((await checkModel(getSource("Object.prototype.toString"))).failure?.message).toContain(
      "method",
    );
  });

  it("assigns, converts, and writes BigInts", async () => {
    const result = await checkModel(`
      let a = 5n;
      a += 3n;
      a *= 2n;
      a -= 1n;
      a++;
      a--;
      a %= 7n;
      if (a !== 1n) throw new Error("compound");
      if (BigInt(12) !== 12n || BigInt(true) !== 1n || BigInt("0x1f") !== 31n || BigInt("") !== 0n) {
        throw new Error("convert");
      }
      if (Number(a) !== 1 || !Boolean(a)) throw new Error("number");
      const big = 255n;
      if (big.toString(16) !== "ff" || (-big).toString(2) !== "-11111111") throw new Error("radix");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stops where a BigInt leaves 32 bits or divides by zero", async () => {
    const overflow = await checkModel(`
      let sum = 2147483647n;
      sum = sum + 1n;
    `);
    expect(overflow.failure?.message).toContain("tla-ts can't hold a BigInt beyond 32 bits");
    const division = await checkModel(`
      let quotient = 1n;
      quotient = quotient / 0n;
    `);
    expect(division.failure?.message).toContain("tla-ts can't throw the RangeError");
  });
});
