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

  it("fails the check where defineProperty takes an array, which isn't in the heap", async () => {
    const result = await check(
      compile(
        `const values: object = [];\nObject.defineProperty(values, "0", { value: 1 });\nlet result = 1;`,
      ),
    );
    expect(result.failure?.message).toContain("tla-ts can't use <<>> as an object here");
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
      "an object made in a callback",
      "let boxes = [1].map((value) => ({ value }));",
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

  it("rejects a class that runs code as the module loads", () => {
    expect(() =>
      compile(`let count = 0;\nclass Counter {\n  static {\n    count++;\n  }\n}`),
    ).toThrow("spec.ts:2:1 Unsupported statement");
  });

  it("rejects unknown tags", () => {
    expect(() =>
      compile(`let count = 0;\n/** @fiar */\nexport const step = () => { count++; };`),
    ).toThrow("Unknown tag: @fiar");
  });
});
