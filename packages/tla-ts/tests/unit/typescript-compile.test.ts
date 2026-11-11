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
      Object.defineProperty(holder, "pair", {
        set: function (first: unknown, second?: unknown) {
          count = 1;
        },
      });
      holder.pair = 1;
      if (count !== 1) throw new Error("the setter didn't run");
    `);
    expect(result.failure?.message).toContain("tla-ts can't call setters");
  });

  it("stop the check at a getter it can't call, though nothing reads what it gives", async () => {
    const result = await checkModel(`
      const holder: { [key: string]: unknown } = {};
      Object.defineProperty(holder, "length", {
        get: function () {
          holder[2] = "two";
          return 3;
        },
      });
      let found = Array.prototype.indexOf.call(holder, "two");
    `);
    expect(result.failure?.message).toContain("tla-ts can't call getters");
  });

  it("stop the check at a getter that a parameter pattern reads, though nothing uses it", async () => {
    const result = await checkModel(`
      const object = {
        get poisoned(): number {
          throw new Error("poisoned");
        },
      };
      const take = ({ poisoned }: { poisoned: number }) => {};
      take(object);
    `);
    expect(result.failure?.message).toContain("tla-ts can't call getters");
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

  it("rejects a local function that calls itself and changes a name around it", () => {
    expect(() =>
      compile(`
        const outer = (limit: number): number => {
          const seen = [0];
          const add = (index: number): number => {
            seen.push(index);
            return index >= limit ? seen.length : add(index + 1);
          };
          return add(0);
        };
        const total = outer(2);
        if (total !== 4) throw new Error("total");
      `),
    ).toThrow("Only state variables and local lets can change: seen");
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
      "a parameter that a function changes and returns",
      "const fill = (items: number[]) => {\n  items.push(1);\n  return items;\n};\nconst list: number[] = [];\nlet size = fill(list).length + list.length;",
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
      "an array that a heap object holds and that changes through it",
      "const run = () => {\n  const items: number[] = [];\n  const wrapped = { inner: items };\n  wrapped.inner.push(1);\n  return items.length;\n};\nlet size = run();",
    ],
    [
      "an array that a function puts in a heap object",
      "const wrap = (inner: number[]) => ({ inner });\nconst run = () => {\n  const items: number[] = [];\n  const wrapped = wrap(items);\n  wrapped.inner.push(1);\n  return items.length;\n};\nlet size = run();",
    ],
  ])("rejects %s, as changing it would show through the other name", (_, source) => {
    expect(() => compile(source)).toThrow("items would share an object that changes in place");
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
      "an object made in a callback inside an expression",
      "let size = [1].map((value) => ({ value })).length;",
      "Make objects only where a statement always runs",
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

  it("rejects new.target rather than read it as the function it's in", () => {
    expect(() =>
      compile(
        "const box = { size: 1 };\nconst same = (actual: unknown) => actual === undefined;\nfunction run() {\n  return same(new.target);\n}\nconst result = run();",
      ),
    ).toThrow("spec.ts:4:15 Unsupported expression: new.target");
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
    // The caller's array, which a copy that the parameter changes in place would miss.
    expect(() =>
      checkModel(`
        const fill = (names: string[]) => {
          names.push("a");
        };
        const names = "b,c".split(",");
        fill(names);
      `),
    ).toThrow("Only state variables and local lets can change: names");
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
    expect(() =>
      checkModel(`
        const add = (items: number[]) => {
          items.push(1);
        };
        const list: number[] = [];
        add(list.slice());
      `),
    ).toThrow("Only state variables and local lets can change: items");
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
        const copy = { ...box };
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
    `);
    expect(result.failure).toBeUndefined();
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

  it("stops on a getter that a pattern reads where the pattern runs", async () => {
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
      "let v = 0; ({ v } = source);",
    ]) {
      expect((await checkModel(getSource(statements))).failure?.message).toContain(
        "tla-ts can't call getters",
      );
    }
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

  it("rejects a using declaration, whose resource it doesn't dispose", () => {
    expect(() =>
      compile("const holder = {};\n{\n  using resource = { [Symbol.dispose]() {} };\n}"),
    ).toThrow("tla-ts can't dispose what a using declaration holds");
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
    ).rejects.toThrow("tla-ts can't close a generator that suspended in try or yield*");
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

  it("stops the check where something else reads a proxy", async () => {
    const result = await checkModel(`
      const proxy = new Proxy({ attr: 1 }, {});
      const keys = Object.keys(proxy);
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
