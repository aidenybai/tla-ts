import { readFileSync } from "node:fs";
import { join } from "node:path";
import { check, type CheckResult, formatValue } from "../../src";
import { describe, expect, it } from "vite-plus/test";
import { printModule } from "../../src/printer";
import { compile } from "../../src/typescript/compile";

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

  it("stop the check at a getter that a call reads, though the statement drops its value", async () => {
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
    expect(result.failure?.message).toContain("tla-ts can't call getters");
  });

  it("stop the check at a getter that a declaration reads, though nothing reads it", async () => {
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
    expect(result.failure?.message).toContain("tla-ts can't call getters");
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
    [
      "a call to a method that a variable holds",
      "const counter = { get() { return 1; } };\nconst get = counter.get;\nlet value = get();",
      "Unsupported call: get",
    ],
  ])("rejects %s in a script", (_, source, message) => {
    expect(() => compile(source)).toThrow(message);
  });

  it("renames a function that the JavaScript module defines", async () => {
    const compiled = compile(
      "function Join(value: number) {\n  return value + 1;\n}\nconst box = { a: 1 };\nlet result = Join(box.a);",
    );
    const result = await check({ ...compiled, source: printModule(compiled.source) });
    expect(result.status).toBe("deadlock");
  });

  it("rejects a class whose member names run code", () => {
    expect(() => compile(`let count = 0;\nclass Counter {\n  [count++]() {}\n}`)).toThrow(
      "spec.ts:2:1 Unsupported statement",
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
      expect((await checkModel(getSource(call))).failure?.message).toContain(
        "tla-ts can't call getters",
      );
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

  it("stops where a script uses a well-known symbol as a key", async () => {
    const result = await checkModel(`
      const object: { [key: symbol]: number } = {};
      object[Symbol.iterator] = 1;
    `);
    expect(result.failure?.message).toContain("tla-ts can't use a well-known symbol as a key");
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
