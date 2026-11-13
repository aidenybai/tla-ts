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

  describe("run a call that needs statements before the call it is the first argument of", () => {
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

    it("agrees with Node", async () => {
      expect(getTrace(await checkModel(getSource(true)))).toEqual([{ checked: "1" }]);
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(false))).failure?.message).toContain("unexpected");
    });
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

  const getFlatSource = (expected: string) => `
    let calls = 0;
    const flat = [1, 2, 3].flatMap((value) => {
      calls += value;
      return [value, value * calls];
    });
    if (flat.join() !== "${expected}") throw new Error(flat.join());
  `;

  it("run a flatMap callback that changes state as a loop", async () => {
    expect((await checkModel(getFlatSource("1,1,2,6,3,18"))).failure).toBeUndefined();
  });

  it("fail where a flatMap callback that changes state gives other arrays", async () => {
    expect((await checkModel(getFlatSource("1,1,2,2,3,3"))).failure?.message).toContain(
      '"1,1,2,6,3,18"',
    );
  });

  const getMadeSource = (expected: number) => `
    const holder = { value: 1 };
    holder.value += 1;
    const getChildren = (list: number[], getElements = (inner: number[]) => inner) =>
      getElements(list);
    const enumerate = (list: number[], depth: number): number[] =>
      getChildren(list).flatMap((child) => (depth > 0 ? enumerate([child, child], depth - 1) : [child]));
    const count = enumerate([1, 2], 2).length;
    if (count !== ${expected}) throw new Error(\`\${count}\`);
  `;

  it("make the objects of a function that a flatMap callback calls back into", async () => {
    expect((await checkModel(getMadeSource(8))).failure).toBeUndefined();
  });

  it("fail where a function that a flatMap callback calls back into gives another array", async () => {
    expect((await checkModel(getMadeSource(4))).failure?.message).toContain('"8"');
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

  describe("read each index of an array as a callback that changes objects leaves it", () => {
    const source = (expected: string) => `
      const items: (number | undefined)[] = [1, , 3, 4];
      let seen = "";
      items.forEach((value, position) => {
        seen += value ?? "u";
        if (position === 0) {
          items[1] = 2;
          delete items[2];
          items.push(5);
        }
      });
      const isEvery = items.every((value, position) => {
        if (position === 0) items[3] = 9;
        return value !== 9;
      });
      if (seen !== ${JSON.stringify(expected)} || isEvery || items.length !== 5) {
        throw new Error("callback");
      }
    `;

    it("agrees with Node on 124", async () => {
      expect((await checkModel(source("124"))).failure).toBeUndefined();
    });

    it("rejects the expectation 1234", async () => {
      expect((await checkModel(source("1234"))).failure?.message).toContain("callback");
    });
  });

  it("seed a reduce from the first element it finds as a callback that changes objects leaves it", async () => {
    const source = (expected: number) => `
      const items: (number | undefined)[] = [, 2, , 4];
      let calls = 0;
      const total = items.reduce((sum: number | undefined, value, position) => {
        calls++;
        if (position === 1) delete items[3];
        return (sum ?? 0) + (value ?? 0) + 10;
      });
      if (total !== ${expected} || calls !== 1) throw new Error("reduce");
    `;
    expect((await checkModel(source(16))).failure).toBeUndefined();
    expect((await checkModel(source(26))).failure?.message).toContain("reduce");
  });

  it("seed a reduceRight from the last element it finds as a callback that changes objects leaves it", async () => {
    const source = (expected: number) => `
      const items: (number | undefined)[] = [, 2, , 4];
      const right = items.reduceRight((sum: number | undefined, value) => {
        items[0] = 5;
        return (sum ?? 0) + (value ?? 0);
      });
      if (right !== ${expected}) throw new Error("reduce");
    `;
    expect((await checkModel(source(11))).failure).toBeUndefined();
    expect((await checkModel(source(6))).failure?.message).toContain("reduce");
  });

  it("throw a TypeError where a reduce without an initial value finds no element", async () => {
    const result = await checkModel(`
      const empty: number[] & { tag?: string } = [];
      empty.tag = "t";
      empty.reduce((sum: number, value: number) => {
        empty.tag = "u";
        return sum + value;
      });
    `);
    expect(result.failure?.message).toContain("TypeError");
  });

  it("skip a hole in the array that map makes where nothing reads the array", async () => {
    const source = (expected: number) => `
      const items = [1, 2, 3];
      let count = 0;
      items.map((value) => {
        count += value;
        items.length = 1;
        return value;
      });
      if (count !== ${expected}) throw new Error("map");
    `;
    expect((await checkModel(source(1))).failure).toBeUndefined();
    expect((await checkModel(source(6))).failure?.message).toContain("map");
  });

  it("throw what an array method's callback throws to the try around the call", async () => {
    const source = (expected: number) => `
      let visited = 0;
      let message = "";
      try {
        [1, 2, 3].forEach((value) => {
          visited += value;
          if (value === 2) throw new RangeError("two");
        });
      } catch (error) {
        if (error instanceof RangeError) message = error.message;
      }
      if (visited !== ${expected} || message !== "two") throw new Error("thrown");
    `;
    expect((await checkModel(source(3))).failure).toBeUndefined();
    expect((await checkModel(source(6))).failure?.message).toContain("thrown");
  });

  it("throw what a getter that an array method runs throws to the try around the call", async () => {
    const source = (expected: boolean) => `
      const like: { [key: string]: unknown } = { 0: 1, length: 3 };
      Object.defineProperty(like, "1", {
        get: function () {
          throw new TypeError("getter");
        },
      });
      let isTypeError = false;
      try {
        Array.prototype.map.call(like, (value: unknown) => value);
      } catch (error) {
        isTypeError = error instanceof TypeError;
      }
      if (isTypeError !== ${expected}) throw new Error("thrown");
    `;
    expect((await checkModel(source(true))).failure).toBeUndefined();
    expect((await checkModel(source(false))).failure?.message).toContain("thrown");
  });

  it("convert an array-like object's length that's an object with its valueOf and toString", async () => {
    const source = (expected: string) => `
      const calls: string[] = [];
      const items = {
        0: 12,
        1: 11,
        2: 9,
        length: {
          valueOf: () => {
            calls.push("valueOf");
            return {};
          },
          toString: () => {
            calls.push("toString");
            return "2";
          },
        },
      };
      const isAll = Array.prototype.every.call(items, (value: number) => value > 10);
      if (!isAll || calls.join() !== "${expected}") throw new Error("length");
    `;
    expect((await checkModel(source("valueOf,toString"))).failure).toBeUndefined();
    expect((await checkModel(source("toString,valueOf"))).failure?.message).toContain("length");
  });

  it("search an array-like object whose length's valueOf gives it", async () => {
    const source = (expected: number) => `
      const found = Array.prototype.indexOf.call({ 0: 4, length: { valueOf: () => 1 } }, 4);
      if (found !== ${expected}) throw new Error("length");
    `;
    expect((await checkModel(source(0))).failure).toBeUndefined();
    expect((await checkModel(source(-1))).failure?.message).toContain("length");
  });

  it("throw a TypeError where neither the valueOf nor the toString of a length gives a primitive", async () => {
    const source = (expected: boolean) => `
      let isThrown = false;
      try {
        Array.prototype.forEach.call(
          { 0: 1, length: { valueOf: () => ({}), toString: () => ({}) } },
          () => {
            isThrown = false;
          },
        );
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (isThrown !== ${expected}) throw new Error("length");
    `;
    expect((await checkModel(source(true))).failure).toBeUndefined();
    expect((await checkModel(source(false))).failure?.message).toContain("length");
  });

  it("run an array method's call whose value a statement drops", async () => {
    const source = (expected: number) => `
      const values = [1, 2, 3];
      values.map((value: number) => value * 2);
      if (values[0] !== ${expected}) throw new Error("map");
    `;
    expect((await checkModel(source(1))).failure).toBeUndefined();
    await expect(checkModel(source(2))).rejects.toThrow("map");
  });

  it("catch what an array method's callback throws where nothing else makes the call run as statements", async () => {
    const source = (expected: number) => `
      let caught = 0;
      try {
        [1, 2].filter((value: number) => {
          if (value === 2) throw new RangeError("two");
          return true;
        });
      } catch (error) {
        if (error instanceof RangeError) caught = 1;
      }
      if (caught !== ${expected}) throw new Error("filter");
    `;
    expect((await checkModel(source(1))).failure).toBeUndefined();
    expect((await checkModel(source(0))).failure?.message).toContain("filter");
  });

  it("keep a hole in the array that map makes over an array-like object that lacks an index", async () => {
    const source = (expected: string) => `
      const like = { 0: 5, length: 3 };
      const mapped = Array.prototype.map.call(like, (value: unknown) => typeof value);
      if (mapped.length !== 3 || 1 in mapped || mapped[0] !== "${expected}") throw new Error("map");
    `;
    expect((await checkModel(source("number"))).failure).toBeUndefined();
    expect((await checkModel(source("string"))).failure?.message).toContain("map");
  });

  it("keep a hole in the array that map makes where a callback shortens the array", async () => {
    const source = (expected: number) => `
      const items: (number | undefined)[] = [1, , 3, 4];
      const doubled = items.map((value, position) => {
        if (position === 0) items.length = 3;
        return (value ?? 0) * 2;
      });
      if (doubled.length !== 4 || 1 in doubled || 3 in doubled || doubled[2] !== ${expected}) {
        throw new Error("map");
      }
    `;
    expect((await checkModel(source(6))).failure).toBeUndefined();
    expect((await checkModel(source(3))).failure?.message).toContain("map");
  });

  it("keep a hole in the array that map makes where a callback deletes an array-like element", async () => {
    const source = (expected: number) => `
      const like: { [key: string]: unknown } = { 0: 5, 2: 7, length: 4 };
      const tripled = Array.prototype.map.call(like, (value: unknown) => {
        delete like[2];
        return (value as number) * 3;
      });
      if (tripled.length !== 4 || tripled[0] !== ${expected} || 2 in tripled) {
        throw new Error("map");
      }
    `;
    expect((await checkModel(source(15))).failure).toBeUndefined();
    expect((await checkModel(source(5))).failure?.message).toContain("map");
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

  it("destructure an object that a value of type any holds in a script with objects", async () => {
    const getSource = (expected: number) => `
      const value: any = { x: 23 };
      const { x } = value;
      if (x !== ${expected}) throw new Error("x");
    `;
    expect((await checkModel(getSource(23))).failure).toBeUndefined();
    expect((await checkModel(getSource(24))).failure?.message).toContain("x");
  });

  it("destructure a thrown object in a catch's pattern", async () => {
    const getSource = (expected: number) => `
      let found = 0;
      try {
        throw { x: 23 };
        // @ts-ignore
      } catch ({ x }) {
        found = x;
      }
      if (found !== ${expected}) throw new Error("caught");
    `;
    expect((await checkModel(getSource(23))).failure).toBeUndefined();
    expect((await checkModel(getSource(24))).failure?.message).toContain("caught");
  });

  it("skip a nested pattern's default that assigns where the value has the element", async () => {
    const getSource = (expected: number) => `
      let count = 0;
      const values = [2, 1];
      const take = ([[...rest] = (() => { count += 1; return [9]; })()]: number[][]) => rest;
      const taken = take([values]);
      if (taken[1] !== 1 || count !== ${expected}) throw new Error("ran");
    `;
    expect((await checkModel(getSource(0))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("ran");
  });

  it("stop the check at a nested pattern's default that assigns", async () => {
    const result = await checkModel(`
      let count = 0;
      const rows: number[][][] = [[]];
      for (const [[...rest] = (() => { count += 1; return [9]; })()] of rows) {}
    `);
    expect(result.failure?.message).toContain("tla-ts can't run a default that assigns");
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

  describe("raises to a negative power, and stops where a script of integers can't hold the power", () => {
    it("agrees with Node", async () => {
      const result = await checkModel(`
      const exponent = -5;
      if ((-1) ** 3 !== -1 || 1 ** exponent !== 1 || (-1) ** exponent !== -1) {
        throw new Error("power");
      }
    `);
      expect(result.failure).toBeUndefined();
    });

    it("stops where tla-ts can't follow it", async () => {
      await expect(
        checkModel(
          "const exponent = -1;\nconst value = 2 ** exponent;\nif (value > 5) throw new Error();",
        ),
      ).rejects.toThrow("tla-ts can't represent this value");
    });

    it("stops where tla-ts can't follow it (2)", async () => {
      await expect(
        checkModel(
          "const exponent = -1;\nconst value = Math.pow(0, exponent);\nif (value > 5) throw new Error();",
        ),
      ).rejects.toThrow("tla-ts can't represent Infinity in this script");
    });
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

  it("counts leading zero bits with Math.clz32 and roots with Math.hypot", async () => {
    const source = (expected: string) => `
      const counts = [
        Math.clz32(0),
        Math.clz32(1),
        Math.clz32(-1),
        Math.clz32(65536),
        Math.clz32(4294967297),
        Math.clz32(2147483648),
      ].join();
      const roots = [Math.hypot(), Math.hypot(3, 4), Math.hypot(2, 3, 6)].join();
      if (counts + " " + roots !== "${expected}") throw new Error(counts + " " + roots);
    `;
    expect((await checkModel(source("32,31,0,15,31,0 0,5,7"))).failure).toBeUndefined();
    await expect(checkModel(source("32,31,0,16,31,0 0,5,7"))).rejects.toThrow("0,5,7");
  });

  it("stops at a Math.hypot whose root is a fraction", async () => {
    await expect(checkModel("const root = Math.hypot(1, 1);")).rejects.toThrow(
      "tla-ts can't represent a fraction",
    );
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

  describe("passes a private setter what a compound or logical assignment makes of its getter's value", () => {
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

    it("agrees with Node on 7", async () => {
      expect((await checkModel(getSource(7, 70, 71))).failure).toBeUndefined();
    });

    it("rejects the expectation 70", async () => {
      expect((await checkModel(getSource(70, 70, 71))).failure?.message).toContain("add");
    });

    it("rejects the expectation 7", async () => {
      expect((await checkModel(getSource(7, 7, 71))).failure?.message).toContain("add");
    });

    it("rejects the expectation 7 (2)", async () => {
      expect((await checkModel(getSource(7, 70, 9))).failure?.message).toContain("or");
    });
  });

  describe("writes a property in a logical assignment only where its value doesn't decide", () => {
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

    it("agrees with Node on 1", async () => {
      expect((await checkModel(getSource(1, 4, 2))).failure).toBeUndefined();
    });

    it("rejects the expectation 9", async () => {
      expect((await checkModel(getSource(9, 4, 2))).failure?.message).toContain("or");
    });

    it("rejects the expectation 1", async () => {
      expect((await checkModel(getSource(1, 5, 2))).failure?.message).toContain("nullish");
    });

    it("rejects the expectation 1 (2)", async () => {
      expect((await checkModel(getSource(1, 4, 0))).failure?.message).toContain("fixed");
    });
  });

  describe("runs a function whose statements assign its parameters in its expressions", () => {
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

    it("agrees with Node on 2", async () => {
      expect((await checkModel(getSource(2, 1, 8))).failure).toBeUndefined();
    });

    it("stops on 1", async () => {
      await expect(checkModel(getSource(1, 1, 8))).rejects.toThrow("compound");
    });

    it("stops on 2", async () => {
      await expect(checkModel(getSource(2, 2, 8))).rejects.toThrow("increment");
    });

    it("stops on 2 (2)", async () => {
      await expect(checkModel(getSource(2, 1, 4))).rejects.toThrow("declared");
    });
  });

  describe("runs an assignment inside another's value first where it writes another name", () => {
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

    it("agrees with Node on 60", async () => {
      expect((await checkModel(getSource(60, 2, 2))).failure).toBeUndefined();
    });

    it("rejects the expectation 50", async () => {
      expect((await checkModel(getSource(50, 2, 2))).failure?.message).toContain("nested");
    });

    it("rejects the expectation 60", async () => {
      expect((await checkModel(getSource(60, 0, 2))).failure?.message).toContain("stored");
    });

    it("rejects the expectation 60 (2)", async () => {
      expect((await checkModel(getSource(60, 2, 0))).failure?.message).toContain("stored");
    });

    it("stops where tla-ts can't follow it", async () => {
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
  });

  describe("runs an assignment in an operator's right operand after its left operand's names", () => {
    const getSource = (second: number, increment: number, comma: number, argument: number) => `
      let x = 0;
      const expected: number[] = [${second}, ${increment}, ${comma}, ${argument}];
      if (x + (x = 1) !== expected[0]) throw new Error("second " + (x + (x = 1)));
      x = 0;
      if (x - x++ !== expected[1] || x !== 1) throw new Error("increment");
      let y = 0;
      if ((x = 1, y = 2, x + y) !== expected[2]) throw new Error("comma");
      x = 5;
      const echo = (value: unknown) => value;
      if (echo(x + (x = 7)) !== expected[3] || x !== 7) throw new Error("argument");
    `;
    const getMessage = (source: string) =>
      checkModel(source).then(
        (result) => result.failure?.message,
        (error: Error) => error.message,
      );

    it("agrees with Node", async () => {
      expect(await getMessage(getSource(1, 0, 3, 12))).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect(await getMessage(getSource(2, 0, 3, 12))).toContain("second 2");
    });

    it("rejects wrong expectation 2", async () => {
      expect(await getMessage(getSource(1, 1, 3, 12))).toContain("increment");
    });

    it("rejects wrong expectation 3", async () => {
      expect(await getMessage(getSource(1, 0, 2, 12))).toContain("comma");
    });

    it("rejects wrong expectation 4", async () => {
      expect(await getMessage(getSource(1, 0, 3, 14))).toContain("argument");
    });
  });

  it("runs an assignment in a unary operator's operand first", async () => {
    const getSource = (negated: number, voided: number) => `
      let x = 0;
      const expected: number[] = [${negated}, ${voided}];
      if (-(x = 3) !== expected[0]) throw new Error("negate");
      if (void (x = 1) !== undefined || x !== expected[1]) throw new Error("void");
      if (!((x = 2) === x)) throw new Error("not");
    `;
    const getMessage = (source: string) =>
      checkModel(source).then(
        (result) => result.failure?.message,
        (error: Error) => error.message,
      );
    expect(await getMessage(getSource(-3, 1))).toBeUndefined();
    expect(await getMessage(getSource(3, 1))).toContain("negate");
    expect(await getMessage(getSource(-3, 3))).toContain("void");
  });

  describe("throws the TypeError of writing a property of null to a value off the heap", () => {
    const getSource = (caught: string, written: number) => `
      type Box = { prop?: number };
      const empty = null as Box | null;
      const full = { prop: 0 } as Box | null;
      let caught = "";
      try {
        empty!.prop = 1;
      } catch (error) {
        caught = error instanceof TypeError ? "type" : "other";
      }
      full!.prop = 2;
      if (caught !== "${caught}") throw new Error("caught " + caught);
      if (full!.prop !== ${written}) throw new Error("written");
    `;
    const getMessage = (source: string) =>
      checkModel(source).then(
        (result) => result.failure?.message,
        (error: Error) => error.message,
      );

    it("agrees with Node", async () => {
      expect(await getMessage(getSource("type", 2))).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect(await getMessage(getSource("", 2))).toContain("caught type");
    });

    it("rejects wrong expectation 2", async () => {
      expect(await getMessage(getSource("type", 0))).toContain("written");
    });
  });

  describe("runs an assignment in a property's value first where the object is a non-null name", () => {
    const getSource = (stored: number, count: number) => `
      type Box = { stored?: number };
      let count = 0;
      const box = {} as Box | null;
      box!.stored = count += 2;
      if (box!.stored !== ${stored}) throw new Error("stored");
      if (count !== ${count}) throw new Error("count");
    `;
    const getMessage = (source: string) =>
      checkModel(source).then(
        (result) => result.failure?.message,
        (error: Error) => error.message,
      );

    it("agrees with Node", async () => {
      expect(await getMessage(getSource(2, 2))).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect(await getMessage(getSource(0, 2))).toContain("stored");
    });

    it("rejects wrong expectation 2", async () => {
      expect(await getMessage(getSource(2, 0))).toContain("count");
    });
  });

  describe("runs a static field's assignment as a statement that gives the field its value", () => {
    const getSource = (named: string, after: number, added: number) => `
      let className = "";
      let count = 0;
      class Named {
        static f = (className = this.name);
        static g = count++;
        static h = (count += 5);
      }
      if (className !== "Named" || Named.f !== "${named}") throw new Error("name");
      if (Named.g !== ${after} || Named.h !== ${added} || count !== 6) throw new Error("count");
    `;

    it("agrees with Node on Named", async () => {
      expect((await checkModel(getSource("Named", 0, 6))).failure).toBeUndefined();
    });

    it("rejects the empty expectation", async () => {
      expect((await checkModel(getSource("", 0, 6))).failure?.message).toContain("name");
    });

    it("rejects the expectation Named", async () => {
      expect((await checkModel(getSource("Named", 1, 6))).failure?.message).toContain("count");
    });

    it("rejects the expectation Named (2)", async () => {
      expect((await checkModel(getSource("Named", 0, 5))).failure?.message).toContain("count");
    });
  });

  describe("throws the TypeError of a pattern that destructures undefined, though nothing reads it", () => {
    const getSource = (expected: string) => `
      type Inner = { x: number };
      const empty: Inner[] = [];
      const holder: { inner?: Inner } = {};
      let calls = 0;
      function take([{ x }]: Inner[]) {
        calls++;
      }
      let array = "none";
      try {
        const [{ x }] = empty;
      } catch (error) {
        array = error instanceof TypeError ? "type" : "other";
      }
      let object = "none";
      try {
        const { inner: { x } } = holder as { inner: Inner };
      } catch (error) {
        object = error instanceof TypeError ? "type" : "other";
      }
      let parameter = "none";
      try {
        take([]);
      } catch (error) {
        parameter = error instanceof TypeError ? "type" : "other";
      }
      let head = "none";
      try {
        for (const [{ x }] of [empty]) {
        }
      } catch (error) {
        head = error instanceof TypeError ? "type" : "other";
      }
      let caught = "none";
      try {
        try {
          throw new Error("plain");
        } catch ({ cause: { x } }: any) {
        }
      } catch (error) {
        caught = error instanceof TypeError ? "type" : "other";
      }
      let present = "none";
      try {
        const [{ x }] = [{ x: 1 }];
      } catch (error) {
        present = error instanceof TypeError ? "type" : "other";
      }
      const outcomes = [array, object, parameter, head, caught, present, String(calls)].join();
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;

    it("agrees with Node on type,type,type,type,type,none,0", async () => {
      expect(
        (await checkModel(getSource("type,type,type,type,type,none,0"))).failure,
      ).toBeUndefined();
    });

    it("rejects the expectation none,type,type,type,type,none,0", async () => {
      expect(
        (await checkModel(getSource("none,type,type,type,type,none,0"))).failure?.message,
      ).toContain("outcomes type");
    });

    it("rejects the expectation type,type,none,type,type,none,0", async () => {
      expect(
        (await checkModel(getSource("type,type,none,type,type,none,0"))).failure?.message,
      ).toContain("outcomes type");
    });

    it("rejects the expectation type,type,type,type,none,none,0", async () => {
      expect(
        (await checkModel(getSource("type,type,type,type,none,none,0"))).failure?.message,
      ).toContain("outcomes type");
    });

    it("rejects the expectation type,type,type,type,type,type,0", async () => {
      expect(
        (await checkModel(getSource("type,type,type,type,type,type,0"))).failure?.message,
      ).toContain("outcomes type");
    });
  });

  it("joins the paths through each catch of a TypeError that no new makes", async () => {
    // Each catch translates what follows it once, so eight of them stay small.
    const getSource = (expected: number) => `
      const box = {};
      const empty: { x: number }[] = [];
      let caught = 0;
      ${Array.from(
        { length: 8 },
        () => `try {
        const [{ x }] = empty;
      } catch (error) {
        if (error instanceof TypeError) caught++;
      }`,
      ).join("\n")}
      if (caught !== ${expected}) throw new Error(String(caught));
    `;
    expect((await checkModel(getSource(8))).failure).toBeUndefined();
    expect((await checkModel(getSource(7))).failure?.message).toContain("8");
  });

  it("runs a parameter's default that assigns where the call binds the parameter", async () => {
    const getSource = (expected: string) => `
      let count: number = 0;
      const sum = (a = ++count, b = count) => a * 10 + b;
      const before = count;
      const summed = sum();
      const added = sum(4);
      const outcomes = [before, summed, added, count].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("0,11,41,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("0,11,42,1"))).failure?.message).toContain(
      "outcomes 0,11,41,1",
    );
  });

  it("runs parameters' defaults that assign in order", async () => {
    const getSource = (expected: string) => `
      let count: number = 0;
      let cached: number | undefined = undefined;
      const steps = (a = count++, b = (count += 5), c = (cached ??= 3)) => [a, b, c].join(" ");
      const stepped = steps();
      const given = steps(1, 2, 4);
      const outcomes = [stepped, given, count, cached].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("0 6 3,1 2 4,6,3"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1 6 3,1 2 4,6,3"))).failure?.message).toContain(
      "outcomes 0 6 3,1 2 4,6,3",
    );
  });

  it("runs a pattern's default that assigns where a parameter's property is undefined", async () => {
    const getSource = (expected: string) => `
      let count: number = 0;
      let caught = "none";
      const poisoned = {
        get value(): number | undefined {
          throw new RangeError("get");
        },
      };
      const take = ({ value: taken = ++count }: { value?: number }) => taken;
      try {
        take(poisoned);
      } catch (error) {
        caught = error instanceof RangeError ? "range" : "other";
      }
      const defaulted = take({});
      const passed = take({ value: 7 });
      const outcomes = [caught, defaulted, passed, count].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("range,1,7,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("range,1,7,2"))).failure?.message).toContain(
      "outcomes range,1,7,1",
    );
  });

  it("runs the defaults that assign of a class's methods", async () => {
    const getSource = (expected: string) => `
      let count: number = 0;
      class Counter {
        method({ value = ++count }: { value?: number }) {
          return value;
        }
        static make(a: number, b = (count += 10)) {
          return a + b;
        }
      }
      const counted = new Counter().method({});
      const made = Counter.make(1);
      const outcomes = [counted, made, count].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("1,12,11"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,11,11"))).failure?.message).toContain("outcomes 1,12,11");
  });

  it("runs a generator's default that assigns where the call binds the parameter", async () => {
    const getSource = (expected: string) => `
      let count: number = 0;
      function* yields(a = ++count) {
        yield a;
      }
      const iterator = yields();
      const yielded = iterator.next().value;
      const outcomes = [yielded, count].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("1,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("0,1"))).failure?.message).toContain("outcomes 1,1");
  });

  it("translates what follows a default that assigns once, whichever value it takes", async () => {
    const getSource = (calls: number, expected: string) => `
      const box = { total: 0 };
      let count: number = 0;
      let value: number | undefined;
      const values: { value?: number }[] = [{}];
      const bump = (a = ++count) => a;
      ${Array.from(
        { length: calls },
        (_, index) =>
          `const value${index} = bump(values[0].value);\n[{ value = count += 10 }] = values;`,
      ).join("\n")}
      box.total = count + value!;
      if (String(box.total) !== "${expected}") throw new Error("outcomes " + box.total);
    `;
    const getSize = (calls: number) => printModule(compile(getSource(calls, "0")).source).length;
    expect(getSize(8)).toBeLessThan(getSize(4) * 2);
    expect((await checkModel(getSource(2, "44"))).failure).toBeUndefined();
    expect((await checkModel(getSource(2, "43"))).failure?.message).toContain("outcomes 44");
  });

  it("runs a default that assigns a function where the call certainly passes undefined", async () => {
    const getSource = (expected: string) => `
      var x = "outside";
      var probeParams, probeBody;
      let count: number = 0;
      ((_ = (probeParams = function () { return x; })) => {
        var x = "inside";
        probeBody = function () { return x; };
      })();
      const pick = (a = (count += 1)) => a;
      const outcomes = [probeParams!(), probeBody(), pick(5), pick(undefined), count].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("outside,inside,5,1,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("outside,inside,5,1,2"))).failure?.message).toContain(
      "outcomes outside,inside,5,1,1",
    );
  });

  it("stops where a parameter's default that assigns runs out of order", () => {
    expect(() =>
      compile(`
        let count: number = 0;
        const sum = (a = count, b = ++count) => a + b;
        if (sum() !== 1) throw new Error("sum");
      `),
    ).toThrow("tla-ts can't run this before what reads what it changes");
    expect(() =>
      compile(`
        const box = { count: 0 };
        const next = (a = ++box.count) => a;
        if (next() !== 1) throw new Error("next");
      `),
    ).toThrow("tla-ts can't run a default that writes a property");
  });

  describe("runs the getters of a parameter's pattern again at each call", () => {
    const getSource = (expected: string) => `
      let count: number = 0;
      const source = {
        get value(): number {
          count++;
          return count;
        },
      };
      const take = ({ value }: { value: number }) => value;
      function* yields({ value }: { value: number }) {
        yield value;
      }
      const first = take(source);
      const second = take(source);
      const iterator = yields(source);
      const third = iterator.next().value;
      const other = yields(source);
      const fourth = other.next().value;
      const outcomes = [first, second, third, fourth, count].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;

    it("agrees with Node on 1,2,3,4,4", async () => {
      expect((await checkModel(getSource("1,2,3,4,4"))).failure).toBeUndefined();
    });

    it.each(["1,1,3,4,4", "1,2,3,3,4", "1,2,3,4,3"])(
      "rejects the expectation %s",
      async (wrong) => {
        expect((await checkModel(getSource(wrong))).failure?.message).toContain(
          "outcomes 1,2,3,4,4",
        );
      },
    );
  });

  it("runs a default that assigns where a destructuring assignment takes undefined", async () => {
    const getSource = (expected: string) => `
      let x: number = 0;
      let a: number | undefined;
      let b: number | undefined;
      let flag1 = false;
      let flag2 = false;
      let counter = 0;
      const empty: number[][] = [[]];
      for ([a = x += 1, b = x *= 2] of empty) {
        counter += a * 10 + b;
      }
      let p: boolean | number | undefined;
      let q: boolean | number | undefined;
      const objects: { p?: number; q?: number }[] = [{ q: 1 }];
      for ({ p = flag1 = true, q = flag2 = true } of objects) {
        counter += 100;
      }
      const values: (boolean | undefined)[] = [false];
      let first: boolean | undefined;
      let second: boolean | undefined;
      [first = flag1 = true, second = flag2 = true] = values;
      const outcomes = [counter, x, p, q, flag1, flag2, first, second].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    const expected = "112,2,true,1,true,true,false,true";
    expect((await checkModel(getSource(expected))).failure).toBeUndefined();
    for (const wrong of [
      "112,3,true,1,true,true,false,true",
      "112,2,true,1,true,false,false,true",
      "112,2,true,1,true,true,true,true",
    ]) {
      expect((await checkModel(getSource(wrong))).failure?.message).toContain(
        `outcomes ${expected}`,
      );
    }
  });

  it("throws the TypeError of a nested assignment pattern that destructures undefined", async () => {
    const getSource = (expected: string) => `
      let x: number | undefined;
      let y: number | undefined;
      const outcomes: string[] = [];
      const empty: { x: number }[][] = [[]];
      try {
        for ([{ x }] of empty) outcomes.push("body");
      } catch (error) {
        outcomes.push(error instanceof TypeError ? "type" : "other");
      }
      const holes: number[][][] = [[]];
      try {
        for ([[y]] of holes) outcomes.push("body");
      } catch (error) {
        outcomes.push(error instanceof TypeError ? "type" : "other");
      }
      const missing = [{}] as { inner: { x: number } }[];
      try {
        for ({ inner: { x } } of missing) outcomes.push("body");
      } catch (error) {
        outcomes.push(error instanceof TypeError ? "type" : "other");
      }
      const values: { x: number }[] = [];
      try {
        [{ x }] = values;
      } catch (error) {
        outcomes.push(error instanceof TypeError ? "type" : "other");
      }
      const present: { x: number }[][] = [[{ x: 3 }]];
      for ([{ x }] of present) outcomes.push(String(x));
      if (outcomes.join() !== "${expected}") throw new Error("outcomes " + outcomes.join());
    `;
    const expected = "type,type,type,type,3";
    expect((await checkModel(getSource(expected))).failure).toBeUndefined();
    for (const wrong of [
      "type,type,type,other,3",
      "type,other,type,type,3",
      "type,type,type,type,4",
    ]) {
      expect((await checkModel(getSource(wrong))).failure?.message).toContain(
        `outcomes ${expected}`,
      );
    }
  });

  it("runs the calls of a while's or a do-while's condition before each test", async () => {
    const getSource = (expected: string) => `
      let n: number = 0;
      let log = "";
      const step = () => {
        n++;
        log += "f";
        return n;
      };
      let a = 0;
      while (n + step() < 6) {
        a++;
        log += "b";
      }
      let b = 0;
      do {
        b++;
        log += "d";
      } while (step() < 5);
      const outcomes = [n, a, b, log].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("5,3,1,fbfbfbfdf"))).failure).toBeUndefined();
    expect((await checkModel(getSource("5,3,1,fbfbfbfd"))).failure?.message).toContain(
      "outcomes 5,3,1,fbfbfbfdf",
    );
  });

  it("runs the calls of a for's condition before each test", async () => {
    const getSource = (expected: string) => `
      let n: number = 0;
      const step = () => {
        n++;
        return n;
      };
      let c = 0;
      for (let i = 0; i < step(); i += 1) {
        c++;
        if (c > 1) break;
      }
      const outcomes = [n, c].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("2,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,2"))).failure?.message).toContain("outcomes 2,2");
  });

  it("throws where a call of a loop's condition throws", async () => {
    const getSource = (expected: string) => `
      let log = "";
      const check = (limit: number) => {
        log += "g";
        if (limit > 2) throw new Error("far");
        return limit;
      };
      let caught = "none";
      let k = 0;
      try {
        while (check(k) < 5) {
          k++;
          continue;
        }
      } catch (error) {
        caught = (error as Error).message;
      }
      const outcomes = [k, caught, log].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("3,far,gggg"))).failure).toBeUndefined();
    expect((await checkModel(getSource("3,none,gggg"))).failure?.message).toContain(
      "outcomes 3,far,gggg",
    );
  });

  it("runs each call that changes state among the arguments of a declaration's call", async () => {
    const getSource = (expected: string) => `
      let n: number = 0;
      const step = () => {
        n++;
        return n;
      };
      const pair = (a: number, b: number) => a * 10 + b;
      const first = pair(step(), step());
      const second = Math.max(step(), step() - 5);
      const outcomes = [first, second, n].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("12,3,4"))).failure).toBeUndefined();
    expect((await checkModel(getSource("21,3,4"))).failure?.message).toContain("outcomes 12,3,4");
  });

  it("runs the calls of a switch's expression that change state before it compares", async () => {
    const getSource = (expected: string) => `
      let n: number = 0;
      const step = () => {
        n++;
        return n;
      };
      let log = "";
      switch (step()) {
        case 1:
          log += "one";
          break;
        default:
          log += "other";
      }
      switch (step() + step()) {
        case 5:
          log += "five";
          break;
        default:
          log += "other";
      }
      const outcomes = [log, n].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("onefive,3"))).failure).toBeUndefined();
    expect((await checkModel(getSource("oneother,3"))).failure?.message).toContain(
      "outcomes onefive,3",
    );
  });

  it("runs a switch's expression in order where a call in it changes what it reads", async () => {
    const getSource = (expected: string) => `
      const box = { v: 1 };
      const grow = () => {
        box.v = 5;
        return box.v;
      };
      let log = "";
      switch (box.v + grow()) {
        case 6:
          log += "six";
          break;
        default:
          log += "other";
      }
      let flag = false;
      switch (flag || (flag = true)) {
        case true:
          log += "!";
          break;
      }
      const outcomes = [log, box.v].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("six!,5"))).failure).toBeUndefined();
    expect((await checkModel(getSource("other!,5"))).failure?.message).toContain("outcomes six!,5");
  });

  it("assigns where a short-circuit evaluates an assignment", async () => {
    const getSource = (expected: string) => `
      let x = false;
      let y = 0;
      let z: number | null = null;
      const first = x && (x = true);
      const second = (y || (y = 7)) + y;
      const third = \`\${z ?? (z = 3)}:\${z}\`;
      const outcomes = [first, x, second, y, third].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("false,false,14,7,3:3"))).failure).toBeUndefined();
    expect((await checkModel(getSource("false,true,14,7,3:3"))).failure?.message).toContain(
      "outcomes false,false,14,7,3:3",
    );
  });

  it("assigns where a conditional or a condition evaluates an assignment", async () => {
    const getSource = (expected: string) => `
      let w = 1;
      let flag = true;
      let t = 5;
      const fourth = w > 0 ? (w += 10) : (w = -1);
      if ((flag && (flag = false)) !== false || flag) t = 0;
      const outcomes = [fourth, w, flag, t].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("11,11,false,5"))).failure).toBeUndefined();
    expect((await checkModel(getSource("11,11,false,0"))).failure?.message).toContain(
      "outcomes 11,11,false,5",
    );
  });

  it("writes the properties of a function that a script declares", async () => {
    const getSource = (expected: string) => `
      const box: { a: number } = { a: 1 };
      box.a = 2;
      let calls = 0;
      function read(this: { [key: string | symbol]: unknown }, value: number) {
        return this.res;
      }
      function foo() {
        calls++;
        return 7;
      }
      foo.res = true;
      foo.count = 1;
      foo.count += 2;
      const read1 = [1].map(read, foo);
      const called = foo();
      const outcomes = [read1[0], foo.res, foo.count, called, calls, typeof foo].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("true,true,3,7,1,function"))).failure).toBeUndefined();
    expect((await checkModel(getSource("true,true,1,7,1,function"))).failure?.message).toContain(
      "outcomes true,true,3,7,1,function",
    );
  });

  it("throws where a write in strict mode names no binding or a global that can't change", async () => {
    const getSource = (expected: string) => `
      "use strict";
      let count: number = 0;
      const results: string[] = [];
      try {
        // @ts-ignore
        missing = 1;
      } catch (error) {
        results.push(error instanceof ReferenceError ? "reference" : "other");
      }
      try {
        // @ts-ignore
        for ([unknown] of [[]]) count += 1;
      } catch (error) {
        results.push(error instanceof ReferenceError ? "reference" : "other");
      }
      try {
        // @ts-ignore
        NaN = 12;
      } catch (error) {
        results.push(error instanceof TypeError ? "type" : "other");
      }
      const outcomes = [...results, count].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("reference,reference,type,0"))).failure).toBeUndefined();
    expect((await checkModel(getSource("reference,reference,type,1"))).failure?.message).toContain(
      "outcomes reference,reference,type,0",
    );
  });

  it("stops where a write outside strict mode names no binding", () => {
    expect(() =>
      compile(`
        let count: number = 0;
        // @ts-ignore
        missing = 1;
        count = 1;
      `),
    ).toThrow("tla-ts can't write a global outside strict mode");
  });

  it("gives undefined as the type of a name that no binding has", async () => {
    const getSource = (expected: string) => `
      let type: string = "none";
      // @ts-ignore
      type = typeof missing;
      if (type !== "${expected}") throw new Error("outcomes " + type);
    `;
    expect((await checkModel(getSource("undefined"))).failure).toBeUndefined();
    expect((await checkModel(getSource("object"))).failure?.message).toContain(
      "outcomes undefined",
    );
  });

  it("throws where a statement reads a property of a name that no binding has", async () => {
    const getSource = (expected: string) => `
      const seen: string[] = [];
      const run = (body: () => void) => {
        try {
          body();
          seen.push("none");
        } catch (error) {
          seen.push(error instanceof ReferenceError ? "reference" : "other");
        }
      };
      // @ts-ignore
      run(() => { delete missingOne.x; });
      // @ts-ignore
      run(() => { typeof missingTwo.x; });
      // @ts-ignore
      run(() => { missingThree[0] = 42; });
      const outcomes = seen.join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("reference,reference,reference"))).failure).toBeUndefined();
    expect((await checkModel(getSource("reference,reference,none"))).failure?.message).toContain(
      "outcomes reference,reference,reference",
    );
  });

  it("writes the prototype of a class that extends a native error", async () => {
    const getSource = (expected: string) => `
      class Err extends TypeError {}
      Err.prototype.message = "custom";
      const given = new Err("given");
      const inherited = new Err();
      const outcomes = [
        given.message,
        inherited.message,
        inherited.name,
        Object.prototype.hasOwnProperty.call(given, "message"),
        Object.prototype.hasOwnProperty.call(inherited, "message"),
      ].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect(
      (await checkModel(getSource("given,custom,TypeError,true,false"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(getSource("given,custom,TypeError,true,true"))).failure?.message,
    ).toContain("outcomes given,custom,TypeError,true,false");
  });

  it("makes objects of the errors of a class whose prototype a script reads", async () => {
    const getSource = (expected: string) => `
      class Err extends SyntaxError {}
      class Sub extends Err {}
      const prototype = Err.prototype;
      const sub = new Sub("sub");
      let caught = "none";
      try {
        const thrown = new Err("thrown");
        throw thrown;
      } catch (error) {
        caught = (error as Err).message;
      }
      const outcomes = [
        Object.getPrototypeOf(Sub.prototype) === prototype,
        sub instanceof Err,
        sub instanceof SyntaxError,
        sub instanceof TypeError,
        caught,
      ].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("true,true,true,false,thrown"))).failure).toBeUndefined();
    expect((await checkModel(getSource("true,true,true,true,thrown"))).failure?.message).toContain(
      "outcomes true,true,true,false,thrown",
    );
  });

  it("gives an error a message only where its message isn't undefined", async () => {
    const getSource = (expected: string) => `
      class Err extends Error {}
      Err.prototype.message = "custom";
      const make = (message?: string) => new Err(message);
      const result = [make().message, make("own").message, Object.hasOwn(make(), "message")];
      if (result.join(",") !== "${expected}") throw new Error(result.join(","));
    `;
    expect((await checkModel(getSource("custom,own,false"))).failure).toBeUndefined();
    expect((await checkModel(getSource("custom,own,true"))).failure?.message).toContain(
      "custom,own,false",
    );
  });

  it("runs the constructors of a class that extends Error, which give its error a message and a cause", async () => {
    const getSource = (expected: string) => `
      class BaseError extends Error {
        seen: string;
        constructor(message?: string, cause?: unknown) {
          super(message, cause === undefined ? {} : { cause });
          this.seen = "line" in this ? "early" : "late";
          this.name = "BaseError";
        }
      }
      class LineError extends BaseError {
        line: number | undefined;
        constructor(message: string, line?: number) {
          super(message, line);
          this.name = "LineError";
          this.line = line;
        }
      }
      const plain = new BaseError();
      const caused = new LineError("bad", 3);
      const result = [
        Object.hasOwn(plain, "message"),
        plain.message,
        Object.hasOwn(plain, "cause"),
        caused.cause,
        caused.seen,
        Object.keys(caused).join("+"),
        caused instanceof LineError,
        caused instanceof BaseError,
        caused instanceof Error,
        plain instanceof LineError,
        Object.getPrototypeOf(caused) === LineError.prototype,
        \`\${caused.name}: \${caused.message}\`,
      ].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    const expected = "false,,false,3,late,seen+name+line,true,true,true,false,true,LineError: bad";
    expect((await checkModel(getSource(expected))).failure).toBeUndefined();
    expect(
      (await checkModel(getSource(expected.replace("late", "early")))).failure?.message,
    ).toContain(expected);
  });

  it("reads the name of a caught error that a class extending Error makes through a cast", async () => {
    const getSource = (expected: string) => `
      class BaseError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "BaseError";
        }
      }
      let caught = "";
      try {
        throw new BaseError("negative");
      } catch (error) {
        caught = (error as Error).name;
      }
      if (caught !== "${expected}") throw new Error("caught " + caught);
    `;
    expect((await checkModel(getSource("BaseError"))).failure).toBeUndefined();
    expect((await checkModel(getSource("Error"))).failure?.message).toContain("caught BaseError");
  });

  it("reads a caught error that the heap holds or a record through a cast or an index", async () => {
    const getSource = (expected: string) => `
      class BaseError extends Error {
        constructor(message: string, options?: ErrorOptions) {
          super(message, options);
          this.name = "BaseError";
        }
      }
      const read = (isBase: boolean) => {
        try {
          if (isBase) throw new BaseError("negative", { cause: 7 });
          throw new TypeError("plain");
        } catch (error) {
          const held = error as Error;
          return [held.message, held["name"], \`\${held.cause}\`].join("+");
        }
      };
      const result = [read(true), read(false)].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect(
      (await checkModel(getSource("negative+BaseError+7,plain+TypeError+undefined"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(getSource("negative+Error+7,plain+TypeError+undefined"))).failure?.message,
    ).toContain("negative+BaseError+7");
  });

  it("tells an error that the heap holds from a native class's instance with instanceof", async () => {
    const getSource = (expected: string) => `
      class BaseError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "BaseError";
        }
      }
      const describe = (error: unknown) =>
        [error instanceof Error, error instanceof TypeError].join("+");
      const results: string[] = [];
      try {
        throw new BaseError("a");
      } catch (error) {
        results.push(describe(error));
      }
      try {
        throw new TypeError("b");
      } catch (error) {
        results.push(describe(error));
      }
      try {
        throw { code: 1 };
      } catch (error) {
        results.push(describe(error));
      }
      const result = results.join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect(
      (await checkModel(getSource("true+false,true+true,false+false"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(getSource("true+true,true+true,false+false"))).failure?.message,
    ).toContain("true+false,true+true,false+false");
  });

  it("throws the error that an arrow makes with a class that extends an error with fields", async () => {
    const getSource = (expected: string) => `
      class Coded extends TypeError {
        code = 7;
      }
      const make = (message: string) => new Coded(message, { cause: "why" });
      let caught = "";
      try {
        throw make("bad");
      } catch (error) {
        caught =
          error instanceof Coded && error instanceof TypeError
            ? [error.code, error.message, error.cause, Object.keys(error).join("+")].join(",")
            : "other";
      }
      if (caught !== "${expected}") throw new Error(caught);
    `;
    expect((await checkModel(getSource("7,bad,why,code"))).failure).toBeUndefined();
    expect((await checkModel(getSource("7,bad,,code"))).failure?.message).toContain(
      "7,bad,why,code",
    );
  });

  it("makes the objects of what an if or a switch tests", async () => {
    const getSource = (expected: string) => `
      let count: number = 0;
      if (!new Boolean(false)) count += 1;
      if (new Boolean(false) === new Boolean(false)) count += 10;
      switch (typeof new Boolean(true)) {
        case "object":
          count += 100;
      }
      if (String(count) !== "${expected}") throw new Error("outcomes " + count);
    `;
    expect((await checkModel(getSource("100"))).failure).toBeUndefined();
    expect((await checkModel(getSource("110"))).failure?.message).toContain("outcomes 100");
  });

  it("stops where a skipped operand spreads an object with a getter", async () => {
    const source = `
      let count: number = 0;
      const source = {
        get value(): number {
          count += 1;
          return 1;
        },
      };
      if ((false && { ...source }) === undefined) count += 100;
      if (count !== 0) throw new Error("outcomes " + count);
    `;
    expect((await checkModel(source)).failure?.message).toContain("tla-ts can't call getters");
  });

  describe("runs the code of an operand that makes an object only where the operand runs", () => {
    const getSource = (operand: string) => `
      let count: number = 0;
      const bump = (): number => {
        count += 10;
        return 1;
      };
      if ((${operand}) === undefined) count += 100;
      if (count !== 0) throw new Error("outcomes " + count);
    `;

    it.each(["true || { x: bump() }", "true ? 1 : new Boolean(bump())"])(
      "skips %s",
      async (operand) => {
        expect((await checkModel(getSource(operand))).failure).toBeUndefined();
      },
    );

    it("runs false || { x: bump() }", async () => {
      expect((await checkModel(getSource("false || { x: bump() }"))).failure?.message).toContain(
        "outcomes 10",
      );
    });
  });

  it("makes the objects of what a throw statement throws", async () => {
    const getSource = (expected: string) => `
      class Thing {
        constructor(public value: number) {}
      }
      const caught: string[] = [];
      try {
        throw new Thing(3);
      } catch (error) {
        caught.push(String((error as Thing).value));
      }
      try {
        throw { code: 7 };
      } catch (error) {
        caught.push(String((error as { code: number }).code));
      }
      const outcomes = caught.join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("3,7"))).failure).toBeUndefined();
    expect((await checkModel(getSource("3,8"))).failure?.message).toContain("outcomes 3,7");
  });

  it("makes the objects of a function that a call defines and runs at once", async () => {
    const getSource = (expected: string) => `
      const first = 1 + (function (t: number) { return { a: t }; })(2 + 3).a;
      const second = ((t: number) => ({ b: t * 2 }))(first).b;
      const outcomes = [first, second].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("6,12"))).failure).toBeUndefined();
    expect((await checkModel(getSource("6,13"))).failure?.message).toContain("outcomes 6,12");
  });

  it("makes a regexp that a function returns each time the function runs", async () => {
    const getSource = (expected: string) => `
      const makeRegExp = () => /(?:)/;
      const holder = { first: makeRegExp() };
      const outcomes = [holder.first === makeRegExp(), makeRegExp().source].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("false,(?:)"))).failure).toBeUndefined();
    expect((await checkModel(getSource("true,(?:)"))).failure?.message).toContain(
      "outcomes false,(?:)",
    );
  });

  it("makes the objects of the defaults of an assignment's pattern", async () => {
    const getSource = (expected: string) => `
      let prop: unknown;
      let other: unknown;
      const seen: string[] = [];
      for ({ prop = "x" in {} } of [{}, { prop: 1 }] as { prop?: unknown }[]) seen.push(String(prop));
      ({ other = "y" in { y: 2 } } = {} as { other?: unknown });
      seen.push(String(other));
      const outcomes = seen.join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("false,1,true"))).failure).toBeUndefined();
    expect((await checkModel(getSource("false,1,false"))).failure?.message).toContain(
      "outcomes false,1,true",
    );
  });

  it("assigns a catch's parameter as it does a let", async () => {
    const getSource = (expected: string) => `
      let seen = "";
      const run = (a: number) => {
        try {
          throw "stuff1";
        } catch (a) {
          seen += String(a);
          a = 2;
          seen += String(a);
        }
        return a;
      };
      const out = run(1);
      const outcomes = [seen, out].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("stuff12,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("stuff1stuff1,1"))).failure?.message).toContain(
      "outcomes stuff12,1",
    );
  });

  it("assigns a catch's parameter in a loop's body", async () => {
    const getSource = (expected: string) => `
      let total = 0;
      for (let k = 0; k < 3; k++) {
        try {
          throw k;
        } catch (e) {
          e = (e as number) * 10;
          total += e as number;
        }
      }
      const outcomes = String(total);
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("30"))).failure).toBeUndefined();
    expect((await checkModel(getSource("3"))).failure?.message).toContain("outcomes 30");
  });

  it("runs a call that changes state before a throw statement throws its value", async () => {
    const getSource = (expected: string) => `
      let i = 0;
      const adding = () => {
        i++;
        return i * 10;
      };
      let caught: unknown;
      try {
        throw adding();
      } catch (error) {
        caught = error;
      }
      const outcomes = [caught, i].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("10,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("0,1"))).failure?.message).toContain("outcomes 10,1");
  });

  it("converts an increment's operand that holds undefined or null to a number", async () => {
    const getSource = (expected: string) => `
      const box: { n: number | undefined; m: number | null } = { n: undefined, m: null };
      let x: number | undefined = undefined;
      let y: number | null = null;
      const a = x!++;
      const b = y!++;
      const c = ++box.n!;
      const d = y!--;
      box.m!++;
      const outcomes = [isNaN(a), isNaN(x!), b, isNaN(c), d, y, box.m].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("true,true,0,true,1,0,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("true,true,1,true,1,0,1"))).failure?.message).toContain(
      "outcomes true,true,0,true,1,0,1",
    );
  });

  describe("gives what a compound assignment to a property writes, as its value", () => {
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

    it("agrees with Node on 3", async () => {
      expect((await checkModel(getSource(3, 5, -2, 300))).failure).toBeUndefined();
    });

    it("rejects the expectation 1", async () => {
      expect((await checkModel(getSource(1, 5, -2, 300))).failure?.message).toContain("private");
    });

    it("rejects the expectation 3", async () => {
      expect((await checkModel(getSource(3, 1, -2, 300))).failure?.message).toContain("property");
    });

    it("rejects the expectation 3 (2)", async () => {
      expect((await checkModel(getSource(3, 5, 2, 300))).failure?.message).toContain("element");
    });

    it("rejects the expectation 3 (3)", async () => {
      expect((await checkModel(getSource(3, 5, -2, 44))).failure?.message).toContain("typed");
    });
  });

  it("returns a value whose calls read state", async () => {
    const getSource = (expected: string) => `
      let count = 1;
      const read = () => count;
      const bump = () => {
        count++;
        return [read(), count].join(",");
      };
      const result = bump();
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("2,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,2"))).failure?.message).toContain("2,2");
  });

  it("returns a value whose calls change state", async () => {
    const getSource = (expected: string) => `
      let count = 0;
      const bump = () => {
        count++;
        return count;
      };
      const twice = () => {
        return bump() * 10 + bump();
      };
      const first = twice();
      const result = [first, count].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("12,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("21,2"))).failure?.message).toContain("12,2");
  });

  it("returns a call's value before finally changes what the call changed", async () => {
    const getSource = (expected: string) => `
      let count = 0;
      const bump = () => {
        count++;
        return count;
      };
      const guarded = () => {
        try {
          return bump();
        } finally {
          count *= 10;
        }
      };
      const first = guarded();
      const result = [first, count].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("1,10"))).failure).toBeUndefined();
    expect((await checkModel(getSource("10,10"))).failure?.message).toContain("1,10");
  });

  it("returns a call's value from inside a loop", async () => {
    const getSource = (expected: string) => `
      let count = 0;
      const bump = () => {
        count++;
        return count;
      };
      const find = (values: number[]) => {
        for (const value of values) {
          if (value > 1) return bump() * value;
        }
        return 0;
      };
      const found = find([1, 5]);
      const result = [found, count].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("5,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("5,0"))).failure?.message).toContain("5,1");
  });

  it("tells an instance of a class from a number or an object of its shape", async () => {
    const getSource = (expected: string) => `
      class Ratio {
        num = 1;
      }
      const isRatio = (value: number | Ratio) => value instanceof Ratio;
      const ratio = new Ratio();
      const shaped: Ratio = { num: 1 };
      const result = [isRatio(ratio), isRatio(2), isRatio(shaped)].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("true,false,false"))).failure).toBeUndefined();
    expect((await checkModel(getSource("true,false,true"))).failure?.message).toContain(
      "true,false,false",
    );
  });

  it.each([
    ["without a heap", "", ""],
    [
      "with a heap",
      "const box = { held: [1, 2] as unknown };",
      ", isOverflow(box), isOverflow(box.held)",
    ],
  ])("tells an error of a class from a value of type unknown %s", async (_, setup, heapCalls) => {
    const getSource = (expected: string) => `
      ${setup}
      const isOverflow = (error: unknown) =>
        error instanceof RangeError && error.message === "Maximum call stack size exceeded";
      const isError = (value: any) => value instanceof Error;
      const result = [
        isOverflow(new RangeError("Maximum call stack size exceeded")),
        isOverflow(new RangeError("other")),
        isOverflow(new TypeError("Maximum call stack size exceeded")),
        isOverflow(1),
        isOverflow("Maximum call stack size exceeded"),
        isError(new TypeError("t")),
        isError(undefined)${heapCalls},
      ].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    const expected = `true,false,false,false,false,true,false${heapCalls === "" ? "" : ",false,false"}`;
    expect((await checkModel(getSource(expected))).failure).toBeUndefined();
    const wrong = expected.replace("true,false,false", "true,false,true");
    // Without a heap, the check throws where the script's first state fails.
    const failure = await checkModel(getSource(wrong)).then(
      (result) => result.failure?.message,
      (error: Error) => error.message,
    );
    expect(failure).toContain(expected);
  });

  it("holds in the heap a field's array that fill made", async () => {
    const getSource = (expected: string) => `
      class Table {
        slots = Array<number>(2).fill(0);
      }
      const table = new Table();
      const kept = table.slots;
      table.slots = Array<number>(3).fill(1);
      kept[0] = 7;
      const result = [kept.join(","), table.slots.join(",")].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("7,0;1,1,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("7,0;7,1,1"))).failure?.message).toContain("7,0;1,1,1");
  });

  it("gives a field that takes this the instance that the class makes", async () => {
    const getSource = (expected: string) => `
      class Node {
        root: Node = this;
      }
      const first = new Node();
      const second = new Node();
      second.root = first;
      const result = [first.root === first, second.root === first].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("true,true"))).failure).toBeUndefined();
    expect((await checkModel(getSource("true,false"))).failure?.message).toContain("true,true");
  });

  it("gives a field that takes this the instance after a field whose array the heap holds", async () => {
    const getSource = (expected: string) => `
      class Node {
        parents: Node[] = [];
        root: Node = this;
      }
      const node = new Node();
      node.parents.push(node);
      const result = [node.root === node, node.parents[0].root === node].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("true,true"))).failure).toBeUndefined();
    expect((await checkModel(getSource("true,false"))).failure?.message).toContain("true,true");
  });

  it("makes the regexps whose patterns constants give, through a map's callback", async () => {
    const getSource = (expected: string) => `
      const patterns = [/[0-9]+/, /[a-z]+/].map((prefix) => new RegExp(\`^\${prefix.source}-$\`));
      const result = [patterns[0].test("1-"), patterns[1].test("1-")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("true,false"))).failure).toBeUndefined();
    await expect(checkModel(getSource("true,true"))).rejects.toThrow("true,false");
  });

  it("makes the regexp whose pattern a function's argument and String.raw give", async () => {
    const getSource = (expected: string) => `
      const make = (suffix: string) => new RegExp(String.raw\`<\\d>\` + suffix, /a/i.flags);
      const step = make("x");
      const result = [step.test("<1>X"), step.test("<1>y")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("true,false"))).failure).toBeUndefined();
    await expect(checkModel(getSource("false,false"))).rejects.toThrow("true,false");
  });

  it("makes the regexps whose patterns a let and a for-of over an array literal give", async () => {
    const getSource = (expected: string) => `
      let source = "(?<first>.)(?<second>.)";
      for (const flags of ["g", "gu"]) {
        const pattern = new RegExp(source, flags);
        if ("abcd".replace(pattern, "$<second>$<first>") !== "${expected}") throw new Error(flags);
      }
    `;
    expect((await checkModel(getSource("badc"))).failure).toBeUndefined();
    expect((await checkModel(getSource("bacd"))).failure?.message).toContain("g");
  });

  it("makes the empty regexp that new RegExp gives without arguments", async () => {
    const getSource = (expected: string) => `
      // @ts-ignore
      const pattern = new RegExp();
      const result = [pattern.source, pattern.flags, pattern.test("x")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("(?:),,true"))).failure).toBeUndefined();
    await expect(checkModel(getSource("(?:),,false"))).rejects.toThrow("(?:),,true");
  });

  it("makes the regexps whose pattern and flags primitive literals give", async () => {
    const getSource = (expected: string) => `
      const seen: string[] = [];
      // @ts-ignore
      seen.push(new RegExp(undefined).source, RegExp(void 0, undefined).source, new RegExp(true, "m").source);
      // @ts-ignore
      seen.push(new RegExp(null).source, String(new RegExp(1.0).test("a1")));
      try {
        // @ts-ignore
        new RegExp(".", true);
        seen.push("none");
      } catch (error) {
        seen.push(error instanceof SyntaxError ? "syntax" : "other");
      }
      const outcomes = seen.join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect(
      (await checkModel(getSource("(?:),(?:),true,null,true,syntax"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(getSource("(?:),(?:),true,null,true,none"))).failure?.message,
    ).toContain("outcomes (?:),(?:),true,null,true,syntax");
  });

  it("makes a set of what flatMap gives of a map's keys", async () => {
    const getSource = (expected: string) => `
      const LITERALS = new Map([
        ["==", 1],
        ["<=", 2],
      ]);
      const PREFIXES = new Set([...LITERALS.keys()].flatMap((image) => [image.slice(0, 1), image]));
      const result = [PREFIXES.size, PREFIXES.has("<"), PREFIXES.has("=<")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("4,true,false"))).failure).toBeUndefined();
    await expect(checkModel(getSource("3,true,false"))).rejects.toThrow("4,true,false");
  });

  it("changes a field's array through a local that names it", async () => {
    const getSource = (expected: string) => `
      const shrink = (values: number[], size: number) => {
        while (values.length > size) values.pop();
      };
      class Pool {
        temporaries: number[] = [];
        end(mark: number) {
          const temporaries = this.temporaries;
          let total = 0;
          for (let index = temporaries.length - 1; index >= mark; index--) total += temporaries[index];
          shrink(temporaries, mark);
          return total;
        }
      }
      const pool = new Pool();
      pool.temporaries.push(4, 5);
      const total = pool.end(1);
      const result = [total, pool.temporaries.join(",")].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("5;4"))).failure).toBeUndefined();
    expect((await checkModel(getSource("5;4,5"))).failure?.message).toContain("5;4");
  });

  it("iterates what a splice removes from a field's array", async () => {
    const getSource = (expected: string) => `
      class Vector {
        items = [1, 2, 3];
        released = 0;
        shrink(size: number) {
          for (const value of this.items.splice(size)) this.released += value;
        }
      }
      const vector = new Vector();
      vector.shrink(1);
      const result = [vector.items.join(","), vector.released].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("1;5"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,2;3"))).failure?.message).toContain("1;5");
  });

  it("reorders in place the new array that a method gives", async () => {
    const getSource = (expected: string) => `
      const doubled = [1, 2].map((value) => value * 2).reverse();
      const result = doubled.join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("4,2"))).failure).toBeUndefined();
    await expect(checkModel(getSource("2,4"))).rejects.toThrow("4,2");
  });

  it("makes a map from entries that calls give and spread, where a later entry of a key wins", async () => {
    const getSource = (expected: string) => `
      interface Operator {
        name: string;
        low: number;
      }
      const createOperators = (low: number, ...names: string[]) =>
        names.map((name): [string, Operator] => [name, { name, low }]);
      const OPERATORS = new Map([
        ...createOperators(10, "+", "-"),
        ["*", { name: "*", low: 20 }],
        ...createOperators(30, "-", "/"),
      ]);
      const result = [OPERATORS.size, OPERATORS.get("-")?.low, OPERATORS.get("*")?.low].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("4,30,20"))).failure).toBeUndefined();
    expect((await checkModel(getSource("4,10,20"))).failure?.message).toContain("4,30,20");
  });

  it("makes a map from a map and entries that an array spreads, where a later entry of a key wins", async () => {
    const getSource = (expected: string) => `
      const BASE = new Map([
        ["+", 10],
        ["-", 20],
      ]);
      const SYNONYMS = [
        ["+", "plus"],
        ["-", "minus", "+"],
      ];
      const OPERATORS = new Map([
        ...BASE,
        ...SYNONYMS.flatMap((synonyms) =>
          synonyms.slice(1).map((synonym) => [synonym, BASE.get(synonyms[0])] as const),
        ),
      ]);
      const result = [OPERATORS.size, OPERATORS.get("plus"), OPERATORS.get("+")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("4,10,20"))).failure).toBeUndefined();
    await expect(checkModel(getSource("4,10,10"))).rejects.toThrow("4,10,20");
  });

  it("makes a set of what an iterable parameter takes, from a set or an array", async () => {
    const getSource = (expected: string) => `
      const INFIX = new Set([3, 1, 2]);
      const tokens = (kinds: Iterable<number>) => ({ type: "tokens", kinds: new Set(kinds) });
      const fromSet = tokens(INFIX);
      const fromArray = tokens([5, 5, 4]);
      const result = [fromSet.kinds.size, fromSet.kinds.has(1), fromArray.kinds.size].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("3,true,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("3,true,3"))).failure?.message).toContain("3,true,2");
  });

  it("makes a set of what an iterable parameter takes, from a set or an array the heap holds", async () => {
    const getSource = (expected: string) => `
      const INFIX = new Set([3, 1]);
      INFIX.add(2);
      const PREFIX = [5, 5];
      PREFIX.push(4);
      const tokens = (kinds: Iterable<number>) => ({ type: "tokens", kinds: new Set(kinds) });
      const fromSet = tokens(INFIX);
      const fromArray = tokens(PREFIX);
      INFIX.add(7);
      const result = [fromSet.kinds.size, fromSet.kinds.has(7), fromArray.kinds.size].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("3,false,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("4,true,3"))).failure?.message).toContain("3,false,2");
  });

  it("makes a set of an array literal that spreads a set", async () => {
    const getSource = (expected: string) => `
      const postfix = new Set(["'", "^+"]);
      const made = new Set(["SUBSET", "'", ...postfix]);
      const result = [made.size, made.has("^+"), made.has("^#")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("3,true,false"))).failure).toBeUndefined();
    await expect(checkModel(getSource("4,true,false"))).rejects.toThrow("3,true,false");
  });

  it("makes a set of an array literal that spreads a map's keys", async () => {
    const getSource = (expected: string) => `
      const levels = new Map([
        ["CONSTANT", "Constant"],
        ["VARIABLE", "Variable"],
      ]);
      const starts = new Set(["NEW", ...levels.keys()]);
      const result = [starts.size, starts.has("VARIABLE"), starts.has("Variable")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("3,true,false"))).failure).toBeUndefined();
    await expect(checkModel(getSource("3,true,true"))).rejects.toThrow("3,true,false");
  });

  it("makes a set that the heap holds of an array literal that spreads a set", async () => {
    const getSource = (expected: string) => `
      const postfix = new Set(["'", "^+"]);
      const made = new Set(["SUBSET", "'", ...postfix]);
      const box = { made };
      box.made.add("x");
      postfix.add("y");
      const result = [made.size, made.has("^+"), made.has("y"), postfix.has("x")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("4,true,false,false"))).failure).toBeUndefined();
    expect((await checkModel(getSource("4,true,true,false"))).failure?.message).toContain(
      "4,true,false,false",
    );
  });

  it("makes a set of an array literal that spreads a set into an iterable parameter", async () => {
    const getSource = (expected: string) => `
      const tokens = (kinds: Iterable<number>) => ({ type: "tokens", kinds: new Set(kinds) });
      const PREFIX = tokens([1, 2, 2]);
      const NONEXP = tokens([...PREFIX.kinds, 9, 1]);
      const result = [NONEXP.kinds.size, NONEXP.kinds.has(2), NONEXP.kinds.has(9)].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("3,true,true"))).failure).toBeUndefined();
    expect((await checkModel(getSource("4,true,true"))).failure?.message).toContain("3,true,true");
    expect(() =>
      compile(`
        const kinds = new Set([1, 2]);
        const listed = [...kinds, 3];
      `),
    ).toThrow("Sets have no order");
  });

  it("passes a rest parameter the arguments and the arrays that a call spreads into it", async () => {
    const getSource = (expected: string) => `
      const join = (first: string, ...rest: string[]) => [first, rest.length, rest.join("+")].join(":");
      const more = ["b", "c"];
      const result = join("a", "x", ...more, "d");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("a:4:x+b+c+d"))).failure).toBeUndefined();
    await expect(checkModel(getSource("a:3:x+b+c"))).rejects.toThrow("a:4:x+b+c+d");
    expect(() =>
      compile(`
        const join = (first: string, ...rest: string[]) => first + rest.length;
        const more = ["b", "c"];
        const result = join(...(more as [string, ...string[]]));
      `),
    ).toThrow("tla-ts can't spread arguments into the parameters before a rest parameter");
  });

  it("forwards a rest parameter that a function spreads into another's call", async () => {
    const getSource = (expected: string) => `
      const sequence = (...parts: string[]) => ({ type: "sequence", units: parts.map((part) => part + "!") });
      const forward = (...parts: string[]) => ({ type: "wrap", body: sequence(...parts) });
      const unit = forward("a", "b");
      const result = [unit.type, unit.body.units.join("")].join(":");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("wrap:a!b!"))).failure).toBeUndefined();
    expect((await checkModel(getSource("wrap:a!"))).failure?.message).toContain("wrap:a!b!");
  });

  it("makes the objects of a call's arguments where the call runs first inside an expression", async () => {
    const getSource = (expected: string) => `
      interface Box {
        value: number;
      }
      const wrap = (box: Box) => ({ inner: box });
      const boxes = [wrap({ value: 1 }), wrap({ value: 2 })];
      boxes[0].inner.value = 3;
      const result = [boxes[0].inner.value, boxes[1].inner.value].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("3,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("3,3"))).failure?.message).toContain("3,2");
  });

  it("makes the object of a conditional's branch beside a branch that calls a function", async () => {
    const getSource = (expected: string) => `
      interface Unit {
        type: string;
        name: string;
      }
      const make = (name: string): Unit => ({ type: "tokens", name });
      const toUnit = (part: string): Unit =>
        part.startsWith("<") ? make(part) : { type: "call", name: part };
      const first = toUnit("<A>");
      const second = toUnit("b");
      const third = toUnit("b");
      const result = [first.type, second.type, second === third].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("tokens,call,false"))).failure).toBeUndefined();
    expect((await checkModel(getSource("tokens,call,true"))).failure?.message).toContain(
      "tokens,call,false",
    );
  });

  it("runs the call that a conditional's branch maps over before it maps", async () => {
    const getSource = (expected: string) => `
      interface Token {
        text: string;
      }
      const tokenize = (source: string): Token[] => {
        const tokens: Token[] = [];
        for (const part of source.split(" ")) tokens.push({ text: part });
        return tokens;
      };
      const upper = (token: Token): Token => ({ text: token.text.toUpperCase() });
      const read = (source: string, isRaw: boolean) =>
        isRaw ? tokenize(source) : tokenize(source).map(upper);
      const getText = (tokens: Token[]) => tokens.map((token) => token.text).join("");
      const result = [getText(read("a b", true)), getText(read("a b", false))].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("ab,AB"))).failure).toBeUndefined();
    expect((await checkModel(getSource("ab,ab"))).failure?.message).toContain("ab,AB");
  });

  it("makes the object of a call that a logical assignment runs only where its target is empty", async () => {
    const getSource = (expected: string) => `
      interface Location {
        line: number;
      }
      const parse = (lines: number[]) => {
        let made = 0;
        const getLocation = (line: number): Location => {
          made += 1;
          return { line };
        };
        const starts: Location[] = [];
        const getStart = (index: number) => {
          starts[index] ??= getLocation(lines[index]);
          return starts[index];
        };
        return [getStart(0).line, getStart(0).line, getStart(1).line, made].join(",");
      };
      const result = parse([4, 7]);
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("4,4,7,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("4,4,7,3"))).failure?.message).toContain("4,4,7,2");
  });

  it("writes what a logical assignment's call gives over what the call writes", async () => {
    const getSource = (expected: string) => `
      interface Location {
        line: number;
      }
      const box: { start?: Location } = {};
      const make = (line: number): Location => {
        box.start = { line: 9 };
        return { line };
      };
      box.start ??= make(1);
      const starts: Location[] = [];
      let index = 0;
      const bump = (): Location => {
        index = 1;
        return { line: 5 };
      };
      starts[index] ??= bump();
      let empty: Location | undefined;
      const kept = (empty ||= make(6));
      const result = [box.start.line, starts[0]?.line, index, kept.line].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("9,5,1,6"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,5,1,6"))).failure?.message).toContain("9,5,1,6");
  });

  it("reads a property before a branch whose call changes it", async () => {
    const getSource = (expected: string) => `
      class Box {
        value = 1;
      }
      const box = new Box();
      const grow = () => {
        box.value++;
        return box.value * 10;
      };
      const pair = [box.value, box.value > 0 ? grow() : 0, box.value];
      const result = pair.join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("1,20,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("2,20,2"))).failure?.message).toContain("1,20,2");
  });

  it("makes a map from an array of entries, where a later entry of a key wins", async () => {
    const getSource = (expected: string) => `
      const pairs: [string, number][] = [
        ["a", 0],
        ["b", 1],
        ["a", 2],
      ];
      const indexes = new Map(pairs);
      const result = [indexes.get("a"), indexes.size].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("2,2"))).failure).toBeUndefined();
    await expect(checkModel(getSource("0,2"))).rejects.toThrow("2,2");
  });

  it("makes a map from the entries that a map of an array gives, where a later entry of a key wins", async () => {
    const getSource = (expected: string) => `
      const spelled: Record<string, string> = { "+": "plus", "-": "minus", "*": "plus" };
      const unspelled = new Map(Object.entries(spelled).map((entry) => [entry[1], entry[0]]));
      const result = [unspelled.get("plus"), unspelled.get("minus"), unspelled.size].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("*,-,2"))).failure).toBeUndefined();
    expect((await checkModel(getSource("+,-,2"))).failure?.message).toContain("*,-,2");
  });

  it("spreads a string's code points into an array", async () => {
    const getSource = (expected: string) => `
      const word = "hi";
      const letters = ["a", ..."≈𝔸", ...word];
      const result = [letters.join(","), letters.length].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("a,≈,𝔸,h,i;5"))).failure).toBeUndefined();
    await expect(checkModel(getSource("a,≈,𝔸,h,i;6"))).rejects.toThrow("a,≈,𝔸,h,i;5");
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

  const getShownSource = (expected: string) => `
    interface Node { size: number; children: Node[] }
    const show = (text: string, tree: Node) => {
      const getText = (node: Node) => text.slice(0, node.size);
      const format = (node: Node, width: number): string | undefined => {
        if (node.size <= width) return getText(node);
        return formatItems(node.children, width - 1);
      };
      const formatItems = (items: Node[], width: number) => {
        const parts = items.map((item) => format(item, width));
        return parts.includes(undefined) ? undefined : parts.join(",");
      };
      return format(tree, 3) ?? text;
    };
    const tree: Node = {
      size: 5,
      children: [{ size: 2, children: [] }, { size: 4, children: [{ size: 1, children: [] }] }],
    };
    const shown = show("abcdef", tree);
    if (shown !== "${expected}") throw new Error(shown);
  `;

  it("runs local functions that call each other through an array method's callback", async () => {
    expect((await checkModel(getShownSource("ab,a"))).failure).toBeUndefined();
  });

  it("fails where local functions that call each other through a callback give another value", async () => {
    expect((await checkModel(getShownSource("ab,b"))).failure?.message).toContain('"ab,a"');
  });

  const getTotalSource = (expected: number) => `
    interface Node { size: number; children: Node[] }
    const total = (tree: Node) => {
      const holder = { extra: 0 };
      const sizeOf = (node: Node): number =>
        node.size +
        holder.extra +
        node.children.map((child) => sizeOf(child)).reduce((sum, size) => sum + size, 0);
      holder.extra = 1;
      return sizeOf(tree);
    };
    const result = total({ size: 2, children: [{ size: 3, children: [] }] });
    if (result !== ${expected}) throw new Error(\`\${result}\`);
  `;

  it("reads the objects that a local function that calls itself reads where it runs", async () => {
    expect((await checkModel(getTotalSource(7))).failure).toBeUndefined();
  });

  it("fails where a local function that calls itself reads objects that give another value", async () => {
    expect((await checkModel(getTotalSource(6))).failure?.message).toContain('"7"');
  });

  const getNestedSource = (expected: string) => `
    const pass = (list: number[], getElements = (inner: number[]) => inner) => getElements(list);
    const enumerate = (list: number[], depth: number): number[] => {
      const elements = pass(list, (inner) => inner).flatMap((child) =>
        depth > 0 ? enumerate([child * 10], depth - 1) : [child],
      );
      return elements;
    };
    const holder = { value: 1 };
    holder.value += 1;
    const result = enumerate([1, 2], 2);
    if (result.join() !== "${expected}") throw new Error(result.join());
  `;

  it("runs the calls of a function that an expression calls from inside itself on its own arguments", async () => {
    expect((await checkModel(getNestedSource("100,200"))).failure).toBeUndefined();
  });

  const getDefaultSource = (expected: number) => `
    const holder = { value: 1 };
    holder.value += 1;
    const getChildren = (
      list: number[],
      getElements = (inner: number[]) => inner.map((value) => value + list.length),
    ) => getElements(list);
    const count = (lists: number[][]) => {
      let total = 0;
      for (const list of lists) total += getChildren(list).reduce((sum, value) => sum + value, 0);
      return total;
    };
    const total = [[[1], [2, 3]]].map((lists) => count(lists))[0];
    if (total !== ${expected}) throw new Error(\`\${total}\`);
  `;

  it("calls the function that a parameter's default gives where an expression calls the function", async () => {
    expect((await checkModel(getDefaultSource(11))).failure).toBeUndefined();
  });

  it("fails where the function that an expression's call defaults to gives another value", async () => {
    expect((await checkModel(getDefaultSource(6))).failure?.message).toContain('"11"');
  });

  it("fails where a function that an expression calls from inside itself gives another array", async () => {
    expect((await checkModel(getNestedSource("10,20,10,20"))).failure?.message).toContain(
      '"100,200"',
    );
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

  it("makes once the object that another file's constant holds", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/reasoning.ts");
    const source = readFileSync(path, "utf8");
    expect((await check(compile(source, path))).failure).toBeUndefined();
    const wrong = await check(compile(source.replace("second.why !==", "second.why ==="), path));
    expect(wrong.failure?.message).toContain("shared");
  });

  it("makes once the objects that another file's constants make through a function", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/precedence.ts");
    const source = readFileSync(path, "utf8");
    expect((await check(compile(source, path))).failure).toBeUndefined();
    const wrong = await check(compile(source.replace("!== 6", "!== 7"), path));
    expect(wrong.failure?.message).toContain("precedence");
  });

  it("makes once the objects that a constant makes through a function that a recursive function reads", async () => {
    const getSource = (total: number) => `
      const createPrecedence = (low: number, high: number) => ({ low, high });
      const PRECEDENCES = new Map([
        ["=>", createPrecedence(1, 1)],
        ["#", createPrecedence(5, 5)],
      ]);
      const getPrecedence = (operator: string) => PRECEDENCES.get(operator);
      const getTotal = (operators: string[]): number =>
        operators.length === 0
          ? 0
          : (getPrecedence(operators[0])?.high ?? 0) + getTotal(operators.slice(1));
      if (getPrecedence("#") !== PRECEDENCES.get("#") || getTotal(["=>", "#"]) !== ${total}) {
        throw new Error("precedence");
      }
    `;
    expect((await checkModel(getSource(6))).failure).toBeUndefined();
    expect((await checkModel(getSource(7))).failure?.message).toContain("precedence");
  });

  it("skips the code of a class that a file names only as a type", async () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/chain-typing.ts");
    const source = readFileSync(path, "utf8");
    expect((await check(compile(source, path))).failure).toBeUndefined();
    const wrong = await check(compile(source.replace("!== 2", "!== 3"), path));
    expect(wrong.failure?.message).toContain("linked");
  });

  describe("runs nothing of a file that a file imports only types from", () => {
    const path = join(import.meta.dirname, "../fixtures/typescript/imports/leveling.ts");
    const source = readFileSync(path, "utf8");

    it("agrees with Node", async () => {
      expect((await check(compile(source, path))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      const wrong = await check(compile(source.replace("!== 2", "!== 3"), path));
      expect(wrong.failure?.message).toContain("leveled");
    });
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
        "const box = { seen: [[1]] };\nconst copy = box.seen;\nbox.seen[0].push(2);\nlet size = copy[0].length;",
      ),
    ).toThrow("box.seen would share an object that changes in place");
    expect(() =>
      compile(
        "const box = { kept: [[1]] };\nconst wrap = { inner: box.kept };\nwrap.inner[0].push(3);\nlet size = box.kept[0].length;",
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

  describe("runs the function that a call's callee holds, by its value", () => {
    it("runs what a variable or another object's key holds", async () => {
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
        for (let index = 0; index < 2; index++) operation(1);
        if (count !== 14) throw new Error("count");
      `);
      expect(result.failure).toBeUndefined();
    });

    it("runs a method that a script reads off an object", async () => {
      const result = await checkModel(`
        const get = { read() { return 1; } }.read;
        const read = get();
        if (read !== 1) throw new Error("read");
      `);
      expect(result.failure).toBeUndefined();
    });
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

  describe("throws a Date method's TypeError on another receiver and toISOString's RangeError", () => {
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

    it("agrees with Node on {}", async () => {
      expect((await checkModel(getSource("{}"))).failure).toBeUndefined();
    });

    it("agrees with Node on 0", async () => {
      expect((await checkModel(getSource("0"))).failure).toBeUndefined();
    });

    it("rejects the expectation valid", async () => {
      expect((await checkModel(getSource("valid"))).failure?.message).toContain("throws");
    });
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

  describe("searches an array-like object whose length and elements getters answer", () => {
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

    it("agrees with Node on 2", async () => {
      expect((await checkModel(getSource(2))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(-1))).failure?.message).toContain("unexpected");
    });
  });

  describe("runs the getter of the constructor that map makes its array through", () => {
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

    it("agrees with Node on 0", async () => {
      expect((await checkModel(getSource(0))).failure).toBeUndefined();
    });

    it("rejects the expectation 1", async () => {
      expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
    });
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

  describe("runs a source's getters in key order as Object.assign copies them", () => {
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

    it("agrees with Node on a,x,", async () => {
      expect((await checkModel(getSource("a,x,"))).failure).toBeUndefined();
    });

    it("rejects the expectation x,a,", async () => {
      expect((await checkModel(getSource("x,a,"))).failure?.message).toContain("unexpected");
    });
  });

  describe("runs getters as toReversed and with copy an array, skipping the index with replaces", () => {
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

    it("agrees with Node", async () => {
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
    });

    it("agrees with Node on 3", async () => {
      expect((await checkModel(getSource(3))).failure).toBeUndefined();
    });

    it("rejects the expectation 2", async () => {
      expect((await checkModel(getSource(2))).failure?.message).toContain("unexpected");
    });
  });

  describe("runs a getter that a descriptor writes as a method", () => {
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

    it("agrees with Node on aa", async () => {
      expect((await checkModel(getSource("aa"))).failure).toBeUndefined();
    });

    it("rejects the expectation a", async () => {
      expect((await checkModel(getSource("a"))).failure?.message).toContain("unexpected");
    });
  });

  describe("runs the setters that Object.assign writes through, and a setter's extra parameters", () => {
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

    it("agrees with Node on 1", async () => {
      expect((await checkModel(getSource(1))).failure).toBeUndefined();
    });

    it("rejects the expectation 2", async () => {
      expect((await checkModel(getSource(2))).failure?.message).toContain("unexpected");
    });
  });

  describe("runs a getter whose type has an index signature where a computed key picks it", () => {
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

    it("agrees with Node on x", async () => {
      expect((await checkModel(getSource("x"))).failure).toBeUndefined();
    });

    it("rejects the expectation y", async () => {
      expect((await checkModel(getSource("y"))).failure?.message).toContain("unexpected");
    });
  });

  describe("runs the getters that Object.defineProperties defines where a statement reads them", () => {
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

    it("agrees with Node on 11", async () => {
      expect((await checkModel(getSource(11))).failure).toBeUndefined();
    });

    it("rejects the expectation 1", async () => {
      expect((await checkModel(getSource(1))).failure?.message).toContain("unexpected");
    });
  });

  describe("runs a setter that a descriptor's getter returns by name", () => {
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

    it("agrees with Node on written", async () => {
      expect((await checkModel(getSource("written"))).failure).toBeUndefined();
    });

    it("rejects the expectation data", async () => {
      expect((await checkModel(getSource("data"))).failure?.message).toContain("unexpected");
    });
  });

  describe("runs the setters of the properties that a pattern or a for-of head writes", () => {
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

    it("agrees with Node on y1z7y2-", async () => {
      expect((await checkModel(getSource("y1z7y2-"))).failure).toBeUndefined();
    });

    it("rejects the expectation z7y1y2-", async () => {
      expect((await checkModel(getSource("z7y1y2-"))).failure?.message).toContain("unexpected");
    });
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

  describe("assigns a rest element to an object pattern, or to a property through its setter", () => {
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

    it("agrees with Node on 2", async () => {
      expect((await checkModel(getSource(2))).failure).toBeUndefined();
    });

    it("rejects the expectation 3", async () => {
      expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
    });
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

  describe("calls a buffer's or a view's getter that a script takes from its descriptor", () => {
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

    it("agrees with Node on 2", async () => {
      expect((await checkModel(getSource(2))).failure).toBeUndefined();
    });

    it("rejects the expectation 3", async () => {
      expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
    });
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

  describe("calls the size getter that a script takes from a Map's or a Set's descriptor", () => {
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

    it("agrees with Node on 2", async () => {
      expect((await checkModel(getSource(2))).failure).toBeUndefined();
    });

    it("rejects the expectation 3", async () => {
      expect((await checkModel(getSource(3))).failure?.message).toContain("unexpected");
    });
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

  describe("sorts an array whose elements run getters and setters, index by index", () => {
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

    it('agrees with Node on "d"', async () => {
      expect((await checkModel(getSource('"d"'))).failure).toBeUndefined();
    });

    it('rejects the expectation "c"', async () => {
      expect((await checkModel(getSource('"c"'))).failure?.message).toContain("unexpected");
    });
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

  describe("sets a prototype through the __proto__ setter, which throws where the object refuses", () => {
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

    it("agrees with Node on !isCycle", async () => {
      expect((await checkModel(getSource("!isCycle"))).failure).toBeUndefined();
    });

    it("rejects the expectation isCycle", async () => {
      expect((await checkModel(getSource("isCycle"))).failure?.message).toContain("unexpected");
    });

    it("agrees with Node", async () => {
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

  describe("reads the descriptors that defineProperties and create take through their getters", () => {
    it("reads each enumerable descriptor that defineProperties takes", async () => {
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
      `);
      expect(result.failure).toBeUndefined();
    });

    it("reads the get of a descriptor that create takes through its getter", async () => {
      const result = await checkModel(`
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

  it("runs a literal object's toString and toLocaleString through Object.prototype's", async () => {
    const source = `
      const holder = { seen: "" };
      const one = {}.toString();
      const two = {}.toLocaleString();
      if (one !== "[object Object]" || two !== "[object Object]") throw new Error("literal");
      holder.seen = one;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('two !== "[object Object]"', 'two === "[object Object]"');
    expect((await checkModel(wrong)).failure?.message).toContain('"literal"');
  });

  it("runs Object.prototype's toLocaleString on Object.prototype", async () => {
    const source = `
      const holder = { seen: 0 };
      if (Object.prototype.toLocaleString() !== "[object Object]") throw new Error("proto");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('!== "[object Object]"', '=== "[object Object]"');
    expect((await checkModel(wrong)).failure?.message).toContain('"proto"');
  });

  it("reads Symbol.toStringTag in an object's toLocaleString", async () => {
    const source = `
      const holder = { seen: "" };
      const tagged = { [Symbol.toStringTag]: "T" };
      if (tagged.toLocaleString() !== "[object T]") throw new Error("tag");
      holder.seen = tagged.toString();
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"[object T]"', '"[object Object]"');
    expect((await checkModel(wrong)).failure?.message).toContain('"tag"');
  });

  it("runs the toString of the object that new Object makes", async () => {
    const source = `
      const holder = { seen: 0 };
      const obj = new Object() as { [key: string]: unknown };
      if (obj.valueOf().toString() !== "[object Object]") throw new Error("valueOf");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('!== "[object Object]"', '=== "[object Object]"');
    expect((await checkModel(wrong)).failure?.message).toContain('"valueOf"');
  });

  it("stops where an object's own toString may run in its toLocaleString", async () => {
    const result = await checkModel(`
      const holder = { seen: "" };
      const own = { toString: () => "own" };
      holder.seen = own.toLocaleString();
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell which method this call runs");
  });

  it("gives the object that Object.setPrototypeOf changes", async () => {
    const source = `
      const holder = { seen: 0 };
      const propValue = {};
      const newProto = { test262prop: propValue };
      const obj: { test262prop?: object } = {};
      let result: unknown;
      result = Object.setPrototypeOf(obj, newProto);
      if (result !== obj) throw new Error("result");
      if (Object.prototype.hasOwnProperty.call(obj, "test262prop")) throw new Error("own");
      if (obj.test262prop !== propValue) throw new Error("inherited");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("result !== obj", "result === obj");
    expect((await checkModel(wrong)).failure?.message).toContain('"result"');
  });

  it("escapes the controls and the lone surrogates of a string in JSON.stringify", async () => {
    const source = `
      const text = JSON.stringify('a\\u0001\\ud800😀"\\\\\\n\\u001f');
      if (text !== '"a\\\\u0001\\\\ud800😀\\\\"\\\\\\\\\\\\n\\\\u001f"') throw new Error("quote");
      const lone = JSON.stringify("\\udc00x\\ud83d");
      if (lone !== '"\\\\udc00x\\\\ud83d"') throw new Error("lone");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(String.raw`"\udc00x\ud83d"`, String.raw`"\ud83d\udc00x"`);
    expect((await checkModel(wrong)).failure?.message).toContain('"lone"');
  });

  it("throws the TypeError of JSON.stringify of a BigInt", async () => {
    const source = `
      const holder = { seen: 0 };
      let isThrown = false;
      try {
        const text = JSON.stringify(0n);
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown) throw new Error("primitive");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("JSON.stringify(0n)", "JSON.stringify(0)");
    expect((await checkModel(wrong)).failure?.message).toContain('"primitive"');
  });

  it("throws the TypeError of JSON.stringify of an object that holds a BigInt", async () => {
    const source = `
      const holder = { seen: 0 };
      let isThrown = false;
      try {
        const text = JSON.stringify({ x: [1, 0n] });
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown) throw new Error("nested");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("[1, 0n]", "[1, 0]");
    expect((await checkModel(wrong)).failure?.message).toContain('"nested"');
  });

  it("throws the TypeError of JSON.stringify of a BigInt object", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: bigint): BigInt;
        }
      }
      const holder = { seen: 0 };
      let isThrown = false;
      try {
        const text = JSON.stringify(Object(0n) as unknown as object, ["y"]);
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown) throw new Error("object");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("if (!isThrown)", "if (isThrown)");
    expect((await checkModel(wrong)).failure?.message).toContain('"object"');
  });

  it("converts the object that a definition gives an array's length twice", async () => {
    const source = `
      const holder = { seen: 0 };
      const arr: number[] = [];
      let count = 0;
      const convertible = {
        valueOf: () => {
          count += 1;
          return 2;
        },
      };
      Object.defineProperty(arr, "length", { value: convertible });
      if (arr.length !== 2 || count !== 2) throw new Error("define");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("count !== 2", "count !== 1");
    expect((await checkModel(wrong)).failure?.message).toContain('"define"');
  });

  it("converts the length that Object.defineProperties defines", async () => {
    const source = `
      const holder = { seen: 0 };
      const other: number[] = [];
      Object.defineProperties(other, { length: { value: { toString: () => "3" } } });
      if (other.length !== 3) throw new Error("properties");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("other.length !== 3", "other.length !== 0");
    expect((await checkModel(wrong)).failure?.message).toContain('"properties"');
  });

  it("converts the length of a descriptor whose type has an index signature", async () => {
    const source = `
      const array: unknown[] = [];
      let isConverted = false;
      const descriptor: { [key: string]: unknown } = {};
      Object.defineProperty(descriptor, "value", {
        value: {
          toString: () => {
            isConverted = true;
            return 3;
          },
        },
      });
      Object.defineProperties(array, { length: descriptor });
      if (array.length !== 3 || !isConverted) throw new Error("length");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("array.length !== 3", "array.length !== 2");
    expect((await checkModel(wrong)).failure?.message).toContain('"length"');
  });

  it("throws the TypeError of a length that converts to no primitive", async () => {
    const source = `
      const holder = { seen: 0 };
      let isThrown = false;
      try {
        Object.defineProperty([], "length", { value: { valueOf: () => ({}), toString: () => ({}) } });
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown) throw new Error("primitive");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("if (!isThrown)", "if (isThrown)");
    expect((await checkModel(wrong)).failure?.message).toContain('"primitive"');
  });

  it("throws the RangeError of a length that converts to no array length", async () => {
    const source = `
      const holder = { seen: 0 };
      let isThrown = false;
      try {
        Object.defineProperty([], "length", { value: { valueOf: () => -1 } });
      } catch (error) {
        isThrown = error instanceof RangeError;
      }
      if (!isThrown) throw new Error("range");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("() => -1", "() => 1");
    expect((await checkModel(wrong)).failure?.message).toContain('"range"');
  });

  it("converts the length that Reflect.defineProperty defines", async () => {
    const source = `
      const holder = { seen: 0 };
      const third: number[] = [];
      Object.preventExtensions(third);
      const isDefined = Reflect.defineProperty(third, "length", { value: { valueOf: () => 0 } });
      if (!isDefined || third.length !== 0) throw new Error("reflect");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("!isDefined ||", "isDefined ||");
    expect((await checkModel(wrong)).failure?.message).toContain('"reflect"');
  });

  it("makes the objects that JSON.parse makes of a literal's text", async () => {
    const source = `
      const holder = { seen: 0 };
      const text = '{"b":{"c":3},"a":1}';
      const parsed: { a: number; b: { c: number } } = JSON.parse(text);
      if (parsed.a !== 1 || parsed.b.c !== 3) throw new Error("values");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("parsed.b.c !== 3", "parsed.b.c !== 2");
    expect((await checkModel(wrong)).failure?.message).toContain('"values"');
  });

  it("orders the keys of the object that JSON.parse makes", async () => {
    const source = `
      const holder = { seen: 0 };
      const parsed: object = JSON.parse('{"b":0,"a":1,"2":0,"__proto__":5}');
      if (Object.keys(parsed).join() !== "2,b,a,__proto__") throw new Error("keys");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"2,b,a,__proto__"', '"b,a,2,__proto__"');
    expect((await checkModel(wrong)).failure?.message).toContain('"keys"');
  });

  it("makes an ordinary object of JSON.parse's text", async () => {
    const source = `
      const holder = { seen: 0 };
      const parsed: object = JSON.parse('{"__proto__":5}');
      if (Object.getPrototypeOf(parsed) !== Object.prototype || !Object.hasOwn(parsed, "__proto__")) {
        throw new Error("own");
      }
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("!Object.hasOwn", "Object.hasOwn");
    expect((await checkModel(wrong)).failure?.message).toContain('"own"');
  });

  it("stops where a type keeps the arrays that JSON.parse makes outside the heap", () => {
    expect(() =>
      compile(`
        const parsed: number[] = JSON.parse("[1, 2]");
        if (parsed.length !== 2) throw new Error("length");
      `),
    ).toThrow("Unsupported call");
  });

  it("revives what JSON.parse parses from the innermost value", async () => {
    const source = `
      const holder = { seen: 0 };
      const calls: string[] = [];
      const text = '{"b":0,"a":{"c":[1]},"1":0}';
      const result: unknown = JSON.parse(text, function (key: string, value: unknown) {
        calls.push(key);
        return value;
      });
      if (calls.join() !== "1,b,0,c,a,") throw new Error("order");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"1,b,0,c,a,"', '"1,b,a,0,c,"');
    expect((await checkModel(wrong)).failure?.message).toContain('"order"');
  });

  it("deletes a key that a reviver gives undefined for", async () => {
    const source = `
      const holder = { seen: 0 };
      const result: object = JSON.parse('{"b":0,"a":1}', function (key: string, value: unknown) {
        return key === "b" ? undefined : value;
      });
      if (Object.keys(result).join() !== "a") throw new Error("deleted");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('!== "a"', '!== "b,a"');
    expect((await checkModel(wrong)).failure?.message).toContain('"deleted"');
  });

  it("reads a key that a reviver deleted through the prototype", async () => {
    const source = `
      const holder = { seen: 0 };
      const proto = Object.prototype as { [key: string]: unknown };
      proto.b = 3;
      const read: { b?: number } = JSON.parse('{"a": 1, "b": 2}', function (
        this: { b?: number },
        key: string,
        value: unknown,
      ) {
        if (key === "a") delete this.b;
        return value;
      });
      delete proto.b;
      if (!Object.hasOwn(read, "b") || read.b !== 3) throw new Error("prototype");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("read.b !== 3", "read.b !== 2");
    expect((await checkModel(wrong)).failure?.message).toContain('"prototype"');
  });

  it("keeps a key that a reviver made unconfigurable", async () => {
    const source = `
      const holder = { seen: 0 };
      const kept: { b?: number } = JSON.parse('{"a": 1, "b": 2}', function (
        this: object,
        key: string,
        value: unknown,
      ) {
        if (key === "a") Object.defineProperty(this, "b", { configurable: false });
        return key === "b" ? 22 : value;
      });
      if (kept.b !== 2) throw new Error("kept");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("kept.b !== 2", "kept.b !== 22");
    expect((await checkModel(wrong)).failure?.message).toContain('"kept"');
  });

  it("throws what a reviver throws out of JSON.parse", async () => {
    const source = `
      const holder = { seen: 0 };
      const throwsRange = () => {
        try {
          JSON.parse("0", function () {
            throw new RangeError("x");
          });
        } catch (error) {
          return error instanceof RangeError;
        }
        return false;
      };
      if (!throwsRange()) throw new Error("call");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('new RangeError("x")', 'new TypeError("x")');
    expect((await checkModel(wrong)).failure?.message).toContain('"call"');
  });

  it("throws what a getter throws as JSON.parse revives a value", async () => {
    const source = `
      const holder = { seen: 0 };
      const thrower = function () {
        throw new RangeError("y");
      };
      const throwsRange = () => {
        try {
          JSON.parse("[0,0]", function (this: object) {
            Object.defineProperty(this, "1", { get: thrower });
          });
        } catch (error) {
          return error instanceof RangeError;
        }
        return false;
      };
      if (!throwsRange()) throw new Error("getter");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('new RangeError("y")', 'new TypeError("y")');
    expect((await checkModel(wrong)).failure?.message).toContain('"getter"');
  });

  it("stops where a reviver changes an object before JSON.parse revives it", async () => {
    const result = await checkModel(`
      const replacement = { a: 1 };
      const parsed: unknown = JSON.parse('[0, {"a": 1}]', function (
        this: object,
        key: string,
        value: unknown,
      ) {
        if (key === "0") Object.defineProperty(this, "1", { value: replacement });
        return value;
      });
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't revive an object that the reviver changed",
    );
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

  describe("converts the primitives and wrappers that an operator on numbers takes", () => {
    const getOrdered = (first: string, second: string) => `
      const first = { toString: () => "${first}" };
      const second = { toString: () => "${second}" };
      // @ts-ignore
      const isOrdered = first <= second;
      if (!isOrdered) throw new Error("ordered");
    `;

    it("agrees with Node", async () => {
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
    });

    it("agrees with Node on objects that convert to strings", async () => {
      expect((await checkModel(getOrdered("a", "b"))).failure).toBeUndefined();
    });

    it("agrees with Node on objects that convert to strings outside ASCII", async () => {
      expect((await checkModel(getOrdered("e", "\\u00e9"))).failure).toBeUndefined();
    });

    it("rejects the order of strings outside ASCII reversed", async () => {
      expect((await checkModel(getOrdered("\\u00e9", "e"))).failure?.message).toContain("ordered");
    });
  });

  it("changes the case of ASCII letters", async () => {
    const result = await checkModel(`
      const lower = (text: string) => text.toLowerCase();
      if (lower("Hello, World 42!") !== "hello, world 42!" || "az@[\`{".toUpperCase() !== "AZ@[\`{") {
        throw new Error("case");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("changes the case of characters outside ASCII that a script holds", async () => {
    const getSource = (expected: string) => `
      if ("straße".toUpperCase() !== "${expected}" || "\u00c9COLE".toLowerCase() !== "\u00e9cole") {
        throw new Error("case");
      }
      if ("\u0130".toLowerCase().length !== 2 || "\u00ff".toUpperCase().charCodeAt(0) !== 0x178) {
        throw new Error("special");
      }
    `;
    expect((await checkModel(getSource("STRASSE"))).failure).toBeUndefined();
    await expect(checkModel(getSource("STRAßE"))).rejects.toThrow("case");
  });

  it("changes the case of a code point that a surrogate pair makes", async () => {
    const getSource = (expected: string) => `
      const high = "\uD801";
      const low = "\uDC28";
      if ((high + low + "x").toUpperCase() !== "${expected}X" || high.toUpperCase() !== high) {
        throw new Error("pair");
      }
    `;
    expect((await checkModel(getSource("\\u{10400}"))).failure).toBeUndefined();
    await expect(checkModel(getSource("\\u{10428}"))).rejects.toThrow("pair");
  });

  it("stops where it lowers a capital sigma, whose case depends on the letters around it", async () => {
    await expect(
      checkModel(`if ("\u0391\u03a3".toLowerCase() === "") throw new Error("never");`),
    ).rejects.toThrow("tla-ts can't lower the case of a capital sigma");
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

  it("spreads a string's characters into an array", async () => {
    const result = await checkModel(`
      const word: string = "abc";
      const letters = [...word, 1, ..."d"];
      if (letters.length !== 5 || letters[2] !== "c" || letters[4] !== "d") throw new Error("spread");
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`
        const letters = [..."ab"];
        if (letters.length !== 1) throw new Error("spread");
      `),
    ).rejects.toThrow("spread");
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
  });

  it("reads the code of a character outside ASCII that a script writes", async () => {
    const wide = await checkModel(`
      const text = "a\u00e9";
      if (text.charCodeAt(1) !== 233) throw new Error("wide");
    `);
    expect(wide.failure).toBeUndefined();
    await expect(
      checkModel(`
        const text = "a\u00e9";
        if (text.charCodeAt(1) !== 234) throw new Error("wide");
      `),
    ).rejects.toThrow("wide");
  });

  it("makes the code units of numbers that a script writes into fromCharCode and fromCodePoint", async () => {
    const getSource = (expected: number) => `
      const text = String.fromCharCode(0x180e, -32767, 0x00a0);
      if (text.charCodeAt(1) !== ${expected} || String.fromCodePoint(0x1f600).length !== 2) {
        throw new Error("codes");
      }
      if (/\\S/.test(text.slice(2)) || !/\\S/.test(text.slice(0, 1)) || text.trim().length !== 2) {
        throw new Error("spaces");
      }
    `;
    expect((await checkModel(getSource(32769))).failure).toBeUndefined();
    await expect(checkModel(getSource(32768))).rejects.toThrow("codes");
  });

  it("reads a string's code units outside ASCII and iterates its code points", async () => {
    const result = await checkModel(`
      const text = "é😀\uDE00a";
      if (text.length !== 5 || text.charCodeAt(0) !== 233 || text.charCodeAt(2) !== 0xde00) {
        throw new Error("units");
      }
      if (text.codePointAt(1) !== 0x1f600 || text.codePointAt(3) !== 0xde00) {
        throw new Error("points");
      }
      const points = [...text];
      const visited: string[] = [];
      for (const point of text) visited.push(point);
      if (points.length !== 4 || points[1] !== "😀" || visited.join("|") !== "é|😀|\uDE00|a") {
        throw new Error("iterate");
      }
      if (text.split("").length !== 5 || String.fromCodePoint(0x1f600, 233) !== "😀é") {
        throw new Error("split");
      }
      if (!("z" < "é") || !("😀" < "￿") || "é" < "e") throw new Error("order");
    `);
    expect(result.failure).toBeUndefined();
    await expect(
      checkModel(`
        const points = [..."é😀"];
        if (points.length !== 3) throw new Error("units");
      `),
    ).rejects.toThrow("units");
  });

  it("stops where it can't make or encode a character outside ASCII", async () => {
    await expect(
      checkModel(`
        const code = 0x4e00;
        if (String.fromCharCode(code) === "") throw new Error("never");
      `),
    ).rejects.toThrow("tla-ts can't make a character outside ASCII");
    await expect(
      checkModel(`if (encodeURI("é") === "") throw new Error("never");`),
    ).rejects.toThrow("tla-ts can't encode a character outside ASCII");
  });

  describe("converts the arguments of Math's functions, and stops where it can't", () => {
    it("agrees with Node", async () => {
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
    });

    it("rejects wrong expectation 1", async () => {
      const unconverted = await checkModel(`
      const larger = (value: any) => Math.max(value, 1);
      const result = larger({});
    `);
      expect(unconverted.failure?.message).toContain(
        "tla-ts can't convert this object to a number",
      );
    });

    it("rejects wrong expectation 2", async () => {
      const indexed = await checkModel(`
      const list = [1, 2, 3];
      const value = list.at({} as any);
    `);
      expect(indexed.failure?.message).toContain("tla-ts can't convert this object to a number");
    });
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

  describe("converts a primitive that an Object function reads to an object", () => {
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
    const wrong = [
      ["count !== 11", "count !== 111"],
      ['"a,b"', '"b,a"'],
      ["length?.value !== 3", "length?.value !== 2"],
    ];
    const thrown = source.replace(
      'Object.getOwnPropertyNames("abc");',
      "Object.getOwnPropertyNames(undefined);",
    );

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it.each(wrong)("rejects replacing %s with %s", async (from, to) => {
      expect((await checkModel(source.replace(from, to))).failure).toBeDefined();
    });

    it("rejects wrong expectation 2", async () => {
      expect((await checkModel(thrown)).failure).toBeDefined();
    });
  });

  it("lists the keys of the descriptions of a primitive's own properties", async () => {
    const source = `
      const holder = { seen: 0 };
      if (Object.keys(Object.getOwnPropertyDescriptors(0)).length !== 0) throw new Error("number");
      if (Object.entries(Object.getOwnPropertyDescriptors("a")).length !== 2) throw new Error("string");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("length !== 0", "length !== 1");
    expect((await checkModel(wrong)).failure?.message).toContain('"number"');
  });

  it("describes the own properties of a constant number", async () => {
    const source = `
      const holder = { seen: 0 };
      if (Object.keys(Object.getOwnPropertyDescriptors(-Infinity)).length !== 0) throw new Error("infinity");
      if (Object.keys(Object.getOwnPropertyDescriptors(Math.PI)).length !== 0) throw new Error("pi");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("(Math.PI)).length !== 0", "(Math.PI)).length !== 1");
    expect((await checkModel(wrong)).failure?.message).toContain('"pi"');
  });

  it("reads a negative number as a constant argument", async () => {
    const source = `
      Object.getOwnPropertyDescriptor(-2, "foo");
      if (Object.getOwnPropertyDescriptor(-2, "foo") !== undefined) throw new Error("negative");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("!== undefined", "=== undefined");
    expect((await checkModel(wrong)).failure?.message).toContain('"negative"');
  });

  it("throws the TypeError of an Object.prototype method that call gives null or undefined", async () => {
    const source = `
      let count = 0;
      try { Object.prototype.hasOwnProperty.call(undefined, "foo"); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.prototype.propertyIsEnumerable.call(null, "foo"); } catch (error) { if (error instanceof TypeError) count += 10; }
      try { Object.prototype.valueOf.call(undefined); } catch (error) { if (error instanceof TypeError) count += 100; }
      try { Object.prototype.toLocaleString.call(null); } catch (error) { if (error instanceof TypeError) count += 1000; }
      if (count !== 1111) throw new Error("count");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("hasOwnProperty.call(undefined", "hasOwnProperty.call(0");
    expect((await checkModel(wrong)).failure?.message).toContain('"count"');
  });

  it("converts this to an object only where isPrototypeOf takes an object", async () => {
    const source = `
      let count = 0;
      try { Object.prototype.isPrototypeOf.call(null, {}); } catch (error) { if (error instanceof TypeError) count += 1; }
      try { Object.prototype.isPrototypeOf.call(undefined, 1); } catch { count += 10; }
      try { Object.prototype.valueOf.call(true); } catch { count += 100; }
      if (count !== 1) throw new Error("count");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(
      "isPrototypeOf.call(undefined, 1)",
      "isPrototypeOf.call(undefined, {})",
    );
    expect((await checkModel(wrong)).failure?.message).toContain('"count"');
  });

  const getPrimitiveSource = (isHeap: boolean, check: string) => `
      ${isHeap ? "const holder = { seen: 0 };" : ""}
      if (${check}) throw new Error("primitive");
  `;
  const PRIMITIVE_CHECK =
    "Number.prototype.isPrototypeOf(5) || String.prototype.isPrototypeOf('a') || Object.prototype.isPrototypeOf(1n)";

  it("answers false where isPrototypeOf takes a primitive", async () => {
    expect((await checkModel(getPrimitiveSource(true, PRIMITIVE_CHECK))).failure).toBeUndefined();
  });

  it("answers false where isPrototypeOf takes a primitive in a script without objects", async () => {
    expect((await checkModel(getPrimitiveSource(false, PRIMITIVE_CHECK))).failure).toBeUndefined();
  });

  it("finds no prototype chain where isPrototypeOf takes a primitive", async () => {
    const result = await checkModel(getPrimitiveSource(true, "!Number.prototype.isPrototypeOf(5)"));
    expect(result.failure?.message).toContain('"primitive"');
  });

  it("gives back the primitive that Object.setPrototypeOf takes", async () => {
    const source = `
      const symbol = Symbol("s");
      if (Object.setPrototypeOf(true, null) !== true) throw new Error("boolean");
      if (Object.setPrototypeOf(3, {}) !== 3) throw new Error("number");
      if (Object.setPrototypeOf(symbol, null) !== symbol) throw new Error("symbol");
      if (Object.setPrototypeOf(0n, null) !== 0n) throw new Error("bigint");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("!== 3", "!== 4");
    expect((await checkModel(wrong)).failure?.message).toContain('"number"');
  });

  it("stops Object.setPrototypeOf of a primitive that may be null", async () => {
    const result = await checkModel(`
      const target: number = JSON.parse("null");
      if (Object.setPrototypeOf(target, null) !== target) throw new Error("same");
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't tell what Object.setPrototypeOf changes",
    );
  });

  it("wraps the primitive that Object.prototype.valueOf takes through call", async () => {
    const source = `
      const holder = { seen: 0 };
      const wrapped = Object.prototype.valueOf.call(true);
      if (typeof wrapped !== "object") throw new Error("type");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('!== "object"', '=== "object"');
    expect((await checkModel(wrong)).failure?.message).toContain('"type"');
  });

  it("stops wrapping through an Object.prototype.valueOf that a script replaced", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      Object.prototype.valueOf = function () {
        return holder;
      };
      const wrapped = Object.prototype.valueOf.call(true);
      if (wrapped !== holder) throw new Error("replaced");
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't call an Object.prototype.valueOf that a script replaced",
    );
  });

  it("stops calling an Object.prototype method that a script replaced", async () => {
    const result = await checkModel(`
      Object.prototype.valueOf = () => 0;
      Object.prototype.valueOf.call(undefined);
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't call an Object.prototype.valueOf that a script replaced",
    );
  });

  describe("seals what a new of a built-in makes where nothing else reaches it", () => {
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
    const frozen = source.replace(
      "Object.seal(new Uint8Array());",
      "Object.freeze(new Uint8Array(1));",
    );

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(frozen)).failure).toBeDefined();
    });
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

  it("reads the prototype of a function value that the built-in objects hold", async () => {
    const source = `
      const holder = { seen: 0 };
      const thrower = Object.getOwnPropertyDescriptor(Function.prototype, "caller")!.get;
      if (Object.getPrototypeOf(thrower) !== Function.prototype) throw new Error("prototype");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("!== Function.prototype", "=== Function.prototype");
    expect((await checkModel(wrong)).failure?.message).toContain('"prototype"');
  });

  it("reads the own keys of a function value that the built-in objects hold", async () => {
    const source = `
      const holder = { seen: 0 };
      const thrower = Object.getOwnPropertyDescriptor(Function.prototype, "caller")!.get;
      const names = Object.getOwnPropertyNames(thrower);
      if (names.indexOf("length") !== 0 || names.indexOf("name") !== 1) throw new Error("names");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('indexOf("name") !== 1', 'indexOf("name") === 1');
    expect((await checkModel(wrong)).failure?.message).toContain('"names"');
  });

  it("answers hasOwnProperty on a function value that the built-in objects hold", async () => {
    const source = `
      const holder = { seen: 0 };
      const thrower = Object.getOwnPropertyDescriptor(Function.prototype, "caller")!.get;
      if (Object.prototype.hasOwnProperty.call(thrower, "arguments")) throw new Error("own");
      if (!Object.prototype.hasOwnProperty.call(thrower, "length")) throw new Error("length");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(
      'if (Object.prototype.hasOwnProperty.call(thrower, "arguments"))',
      'if (!Object.prototype.hasOwnProperty.call(thrower, "arguments"))',
    );
    expect((await checkModel(wrong)).failure?.message).toContain('"own"');
  });

  it("stops where it can't read a function value as an object", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      const getter = Object.getOwnPropertyDescriptor({ get a() { return 1; } }, "a")!.get;
      const missing = Object.getOwnPropertyDescriptor({ a: 1 }, "a")!.get;
      holder.seen = Object.getOwnPropertyNames(getter).length;
    `);
    expect(result.failure?.message).toContain("tla-ts can't read this function as an object");
  });

  it("throws the TypeError of calling %ThrowTypeError% through a function value", async () => {
    const source = `
      const holder = { seen: 0 };
      const thrower = Object.getOwnPropertyDescriptor(Function.prototype, "caller")!.get;
      let caught = 0;
      try {
        thrower!();
      } catch (error) {
        if (error instanceof TypeError) caught += 1;
      }
      if (caught !== 1) throw new Error("caught");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("caught !== 1", "caught !== 0");
    expect((await checkModel(wrong)).failure?.message).toContain('"caught"');
  });

  it("throws the TypeError of calling undefined through a function value", async () => {
    const source = `
      const holder = { seen: 0 };
      const missing = Object.getOwnPropertyDescriptor({ a: 1 }, "a")!.get;
      let caught = 0;
      try {
        missing!();
      } catch (error) {
        if (error instanceof TypeError) caught += 1;
      }
      if (caught !== 1) throw new Error("caught");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("caught !== 1", "caught !== 0");
    expect((await checkModel(wrong)).failure?.message).toContain('"caught"');
  });

  it("stops where it can't tell which function a function value calls", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      const getter = Object.getOwnPropertyDescriptor({ get a() { return 1; } }, "a")!.get;
      getter!();
      holder.seen = 1;
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell which function this call runs");
  });

  const getUncallableSource = (expected: string) => `
      const holder = { seen: 0 };
      const GeneratorFunctionPrototype = Object.getPrototypeOf(function* () {});
      let caught = "none";
      try {
        GeneratorFunctionPrototype(1, "two");
      } catch (error) {
        caught = error instanceof TypeError ? "TypeError" : "other";
      }
      if (caught !== "${expected}") throw new Error("caught");
  `;

  it("throws the TypeError of calling an object that isn't callable", async () => {
    expect((await checkModel(getUncallableSource("TypeError"))).failure).toBeUndefined();
  });

  it("throws no other error for calling an object that isn't callable", async () => {
    expect((await checkModel(getUncallableSource("other"))).failure?.message).toContain('"caught"');
  });

  it("stops where a value of type any holds a function it can't name", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      const FunctionPrototype = Object.getPrototypeOf(function () {});
      FunctionPrototype();
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell which function this call runs");
  });

  describe("tests the extensibility of a function that a variable holds where it runs", () => {
    const source = `
      const holder = { seen: 0 };
      const made = () => 1;
      function declared() {}
      if (!Object.isExtensible(made) || Object.isFrozen(declared)) throw new Error("made");
      const revoke = Proxy.revocable({}, {}).revoke;
      if (!Object.isExtensible(revoke)) throw new Error("revoke");
      const thrower = Object.getOwnPropertyDescriptor(Function.prototype, "caller")!.get!;
      if (Object.isExtensible(thrower) || !Object.isFrozen(thrower)) throw new Error("thrower");
      const missing = Object.getOwnPropertyDescriptor({ a: 1 }, "a")!.get;
      if (Object.isExtensible(missing) || !Object.isFrozen(missing)) throw new Error("missing");
      holder.seen = 1;
    `;
    const wrong = [
      ["!Object.isExtensible(made)", "Object.isExtensible(made)", '"made"'],
      ["!Object.isExtensible(revoke)", "Object.isExtensible(revoke)", '"revoke"'],
      ["!Object.isFrozen(thrower)", "Object.isFrozen(thrower)", '"thrower"'],
      ["!Object.isFrozen(missing)", "Object.isFrozen(missing)", '"missing"'],
    ];

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it.each(wrong)("rejects replacing %s with %s", async (from, to, message) => {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    });
  });

  describe("reads an object through Reflect as in and Object's functions do", () => {
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
    const wrong = [
      ['"z"), false', '"z"), true'],
      ['keys[1], "2"', 'keys[1], "0"'],
      ['false, "inextensible"', 'true, "inextensible"'],
    ];

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it.each(wrong)("rejects replacing %s with %s", async (from, to) => {
      expect((await checkModel(source.replace(from, to))).failure).toBeDefined();
    });
  });

  describe("gives whether Reflect.defineProperty defined a key", () => {
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

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(false))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(true))).failure?.message).toContain("unexpected");
    });
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

  describe("describes each own property that Object.getOwnPropertyDescriptors reads", () => {
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
    const wrong = [
      ['"key,c", "keys"', '"c,key", "keys"'],
      ["result.c.writable, false", "result.c.writable, true"],
      ["result[enumSym].value, value", "result[enumSym].value, undefined"],
      ['"0,1,length", "string"', '"0,1", "string"'],
      ["inferred.attr.value, 3", "inferred.attr.value, 4"],
    ];

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it.each(wrong)("rejects replacing %s with %s", async (from, to) => {
      expect((await checkModel(source.replace(from, to))).failure).toBeDefined();
    });
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

  describe("holds a function that Object's functions read on the heap, where calls still run it", () => {
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
    const frozen = source.replace("isFrozen(funObj), true", "isFrozen(funObj), false");
    const call = source.replace("called.count, 1", "called.count, 2");
    const declared = source.replace(
      "isExtensible(declared), false",
      "isExtensible(declared), true",
    );

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(frozen)).failure?.message).toContain('"frozen"');
    });

    it("rejects wrong expectation 2", async () => {
      expect((await checkModel(call)).failure?.message).toContain('"call"');
    });

    it("rejects wrong expectation 3", async () => {
      expect((await checkModel(declared)).failure?.message).toContain("declared");
    });
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

  describe("holds an error that a script reads as an object on the heap, with its message and slot", () => {
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
    const hidden = source.replace('enumerable, false, "hidden"', 'enumerable, true, "hidden"');
    const instance = source.replace("RangeError, false", "RangeError, true");
    const tag = source.replace('"[object Error]", "tag"', '"[object Object]", "tag"');
    const own = source.replace(
      'hasOwnProperty("message"), false',
      'hasOwnProperty("message"), true',
    );

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(hidden)).failure?.message).toContain('"hidden"');
    });

    it("rejects wrong expectation 2", async () => {
      expect((await checkModel(instance)).failure?.message).toContain("not RangeError");
    });

    it("rejects wrong expectation 3", async () => {
      expect((await checkModel(tag)).failure?.message).toContain('"tag"');
    });

    it("rejects wrong expectation 4", async () => {
      expect((await checkModel(own)).failure?.message).toContain('"bare"');
    });
  });

  describe("holds an error that only Object's functions read as an object with its prototype", () => {
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
    const frozen = source.replace("isFrozen(frozen), true", "isFrozen(frozen), false");
    const prototype = source.replace("SyntaxError.prototype, ", "Error.prototype, ");
    const sealed = source.replace("isSealed(defined), false", "isSealed(defined), true");

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(frozen)).failure?.message).toContain('"frozen"');
    });

    it("rejects wrong expectation 2", async () => {
      expect((await checkModel(prototype)).failure?.message).toContain("prototype");
    });

    it("rejects wrong expectation 3", async () => {
      expect((await checkModel(sealed)).failure?.message).toContain("not sealed");
    });
  });

  describe("reads new.target as the newTarget of a construction and undefined in a call", () => {
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
    const call = source.replace('state.target, undefined, "call"', 'state.target, f, "call"');
    const target = source.replace(
      'state.target, custom, "newTarget"',
      'state.target, f, "newTarget"',
    );
    const derived = source.replace('state.target, Child, "super"', 'state.target, Base, "super"');

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(call)).failure?.message).toContain('"call"');
    });

    it("rejects wrong expectation 2", async () => {
      expect((await checkModel(target)).failure?.message).toContain('"newTarget"');
    });

    it("rejects wrong expectation 3", async () => {
      expect((await checkModel(derived)).failure?.message).toContain('"super"');
    });
  });

  describe("constructs through Reflect.construct as new does, with newTarget's prototype", () => {
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
    const prototype = source.replace("(array) !== Array.prototype", "(array) !== Object.prototype");
    const inner = source.replace("if (!seen.isArray)", "if (seen.isArray)");
    const passed = source.replace("point.x !== 3", "point.x !== 1");

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(prototype)).failure?.message).toContain("newTarget");
    });

    it("rejects wrong expectation 2", async () => {
      expect((await checkModel(inner)).failure?.message).toContain("inner");
    });

    it("rejects wrong expectation 3", async () => {
      expect((await checkModel(passed)).failure?.message).toContain('"x"');
    });
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

  describe("converts a value to an object where Object is called", () => {
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

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    const wrong = [
      ['check(typeof count, "object"', 'check(typeof count, "number"'],
      ["check(count.valueOf(), 5,", "check(count.valueOf(), 6,"],
      ["check(Object(5) === count, false", "check(Object(5) === count, true"],
    ];

    it.each(wrong)("rejects replacing %s with %s", async (from, to) => {
      expect((await checkModel(source.replace(from, to))).failure).toBeDefined();
    });
  });

  describe("makes a Symbol object where a script calls Object on a symbol", () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: symbol): Symbol;
        }
      }
      const box = { seen: 0 };
      const symbol = Symbol("test");
      const wrapped = Object(symbol);
      const empty = Object(Symbol());
      if (typeof wrapped !== "object" || wrapped === symbol) throw new Error("object");
      if (wrapped.description !== "test" || empty.description !== undefined) throw new Error("description");
      if (Object.prototype.toString.call(wrapped) !== "[object Symbol]") throw new Error("tag");
      if (Object.getPrototypeOf(wrapped) !== Symbol.prototype) throw new Error("prototype");
      if (JSON.stringify(wrapped) !== "{}") throw new Error("json");
      box.seen = 1;
    `;
    const wrong = [
      ['"test" ||', '"other" ||', '"description"'],
      ['"[object Symbol]"', '"[object Object]"', '"tag"'],
      ['!== "{}"', '=== "{}"', '"json"'],
      ["wrapped === symbol", "wrapped !== symbol", '"object"'],
    ];

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it.each(wrong)("rejects replacing %s with %s", async (from, to, message) => {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    });
  });

  it("reads the symbol of a Symbol object through Symbol.prototype.valueOf.call", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: symbol): Symbol;
        }
      }
      const holder = { seen: 0 };
      const valueOf = Symbol.prototype.valueOf;
      const symbol = Symbol("s");
      const wrapped = Object(symbol);
      if (valueOf.call(wrapped) !== symbol) throw new Error("call");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(
      "valueOf.call(wrapped) !== symbol",
      "valueOf.call(wrapped) === symbol",
    );
    expect((await checkModel(wrong)).failure?.message).toContain('"call"');
  });

  it("reads the symbol of a Symbol object through its valueOf", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: symbol): Symbol;
        }
      }
      const holder = { seen: 0 };
      const symbol = Symbol("s");
      const wrapped = Object(symbol);
      if (wrapped.valueOf() !== symbol) throw new Error("method");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("wrapped.valueOf() !== symbol", "wrapped.valueOf() === symbol");
    expect((await checkModel(wrong)).failure?.message).toContain('"method"');
  });

  it("stops on Symbol.prototype.valueOf where a script replaced it", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      const symbol = Symbol("s");
      Symbol.prototype.valueOf = function () { return Symbol("other"); };
      if (Symbol.prototype.valueOf.call(symbol) === symbol) throw new Error("replaced");
      holder.seen = 1;
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't call Symbol.prototype.valueOf where a script replaced it",
    );
  });

  it("reads the BigInt of a BigInt object through BigInt.prototype.valueOf.call", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: bigint): BigInt;
        }
      }
      const holder = { seen: 0 };
      const valueOf = BigInt.prototype.valueOf;
      const wrapped = Object(3n);
      if (valueOf.call(wrapped) !== 3n || valueOf.call(2n) !== 2n) throw new Error("call");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("valueOf.call(wrapped) !== 3n", "valueOf.call(wrapped) !== 2n");
    expect((await checkModel(wrong)).failure?.message).toContain('"call"');
  });

  it("reads the BigInt of a BigInt object through its valueOf", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: bigint): BigInt;
        }
      }
      const holder = { seen: 0 };
      const wrapped = Object(3n);
      if (wrapped.valueOf() !== 3n) throw new Error("method");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("wrapped.valueOf() !== 3n", "wrapped.valueOf() === 3n");
    expect((await checkModel(wrong)).failure?.message).toContain('"method"');
  });

  it("makes a BigInt object that is an object and a BigInt instance", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: bigint): BigInt;
        }
      }
      const holder = { seen: 0 };
      const wrapped = Object(3n);
      if (!(wrapped instanceof BigInt) || typeof wrapped !== "object") throw new Error("instance");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('typeof wrapped !== "object"', 'typeof wrapped !== "bigint"');
    expect((await checkModel(wrong)).failure?.message).toContain('"instance"');
  });

  it("tags a BigInt object as a BigInt in Object.prototype.toString", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: bigint): BigInt;
        }
      }
      const holder = { seen: 0 };
      const wrapped = Object(3n);
      if (Object.prototype.toString.call(wrapped) !== "[object BigInt]") throw new Error("tag");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"[object BigInt]"', '"[object Object]"');
    expect((await checkModel(wrong)).failure?.message).toContain('"tag"');
  });

  it("compares a BigInt object loosely by its BigInt", async () => {
    const source = `
      declare global {
        interface ObjectConstructor {
          // oxlint-disable-next-line typescript/no-wrapper-object-types
          (value: bigint): BigInt;
        }
      }
      const holder = { seen: 0 };
      const wrapped: unknown = Object(3n);
      if (wrapped != 3n) throw new Error("loose");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("!= 3n", "!= 4n");
    expect((await checkModel(wrong)).failure?.message).toContain('"loose"');
  });

  it("stops on a call of a prototype method that a reassigned variable held", () => {
    expect(() =>
      compile(`
        const holder = { seen: 0 };
        let valueOf = Symbol.prototype.valueOf;
        const symbol = Symbol("s");
        valueOf = function (this: unknown) { return symbol; };
        if (valueOf.call(Symbol("other")) !== symbol) throw new Error("reassigned");
        holder.seen = 1;
      `),
    ).toThrow("Unsupported call: valueOf.call");
  });

  it("tags a primitive by its type in Object.prototype.toString", async () => {
    const source = `
      const holder = { seen: "" };
      const read = (value: unknown) => Object.prototype.toString.call(value);
      if (read(1) !== "[object Number]" || read("a") !== "[object String]") throw new Error("plain");
      holder.seen = read(true);
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('read(1) !== "[object Number]"', 'read(1) !== "[object String]"');
    expect((await checkModel(wrong)).failure?.message).toContain('"plain"');
  });

  it("reads the Symbol.toStringTag of a BigInt's and a symbol's prototype", async () => {
    const source = `
      const holder = { seen: "" };
      const read = (value: unknown) => Object.prototype.toString.call(value);
      const made = Symbol();
      if (read(1n) !== "[object BigInt]" || read(made) !== "[object Symbol]") throw new Error("tagged");
      holder.seen = read(1n);
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(
      'read(made) !== "[object Symbol]"',
      'read(made) !== "[object Object]"',
    );
    expect((await checkModel(wrong)).failure?.message).toContain('"tagged"');
  });

  it("reads a Symbol.toStringTag that a script defines on a BigInt's prototype", async () => {
    const source = `
      const holder = { seen: "" };
      const read = (value: unknown) => Object.prototype.toString.call(value);
      Object.defineProperty(BigInt.prototype, Symbol.toStringTag, { value: 86 });
      if (read(1n) !== "[object Object]") throw new Error("bigint");
      holder.seen = read(1n);
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"[object Object]"', '"[object BigInt]"');
    expect((await checkModel(wrong)).failure?.message).toContain('"bigint"');
  });

  it("reads a Symbol.toStringTag that a script defines on a string's prototype", async () => {
    const source = `
      const holder = { seen: "" };
      const read = (value: unknown) => Object.prototype.toString.call(value);
      Object.defineProperty(String.prototype, Symbol.toStringTag, { value: "Y" });
      if (read("a") !== "[object Y]") throw new Error("string");
      holder.seen = read("a");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"[object Y]"', '"[object String]"');
    expect((await checkModel(wrong)).failure?.message).toContain('"string"');
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

  describe("stops iterating an array where a script replaced the array iterator", () => {
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

    it.each(sources)("stops where the script replaces the iterator, case %#", async (source) => {
      expect((await checkModel(source)).failure?.message).toContain("tla-ts can't iterate");
    });

    it("agrees with Node", async () => {
      expect((await checkModel(kept)).failure).toBeUndefined();
    });

    it("rejects the expectation sum !== 6", async () => {
      const wrong = await checkModel(kept.replace("sum !== 6", "sum !== 7"));
      expect(wrong.failure?.message).toContain("wrong");
    });
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

  it("prints a long script's statements at an indentation that grows little", async () => {
    const statements = Array.from(
      { length: 100 },
      (_, index) => `if (box.size === ${index}) box.size++;`,
    );
    const compiled = compile(
      `const box = { size: 0 };\n${statements.join("\n")}\nif (box.size !== 100) throw new Error("size");`,
    );
    const text = printModule(compiled.source);
    expect(
      Math.max(...text.split("\n").map((line) => line.length - line.trimStart().length)),
    ).toBeLessThan(1000);
    expect((await check({ ...compiled, source: text })).failure).toBeUndefined();
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

  describe("compares the arrays of a script by identity", () => {
    const getSource = (expected: boolean) => `
      const source = [1, 2];
      const copy = source.slice();
      const same = source;
      if ((copy === source) !== ${expected} || same !== source) throw new Error("identity");
    `;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(false))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(true))).failure?.message).toContain('"identity"');
    });
  });

  describe("finds the arrays that a set or a map takes as keys by identity", () => {
    const getSource = (expected: boolean) => `
      const keys = new Map<number[], number>();
      const members = new Set<number[]>();
      const first = [1, 2];
      const second = [1, 2];
      keys.set(first, 1);
      members.add(first);
      members.add(second);
      if (keys.has(second) !== ${expected} || keys.get(first) !== 1 || members.size !== 2) {
        throw new Error("keys");
      }
    `;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(false))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(true))).failure?.message).toContain('"keys"');
    });
  });

  describe("finds an array by identity among the elements of an array", () => {
    const getSource = (expected: number) => `
      const first = [1];
      const list: number[][] = [first, [1]];
      const other = [1];
      if (list.indexOf(other) !== ${expected} || list.indexOf(first) !== 0) {
        throw new Error("index");
      }
    `;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(-1))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(1))).failure?.message).toContain('"index"');
    });
  });

  describe("finds an array that a function shares by identity, or a weak map holds", () => {
    const getSource = (expected: boolean) => `
      const members = new WeakMap<number[], number>();
      const shared: number[][] = [];
      const getShared = (size: number): number[] => {
        const cached = shared[size - 1];
        if (cached) return cached;
        const made = Array.from({ length: size }, (_, index) => index + 1);
        shared.push(made);
        return made;
      };
      const isShared = (domain: number[]) =>
        domain === shared[domain.length - 1] || members.has(domain);
      const copy = [1];
      const fresh = [1, 2];
      members.set(copy, 3);
      const first = getShared(1);
      const second = getShared(2);
      if (!isShared(first) || !isShared(second) || !isShared(copy)) throw new Error("shared");
      if (isShared(fresh) !== ${expected}) throw new Error("fresh");
    `;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(false))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(true))).failure?.message).toContain('"fresh"');
    });
  });

  // Node finds each of these arrays by identity, where a sequence compares by value.
  describe("stops where a script finds an array by its identity", () => {
    [
      {
        name: "a member of a set that a literal makes",
        source:
          'const members = new Set([[1], [1]]);\nif (members.size !== 2) throw new Error("size");',
      },
      {
        name: "the members of a set that an array gives",
        source:
          'const list = [[1], [1]];\nconst members = new Set(list);\nif (members.size !== 2) throw new Error("size");',
      },
      {
        name: "the keys of a map that an array gives",
        source:
          'const list: [number[], number][] = [[[1], 1], [[1], 2]];\nconst keys = new Map(list);\nif (keys.size !== 2) throw new Error("size");',
      },
      {
        name: "the members of a set that a map's values give",
        source:
          'const shared = [1];\nconst holder = new Map([["a", shared], ["b", shared]]);\nconst members = new Set(holder.values());\nif (members.size !== 1) throw new Error("size");',
      },
      {
        name: "an element that indexOf looks for",
        source: 'const list = [[1], [2]];\nif (list.indexOf([1]) !== -1) throw new Error("index");',
      },
      {
        name: "an element that lastIndexOf looks for",
        source:
          'const list = [[1], [2]];\nif (list.lastIndexOf([1]) !== -1) throw new Error("index");',
      },
      {
        name: "an element that includes looks for",
        source: 'const list = [[1], [2]];\nif (list.includes([1])) throw new Error("includes");',
      },
      {
        name: "a case of a switch",
        source:
          'const first = [1];\nconst second = [1];\nswitch (first) {\n  case second:\n    throw new Error("case");\n}',
      },
    ].forEach((entry) =>
      it(entry.name, () => {
        expect(() => compile(entry.source)).toThrow(
          "tla-ts can't tell whether two equal arrays are the same array",
        );
      }),
    );
  });

  // Entries and keys come from unique keys, so a set holds each of them, as Node does.
  describe("holds the entries of a map, a set, or an object in a set", () => {
    const getSource = (expected: number) => `
      const counts = new Map([["a", 1], ["b", 1]]);
      const pairs = new Set(counts.entries());
      const named = new Set(Object.entries({ a: 1, b: 1 }));
      const doubled = new Set(new Set([1, 2]).entries());
      if (pairs.size + named.size + doubled.size !== ${expected}) {
        throw new Error("size");
      }
    `;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(6))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(3))).failure?.message).toContain('"size"');
    });
  });

  it("stops where two equal arrays of a script may be two arrays", async () => {
    await expect(
      checkModel(`
        const source = [1, 2];
        const holder = new Map([["source", source]]);
        if (holder.get("source") === source) throw new Error("same");
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

  it("calls the functions that an arrow returns as its body, once for each constant", async () => {
    const getSource = (expected: string) => `
      interface Repeat {
        type: string;
        body: string[];
      }
      const repeat =
        (type: string) =>
        (...parts: string[]): Repeat => ({ type, body: parts });
      const zeroOrMore = repeat("zeroOrMore");
      const optional = repeat("optional");
      const units = [zeroOrMore("a", "b"), optional("c")];
      const result = units.map((unit) => \`\${unit.type}:\${unit.body.join("+")}\`).join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("zeroOrMore:a+b,optional:c"))).failure).toBeUndefined();
    expect((await checkModel(getSource("optional:a+b,optional:c"))).failure?.message).toContain(
      "zeroOrMore:a+b,optional:c",
    );
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

  it("runs the call whose result's property has the method that a statement calls first", async () => {
    const getSource = (expected: string) => `
      const boxes = new Map<number, { items: number[] }>();
      const keys = new Map<number, string>();
      const toBox = (size: number) => {
        const cached = boxes.get(size);
        if (cached) return cached;
        const box = { items: Array.from({ length: size }, (_, index) => index * 2) };
        boxes.set(size, box);
        return box;
      };
      const getKey = (value: number) => {
        const cached = keys.get(value);
        if (cached !== undefined) return cached;
        const key = \`#\${value}\`;
        keys.set(value, key);
        return key;
      };
      const describe = (size: number) => \`{\${toBox(size).items.map(getKey).join(",")}}\`;
      const result = [describe(3), describe(2), boxes.size, keys.size].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("{#0,#2,#4};{#0,#2};2;3"))).failure).toBeUndefined();
    expect((await checkModel(getSource("{#0,#2,#4};{#0,#2};2;2"))).failure?.message).toContain(
      "{#0,#2,#4};{#0,#2};2;3",
    );
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

  it("runs the function that a parameter's default writes", async () => {
    const getSource = (doubled: string) => `
      interface Box { seen: number }
      const box: Box = { seen: 0 };
      const apply = (value: number, change = (inner: number) => inner * 2): number => {
        box.seen += 1;
        return change(value);
      };
      const doubled = apply(3);
      const tripled = apply(3, (inner) => inner * 3);
      if (doubled !== ${doubled} || tripled !== 9 || box.seen !== 2) throw new Error("apply");
    `;
    expect((await checkModel(getSource("6"))).failure).toBeUndefined();
    expect((await checkModel(getSource("3"))).failure?.message).toContain('"apply"');
  });

  it("runs a function that calls itself and passes a function", async () => {
    const getSource = (passed: string, summed: string) => `
      interface Branch { kind: "branch"; items: Value[]; seen: number }
      type Value = number | Branch;
      const double = (leaf: number) => leaf * 2;
      const getItems = (value: Branch) => value.items;
      const sum = (
        value: Value,
        weigh: (leaf: number) => number = (leaf) => leaf,
        getChildren = (inner: Branch) => getItems(inner),
      ): number => {
        if (typeof value === "number") return weigh(value);
        value.seen += 1;
        let result = 0;
        for (const item of getChildren(value)) result = result + sum(item, ${passed});
        return result;
      };
      const inner: Branch = { kind: "branch", items: [2, 3], seen: 0 };
      const tree: Branch = { kind: "branch", items: [1, inner], seen: 0 };
      const summed = sum(tree);
      if (summed !== ${summed} || inner.seen !== 1) throw new Error("sum");
    `;
    expect((await checkModel(getSource("weigh", "6"))).failure).toBeUndefined();
    expect((await checkModel(getSource("double", "12"))).failure).toBeUndefined();
    expect((await checkModel(getSource("double", "6"))).failure?.message).toContain('"sum"');
  });

  // Each set of functions that a function's calls of itself pass runs its own operator.
  const getMixedSource = (summed: number) => `
    interface Branch { kind: "branch"; items: Value[]; seen: number }
    type Value = number | Branch;
    const double = (leaf: number) => leaf * 2;
    const sum = (value: Value, weigh: (leaf: number) => number = (leaf) => leaf): number => {
      if (typeof value === "number") return weigh(value);
      value.seen += 1;
      let result = 0;
      for (const item of value.items) result = result + sum(item, double) + sum(item, weigh);
      return result;
    };
    const inner: Branch = { kind: "branch", items: [2, 3], seen: 0 };
    const summed = sum({ kind: "branch", items: [1, inner], seen: 0 });
    if (summed !== ${summed} || inner.seen !== 2) throw new Error(\`\${summed}\`);
  `;

  it("runs a function that calls itself and passes different functions", async () => {
    expect((await checkModel(getMixedSource(38))).failure).toBeUndefined();
  });

  it("fails where a function that calls itself with different functions sums another value", async () => {
    expect((await checkModel(getMixedSource(37))).failure?.message).toContain('"38"');
  });

  it("runs a function that passes itself to an array method", async () => {
    const getSource = (limit: string) => `
      interface Branch { kind: "branch"; items: Value[] }
      type Value = number | Branch;
      const isSmall = (value: Value): boolean => {
        if (typeof value === "number") return value < ${limit};
        switch (value.kind) {
          case "branch":
            return value.items.every(isSmall);
        }
      };
      const tree: Branch = { kind: "branch", items: [1, { kind: "branch", items: [2, 3] }] };
      if (!isSmall(tree)) throw new Error("small");
    `;
    expect((await checkModel(getSource("5"))).failure).toBeUndefined();
    expect((await checkModel(getSource("3"))).failure?.message).toContain('"small"');
    expect(() =>
      compile(`
        interface Branch { value: number; children: Branch[] }
        const isSmall = ({ value, children }: Branch): boolean =>
          value < 5 && children.every(isSmall);
        const tree: Branch = { value: 1, children: [{ value: 2, children: [] }] };
        if (!isSmall(tree)) throw new Error("small");
      `),
    ).toThrow("tla-ts can't pass this function to an array method from inside itself");
  });

  it("runs the calls in a template after a conditional that runs nothing", async () => {
    const getSource = (expected: string) => `
      interface Box { seen: number }
      const box: Box = { seen: 0 };
      const show = (value: number) => {
        box.seen += 1;
        return \`<\${value}>\`;
      };
      const describe = (left: number, right: number, isEqual: boolean) =>
        \`\${isEqual ? "equal" : "compare"} \${show(left)} \${left > 1 && right > 1 ? "big" : "small"} \${show(right)}\`;
      const described = describe(1, 2, false);
      if (described !== "${expected}" || box.seen !== 2) throw new Error("described");
    `;
    expect((await checkModel(getSource("compare <1> small <2>"))).failure).toBeUndefined();
    expect((await checkModel(getSource("compare <1> big <2>"))).failure?.message).toContain(
      '"described"',
    );
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

  it("converts a value that may not be a string where a template or + joins it", async () => {
    const source = (expected: string) => `
      const getText = (): string | undefined => undefined;
      const getName = (): string | null => null;
      const getCount = (): number | undefined => undefined;
      const getFlag = (): boolean | string => false;
      const text = getText();
      const name = getName();
      const words: string[] = ["a"];
      const flags: boolean[] = [true];
      let joined = "j";
      joined += text;
      const all =
        \`\${text}-\${name}-\${getCount()}-\${getFlag()}-\${words[3]}-\${flags[2]}|\` +
        text + (name + "") + String(text) + String(words[4]) + words[0] + joined;
      if (all !== ${JSON.stringify(expected)}) throw new Error("strings");
    `;
    const expected =
      "undefined-null-undefined-false-undefined-undefined|undefinednullundefinedundefinedajundefined";
    expect((await checkModel(source(expected))).failure).toBeUndefined();
    expect((await checkModel(source(expected.replace("-false", "-0")))).failure?.message).toContain(
      "strings",
    );
  });

  it("takes a read past an array's end as NaN where an operator converts it to a number", async () => {
    const source = (zero: number) => `
      const items: number[] = [1, 2];
      const record: { [key: string]: number } = { a: 1 };
      const values = [
        items[3] + 1,
        -items[4],
        items[5] * 2,
        items[6] | 0,
        Math.max(items[7], 1),
        record.b + 1,
        record["c"] - 1,
      ];
      const isLess = items[3] < 5;
      const total = items[0] + items[1];
      const isNaNAt = (position: number) => Number.isNaN(values[position]);
      if (
        !isNaNAt(0) || !isNaNAt(1) || !isNaNAt(2) || values[3] !== ${zero} || !isNaNAt(4) ||
        !isNaNAt(5) || !isNaNAt(6) || isLess || total !== 3 || items[9] !== undefined ||
        !Number.isNaN(NaN)
      ) {
        throw new Error("numbers");
      }
    `;
    expect((await checkModel(source(0))).failure).toBeUndefined();
    expect((await checkModel(source(1))).failure?.message).toContain("numbers");
  });

  it("stops where a script without special numbers computes with a read past an array's end", async () => {
    await expect(
      checkModel(`
        const items: number[] = [1];
        const sum = items[3] + 1;
      `),
    ).rejects.toThrow(
      "tla-ts can't compute with the undefined that a read past an array's end gives",
    );
  });

  it("takes a name that holds a read past an array's end as NaN where an operator converts it", async () => {
    const source = (expected: number) => `
      const items: number[] = [1, 2];
      const missing = items[3];
      const box: { [key: string]: number } = { a: 1 };
      const kept = box.b;
      const total = items[0] + items[1];
      const first = items[0];
      const values = [missing + 1, -missing, missing * 2, Math.max(missing, 1), first + 1, kept - 1];
      const isNaNAt = (position: number) => Number.isNaN(values[position]);
      if (
        !isNaNAt(0) || !isNaNAt(1) || !isNaNAt(2) || !isNaNAt(3) || values[4] !== ${expected} ||
        total !== 3 || !isNaNAt(5) || !Number.isNaN(NaN)
      ) {
        throw new Error("names");
      }
    `;
    expect((await checkModel(source(2))).failure).toBeUndefined();
    expect((await checkModel(source(3))).failure?.message).toContain("names");
  });

  it("stops where a script without special numbers computes with a name that holds a read past an array's end", async () => {
    await expect(
      checkModel(`
        const items: number[] = [1];
        const missing = items[3];
        const sum = missing + 1;
      `),
    ).rejects.toThrow(
      "tla-ts can't compute with the undefined that a read past an array's end gives",
    );
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
      let isThrown = false;
      try {
        items.push(3);
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown || items.length !== 2) throw new Error("frozen");
    `);
    expect(frozen.failure).toBeUndefined();
  });

  it("changes an array with holes or fixed elements in place index by index", async () => {
    const source = (expected: string) => `
      const items: (string | undefined)[] = ["a", , "c", ,];
      Array.prototype[1] = "p";
      const first = items.shift();
      const length = items.unshift("z");
      const last = items.pop();
      const fixed: string[] = ["x", "y"];
      Object.defineProperty(fixed, "0", { value: "x", writable: false, configurable: true });
      let caught = "";
      try {
        fixed.shift();
      } catch (error) {
        if (error instanceof TypeError) caught = fixed.join("") + fixed.length;
      }
      const text = items.join("-") + "/" + Object.keys(items).join("");
      if (first !== "a" || length !== 4 || last !== undefined || text !== ${JSON.stringify(expected)} || caught !== "xy2") {
        throw new Error("steps");
      }
    `;
    expect((await checkModel(source("z-p-c/012"))).failure).toBeUndefined();
    expect((await checkModel(source("z-p-c/01"))).failure?.message).toContain("steps");
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

  const getKnownSource = (expected: number) => `
    const known = new WeakMap<number[], number>();
    const isKnown = (items: number[]) => items.length > 0 && known.has(items);
    const rank = (items: number[], isKept: boolean): number => {
      const elements = items;
      return isKnown(elements) && !isKept ? 1 : 2;
    };
    const items = [1, 2];
    known.set(items, 1);
    if (rank(items, false) !== 1 || rank(items, true) !== ${expected}) throw new Error("rank");
  `;

  it("returns a conditional whose condition calls a function that reads objects", async () => {
    expect((await checkModel(getKnownSource(2))).failure).toBeUndefined();
  });

  it("fails where a conditional whose condition reads objects gives another value", async () => {
    expect((await checkModel(getKnownSource(3))).failure?.message).toContain('"rank"');
  });

  describe("runs a function that changes state and calls itself", () => {
    const getDefaulted = (calls: string) => `
      let calls = 0;
      const count = (n: number, step = 1): number => {
        calls += step;
        return n === 0 ? 0 : count(n - 1);
      };
      count(2);
      if (calls !== ${calls}) throw new Error("calls");
    `;

    it("agrees with Node", async () => {
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
    });

    it("agrees with Node (2)", async () => {
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
    });

    it("rejects wrong expectation 1", async () => {
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
    });

    it("agrees with Node on 3", async () => {
      expect((await checkModel(getDefaulted("3"))).failure).toBeUndefined();
    });

    it("rejects the expectation 2", async () => {
      expect((await checkModel(getDefaulted("2"))).failure?.message).toContain('"calls"');
    });
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

  it("runs the getter that an assignment's object rest copies", async () => {
    const getSource = (expected: number) => `
      let x: { v?: number; w?: number } = {};
      let w = 0;
      let count = 0;
      for ({ w, ...x } of [{ w: 5, get v() { count++; return 2; } }]) {
        if (count !== 1 || w !== 5 || x.v !== ${expected} || x.w !== undefined) {
          throw new Error("rest");
        }
      }
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(3))).failure?.message).toContain("rest");
  });

  it("throws what the getter that an assignment's object rest copies throws", async () => {
    const getSource = (expected: string) => `
      let x: { v?: number } = {};
      let caught = "";
      try {
        ({ ...x } = { get v(): number { throw new RangeError("v"); } });
      } catch (error) {
        caught = (error as Error).message;
      }
      if (caught !== "${expected}" || x.v !== undefined) throw new Error("rest");
    `;
    expect((await checkModel(getSource("v"))).failure).toBeUndefined();
    expect((await checkModel(getSource("w"))).failure?.message).toContain("rest");
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

  it("copies a primitive's own properties into a rest that a variable without a type takes", async () => {
    const getSource = (text: string) => `
      var rest;
      var result;
      result = { ...rest } = 51;
      const empty = Object.keys(rest).length;
      result = { ...rest } = "foo";
      const text = rest["0"] + rest["1"] + rest["2"] + Object.keys(rest).join("");
      const vals = { x: 1, y: 2 };
      result = { ...rest } = vals;
      if (empty !== 0 || text !== "${text}" || rest === vals || rest.y !== 2 || result !== vals) {
        throw new Error("rest");
      }
    `;
    expect((await checkModel(getSource("foo012"))).failure).toBeUndefined();
    expect((await checkModel(getSource("foo"))).failure?.message).toContain("rest");
  });

  it("keeps the objects that a for-of's assignment pattern writes after the loop", async () => {
    const getSource = (count: number) => `
      let held: { n: number } | undefined;
      let rest: object | undefined;
      for ({ held, ...rest } of [{ held: { n: 1 } }, { held: { n: 2 }, a: 1, b: 2 }]) {}
      if (held?.n !== 2 || Object.keys(rest!).length !== ${count}) throw new Error("after");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(0))).failure?.message).toContain("after");
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

  it("keeps a set's identity through an array, a pop, and its own name", async () => {
    const result = await checkModel(`
      const scopes: Set<string>[] = [];
      const declare = (name: string) => scopes[scopes.length - 1]?.add(name);
      const isDeclared = (name: string) => scopes.some((scope) => scope.has(name));
      const step = () => {
        const scope = new Set<string>();
        scopes.push(scope);
        declare("a");
        scopes.push(new Set());
        declare("b");
        const inner = isDeclared("a") && isDeclared("b");
        scopes.pop();
        scopes.pop();
        declare("c");
        return inner && scope.has("a") && !scope.has("b") && scope.size === 1;
      };
      declare("lost");
      const twin = new Set(["a"]);
      scopes.push(twin);
      const copy = new Set(twin);
      scopes[0].add("b");
      if (!step() || scopes.length !== 1 || copy.size !== 1 || twin.size !== 3) {
        throw new Error("scopes");
      }
      const other = new Set(["a", "b"]);
      if (!scopes.includes(twin) || scopes.indexOf(other) !== -1) {
        throw new Error("identity");
      }
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        const scopes: Set<string>[] = [new Set()];
        const first = scopes[0];
        scopes[0].add("a");
        const json = JSON.stringify(scopes);
      `),
    ).toThrow("scopes would share an object that changes in place");
    expect(() =>
      checkModel(`
        const scopes: Set<string>[] = [new Set()];
        const grown = scopes[0].add("a");
      `),
    ).toThrow("Unsupported Set method: add");
  });

  it("keeps a map's identity through an array", async () => {
    const result = await checkModel(`
      const tables: Map<string, number>[] = [new Map()];
      const put = (key: string, value: number) => {
        tables[tables.length - 1].set(key, value);
      };
      const table = tables[0];
      put("a", 1);
      tables.push(new Map([["z", 26]]));
      put("b", 2);
      const top = tables.at(-1);
      tables.pop();
      const isRemoved = tables[0].delete("a");
      const isMissing = tables[0].delete("q");
      if (!isRemoved || isMissing || table.size !== 0 || top?.get("b") !== 2 || top.size !== 2) {
        throw new Error("maps");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("visits a set in any order where the loop only adds each element to a set", async () => {
    const result = await checkModel(`
      const seen = new Set<string>();
      const box = { names: new Set<string>() };
      const record = (name: string) => box.names.add(name);
      const source = new Set(["b", "a", "c"]);
      source.forEach(record);
      for (const name of source) seen.add(name);
      if (box.names.size !== 3 || seen.size !== 3 || !seen.has("c")) throw new Error("each");
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      checkModel(`
        const out: string[] = [];
        const source = new Set(["b", "a"]);
        source.forEach((name) => {
          out.push(name);
        });
      `),
    ).toThrow("Unsupported statement");
    expect(() =>
      checkModel(`
        const sets = [new Set<string>(), new Set<string>()];
        const source = new Set(["b", "a"]);
        const counted = new Set<string>();
        for (const name of source) sets[counted.size].add(name);
      `),
    ).toThrow("Only arrays have an order to iterate in");
    expect(() =>
      checkModel(`
        const source = new Set(["b", "a"]);
        const kept = new Set<string>();
        source.forEach((name, again) => kept.add(again));
      `),
    ).toThrow("Unsupported statement");
  });

  it("keeps the identity of a set that a field holds and changes in place", async () => {
    const shared = await checkModel(`
      const items = new Set<number>();
      const box = { kept: items, seen: new Set<number>() };
      const wrap = { inner: box.kept };
      const copy = box.seen;
      wrap.inner.add(3);
      box.seen.add(2);
      if (items.size !== 1 || !box.kept.has(3) || copy.size !== 1) throw new Error("kept");
    `);
    expect(shared.failure).toBeUndefined();
    expect(() =>
      compile(
        "const items = new Set<number>();\nconst box = { kept: items };\nconst text = JSON.stringify(box);\nbox.kept.add(3);\nlet size = items.size;",
      ),
    ).toThrow("items would share an object that changes in place");
    const result = await checkModel(`
      interface Unit { kinds: Set<number> }
      interface Analysis { first: Set<number>; isNullable: boolean }
      const analyses = new Map<Unit, Analysis>();
      const tokens = (kinds: number[]): Unit => ({ kinds: new Set(kinds) });
      const has = (kinds: Set<number>, kind: number) => kinds.has(kind);
      const analyze = (units: Unit[]): Analysis => {
        const analysis = { first: new Set<number>(), isNullable: true };
        if (units.length === 1) {
          const cached = analyses.get(units[0]);
          if (cached) return cached;
          analysis.first = units[0].kinds;
          analyses.set(units[0], analysis);
          return analysis;
        }
        for (const unit of units) {
          const inner = analyze([unit]);
          for (const kind of inner.first) analysis.first.add(kind);
        }
        return analysis;
      };
      const a = tokens([1, 2]);
      const b = tokens([2, 3]);
      const both = analyze([a, b]);
      const again = analyze([a]);
      again.first.add(4);
      if (both.first.size !== 3 || a.kinds.size !== 3 || !has(b.kinds, 3) || has(b.kinds, 4)) {
        throw new Error("first");
      }
    `);
    expect(result.failure).toBeUndefined();
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

  // V8 sorts fewer than 64 elements by the run that starts them, which it reverses where it
  // descends, and then inserts each element after the run by binary search.
  // An assignment that runs before the rest of its statement, or a for loop's initializer or
  // incrementor, makes the objects that it assigns.
  describe("makes the objects of an assignment that runs apart from its statement", () => {
    const getSource = (expected: number) => `
      let made: { n: number } | undefined;
      class Box {
        constructor() {
          return (made = { n: 1 });
        }
      }
      const make = () => {
        return (made = { n: 2 });
      };
      const box = new Box();
      const other = make();
      let count = 0;
      for (made = { n: 3 }; count < 2; made = { n: made.n + 1 }, count++) count += 0;
      if (box === other || other.n !== 2 || made.n !== ${expected}) throw new Error("made " + made.n);
    `;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(5))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(4))).failure?.message).toContain("made 5");
    });
  });

  describe("calls a sort comparator on the pairs that V8 compares, in its order", () => {
    const getSource = (expected: string) => `
      const log: string[] = [];
      const items = [5, 4, 3, 1, 2, 3];
      const result = items.sort((a, b) => {
        log.push(\`\${a}\${b}\`);
        return a - b;
      });
      if (log.join() !== "${expected}" || items.join() !== "1,2,3,3,4,5" || result.length !== 6) {
        throw new Error("log " + log.join());
      }
    `;

    it("agrees with Node", async () => {
      expect(
        (await checkModel(getSource("45,34,13,21,24,23,21,33,35,34"))).failure,
      ).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect(
        (await checkModel(getSource("45,34,13,21,24,23,21,33,34,35"))).failure?.message,
      ).toContain("log ");
    });
  });

  describe("throws from a sort comparator only where V8 compares the pair", () => {
    const getSource = (expected: number) => `
      let calls = 0;
      let isThrown = false;
      try {
        [1, 2, 3].toSorted((a, b) => {
          calls += 1;
          if (a === 3 && b === 1) throw new Error("compared 3 with 1");
          if (a === 3 && b === 2) throw new Error("compared 3 with 2");
          return a - b;
        });
      } catch {
        isThrown = true;
      }
      const sorted = [1, 2, 3].sort((a, b) => {
        if (a === 3 && b === 1) throw new Error("compared 3 with 1");
        return a - b;
      });
      if (!isThrown || calls !== ${expected} || sorted.join() !== "1,2,3") {
        throw new Error("calls " + calls);
      }
    `;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(2))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(3))).failure?.message).toContain("calls 2");
    });
  });

  describe("sorts by a comparator that orders inconsistently as V8 does", () => {
    const getSource = (expected: string) => `
      const sorted = [1, 4, 2, 5, 3].sort((a, b) => ((a * 7 + b) % 5) - 2);
      if (sorted.join() !== "${expected}") throw new Error("sorted " + sorted.join());
    `;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource("1,4,2,3,5"))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      await expect(checkModel(getSource("2,3,5,1,4"))).rejects.toThrow("sorted 1,4,2,3,5");
    });
  });

  describe("sorts fewer than 64 elements with a comparator that runs statements or may throw", () => {
    // V8 merges runs of 64 or more elements, which tla-ts doesn't follow.
    const getSource = (length: number, comparator: string, expected: number) => `
      let calls = 0;
      const items = [${Array.from({ length }, (_, index) => length - index).join(", ")}];
      items.sort(${comparator});
      if (items[0] !== 1 || calls !== ${expected}) throw new Error("calls " + calls);
    `;
    const counted = "(a, b) => { calls += 1; return a - b; }";

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(63, counted, 62))).failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      expect((await checkModel(getSource(63, counted, 63))).failure?.message).toContain("calls 62");
    });

    it("stops at 64 elements", async () => {
      expect((await checkModel(getSource(64, counted, 63))).failure?.message).toContain(
        "tla-ts can't sort 64 or more elements with a comparator that runs statements",
      );
      const throwing = '(a, b) => { if (a < 0) throw new Error("negative"); return a - b; }';
      expect((await checkModel(getSource(64, throwing, 0))).failure?.message).toContain(
        "tla-ts can't sort 64 or more elements with a comparator that may throw",
      );
    });
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

  it("flattens the arrays that flatMap's mapper returns", async () => {
    const source = `
      const holder = { count: 0 };
      function* letters() {
        yield "a";
        yield "b";
        yield "c";
      }
      let calls = 0;
      const flat = letters().flatMap((value, count) => {
        calls += 1;
        return value === "a" ? [count] : value === "b" ? [1, 2] : [];
      });
      if (Number(calls) !== 0) throw new Error("eager");
      const first = flat.next();
      if (first.value !== 0 || Number(calls) !== 1) throw new Error("first");
      let total = 0;
      for (const value of flat) total += value;
      if (total !== 3 || Number(calls) !== 3) throw new Error("rest");
      let isThrown = false;
      try {
        for (const unused of letters().flatMap(() => "string"));
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown) throw new Error("string");
      holder.count = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    for (const [from, to, message] of [
      ["[1, 2]", "[1]", "rest"],
      ['() => "string"', "() => [0]", "string"],
    ]) {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    }
  });

  it("joins the paths through an iterator helper's callback before its next step", async () => {
    const source = `
      const holder = { count: 0 };
      function* count() {
        for (let index = 0; index < 6; ++index) yield index;
      }
      const names = Array.from(
        count().map((value) => {
          holder.count += 1;
          if (value === 0) return "zero";
          if (value === 1) return "one";
          if (value === 2) return "two";
          return "many";
        }),
      );
      const pairs = Array.from(count().flatMap((value) => (value === 1 ? [value, 0] : [0, value])));
      if (names.join() !== "zero,one,two,many,many,many" || holder.count !== 6) {
        throw new Error("names");
      }
      if (pairs.join() !== "0,0,1,0,0,2,0,3,0,4,0,5") throw new Error("pairs");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    for (const [from, to, message] of [
      ['return "two"', 'return "three"', "names"],
      ["[value, 0]", "[0, value]", "pairs"],
    ]) {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    }
  });

  it("stops translating a helper whose callback's paths multiply its steps", () => {
    expect(() =>
      compile(`
        const holder = { count: 0 };
        function* count() {
          for (let index = 0; index < 8; ++index) yield index;
        }
        const flat = count().flatMap((value) => {
          if (value === 0) return [0];
          if (value === 1) return [1, 1];
          return [];
        });
        for (const value of flat) holder.count += value;
      `),
    ).toThrow("tla-ts can't follow this many paths through an iterator helper's callback");
  });

  it("iterates the helper that a call makes in a for-of", async () => {
    const source = `
      const holder = { count: 0 };
      function* count() {
        yield 1;
        yield 2;
        yield 3;
      }
      for (const value of count().map((value) => value * 2)) holder.count += value;
      if (holder.count !== 12) throw new Error("sum");
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = await checkModel(source.replace("value * 2", "value * 3"));
    expect(wrong.failure?.message).toContain("sum");
  });

  it("steps only the generator that an iterator helper wraps", async () => {
    const source = `
      const holder = { count: 0 };
      function* count() {
        for (let index = 0; index < 5; ++index) {
          yield index;
        }
      }
      const first = Array.from(count().map((value) => value));
      const second = Array.from(count().map((value) => value * 2));
      const third = Array.from(count().map(() => holder));
      if (first.join() !== "0,1,2,3,4" || second.join() !== "0,2,4,6,8" || third.length !== 5) {
        throw new Error("wrong");
      }
      holder.count = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = await checkModel(source.replace('"0,2,4,6,8"', '"0,2,4,6"'));
    expect(wrong.failure?.message).toContain("wrong");
  });

  it("makes an array with Array.from of a length that a shorthand property gives", async () => {
    const getSource = (expected: string) => `
      const getDomain = (length: number): number[] => Array.from({ length }, (_, index) => index + 1);
      const domain = getDomain(3);
      if (domain.join(",") !== "${expected}") throw new Error(domain.join(","));
    `;
    expect((await checkModel(getSource("1,2,3"))).failure).toBeUndefined();
    expect((await checkModel(getSource("0,1,2"))).failure?.message).toContain('"1,2,3"');
  });

  it("gathers a generator into an array with Array.from", async () => {
    const result = await checkModel(`
      function* g(): Generator<number> {
        yield 1;
        yield 2;
        yield 3;
      }
      const plain = Array.from(g());
      const mapped = Array.from(g(), (value, index) => value * 10 + index);
      const taken = Array.from(g().take(2));
      if (plain.join() !== "1,2,3" || mapped.join() !== "10,21,32" || taken.join() !== "1,2") {
        throw new Error("gathered");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("defines an accessor on a primitive's prototype under a key that tla-ts doesn't read", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      Object.defineProperty(Number.prototype, "next", {
        get: function () {
          throw new RangeError("getter");
        },
      });
      let isThrown = false;
      try {
        Iterator.prototype.map.call(0, () => 0);
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      holder.count = 1;
      if (isThrown) throw new Error("TypeError");
    `);
    expect(result.failure?.message).toContain("TypeError");
  });

  it("stops reading a primitive's property that an accessor on its prototype defines", async () => {
    const result = await checkModel(`
      Object.defineProperty(Number.prototype, "next", {
        get: function () {
          throw new RangeError("getter");
        },
      });
      const next = (0 as unknown as { next: unknown }).next;
    `);
    expect(result.failure?.message).toContain("tla-ts can't read the properties of 0");
  });

  it("stops defining an accessor on a primitive's prototype under a key that tla-ts reads", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      Object.defineProperty(Number.prototype, "toString", {
        get: function () {
          throw new RangeError("getter");
        },
      });
      holder.count = 1;
    `);
    expect(result.failure?.message).toContain("tla-ts can't define accessors on built-in objects");
  });

  it("tells that an iterator helper is an instance of Iterator", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      function* count() {
        yield 1;
      }
      if (count().take(1) instanceof Promise) throw new Error("promise");
      holder.count = 1;
      if (count().map((value) => value) instanceof Iterator) throw new Error("helper");
    `);
    expect(result.failure?.message).toContain("helper");
  });

  it("makes a generator object inherit from its function's prototype object", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      function* g() {}
      function* h() {}
      if (Object.getPrototypeOf(g()) !== g.prototype || h() instanceof g) throw new Error("other");
      holder.count = 1;
      if (g() instanceof g && g() instanceof Iterator) throw new Error("instance");
    `);
    expect(result.failure?.message).toContain("instance");
  });

  it("makes a generator object inherit from the prototype object of a variable's function", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const g = function* () {};
      holder.count = 1;
      if (g() instanceof g) throw new Error("instance");
    `);
    expect(result.failure?.message).toContain("instance");
  });

  it("stops telling what a generator object inherits from", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const source = {
        *count() {
          yield 1;
        },
      };
      holder.count = 1;
      if (source.count() instanceof Iterator) throw new Error("generator");
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell what a generator inherits from");
  });

  it("throws the TypeError of Iterator.prototype's methods on what isn't an iterator", async () => {
    const result = await checkModel(`
      const box = { seen: 0 };
      const caught: string[] = [];
      try {
        Iterator.prototype.some.call(null, () => true);
      } catch (error) {
        caught.push(error instanceof TypeError ? "a" : "x");
      }
      try {
        Iterator.prototype.reduce.call({ next: 0 }, () => 0, 0);
      } catch (error) {
        caught.push(error instanceof TypeError ? "b" : "x");
      }
      const iter = Iterator.prototype.map.call({ next: 0 }, () => 0);
      caught.push("c");
      try {
        iter.next();
      } catch (error) {
        caught.push(error instanceof TypeError ? "d" : "x");
      }
      const none = Iterator.prototype.take.call({ next: 0 }, 0);
      const end = none.next();
      if (caught.join("") !== "abcd" || !end.done) throw new Error("thrown");
    `);
    expect(result.failure).toBeUndefined();
  });

  it("unrolls a generator's counted loop that yields", async () => {
    const result = await checkModel(`
      function* g(): Generator<number> {
        for (let i = 0; i < 5; ++i) {
          if (i === 3) continue;
          yield i * 10;
        }
        yield 99;
      }
      const iter = g();
      const first = iter.next();
      iter.next();
      const third = iter.next();
      const rest = iter.toArray();
      function* h(): Generator<number> {
        for (let i = 4; i >= 0; i -= 2) {
          if (i === 0) break;
          yield i;
        }
      }
      const down = h().toArray();
      if (first.value !== 0 || third.value !== 20 || rest.join() !== "40,99" || down.join() !== "4,2") {
        throw new Error("unrolled");
      }
    `);
    expect(result.failure).toBeUndefined();
    expect(() =>
      compile(`
        function* g(): Generator<number> {
          for (let i = 0; i < 100; i++) yield i;
        }
        g().next();
      `),
    ).toThrow("Yield outside loops");
  });

  it("runs a generator's loop that runs until it leaves as far as its caller steps it", async () => {
    await expect(
      checkModel(`
        function* naturals(): Generator<number> {
          let i = 0;
          while (true) {
            yield i;
            ++i;
          }
        }
        const three = naturals().take(3).toArray();
        const iter = naturals();
        iter.next();
        const second = iter.next();
        if (three.join() !== "0,1,2" || second.value !== 1) throw new Error("forever");
        if (second.value === 1) throw new Error("stepped");
      `),
    ).rejects.toThrow("stepped");
  });

  it("stops a generator's loop that runs until it leaves past 64 iterations", () => {
    expect(() =>
      compile(`
        function* naturals(): Generator<number> {
          let i = 0;
          for (;;) {
            if (i > 2) return;
            yield i;
            i += 1;
          }
        }
        Array.from(naturals());
      `),
    ).toThrow("tla-ts can't run more than 64 iterations of a generator's loop");
  });

  it("gives a generator object back from Iterator.from", async () => {
    await expect(
      checkModel(`
        function* g(): Generator<number> {
          yield 1;
          yield 2;
        }
        Iterator.from(g());
        Iterator.from.call(null, g());
        const generator = g();
        generator.next();
        const resumed = Iterator.from(generator).next();
        if (resumed.value !== 2) throw new Error("from");
        if (resumed.value === 2) throw new Error("resumed");
      `),
    ).rejects.toThrow("resumed");
  });

  it("takes from the generator object that Iterator.from gives back", async () => {
    await expect(
      checkModel(`
        function* g(): Generator<number> {
          yield 1;
          yield 2;
        }
        const firstOne = Iterator.from(g()).take(1).toArray();
        if (firstOne.join() !== "1") throw new Error("from");
        if (firstOne.join() === "1") throw new Error("taken");
      `),
    ).rejects.toThrow("taken");
  });

  it("stops Iterator.from where a script replaced Iterator.prototype's @@iterator", async () => {
    const result = await checkModel(`
      function* g(): Generator<number> {
        yield 1;
      }
      Object.defineProperty(Iterator.prototype, Symbol.iterator, { value: () => 7 });
      Iterator.from(g());
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't call Iterator.prototype.@@iterator where a script replaced it",
    );
  });

  it("steps the array's iterator that Iterator.from gives back as the array changes", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const elements = [1, 2];
      const iterator = Iterator.from(elements);
      elements.push(3);
      if (Array.from(iterator).join() !== "1,2,3") throw new Error("from");
      holder.count = 1;
      if (iterator.next().done) throw new Error("done");
    `);
    expect(result.failure?.message).toContain("done");
  });

  it("runs a for-of over the array's iterator that Iterator.from gives back", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      let sum = 0;
      for (const value of Iterator.from([1, 2])) sum += value;
      holder.count = 1;
      if (sum === 3) throw new Error("summed");
    `);
    expect(result.failure?.message).toContain("summed");
  });

  it("maps an array's iterator through an iterator helper", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const doubled = [1, 2].keys().map((value) => value * 2).toArray();
      holder.count = 1;
      if (doubled.join() === "0,2") throw new Error("mapped");
    `);
    expect(result.failure?.message).toContain("mapped");
  });

  it("leaves an array's iterator open where some stops early", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const iterator = [1, 2, 3].values();
      if (!iterator.some((value) => value === 1)) throw new Error("some");
      holder.count = 1;
      if (iterator.next().value === 2) throw new Error("open");
    `);
    expect(result.failure?.message).toContain("open");
  });

  it("reduces a variable's array iterator", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const iterator = [1, 2].values();
      const sum = iterator.reduce((total, value) => total + value, 0);
      holder.count = 1;
      if (sum === 3) throw new Error("reduced");
    `);
    expect(result.failure?.message).toContain("reduced");
  });

  it("runs a for-of over a variable's array iterator from where next left it", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const iterator = [1, 2].values();
      iterator.next();
      let sum = 0;
      for (const value of iterator) sum += value;
      holder.count = 1;
      if (sum === 2) throw new Error("rest");
    `);
    expect(result.failure?.message).toContain("rest");
  });

  it("destructures a variable's array iterator by stepping it", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const iterator = [1, 2, 3].values();
      const [first, ...rest] = iterator;
      holder.count = 1;
      if (first === 1 && rest.length === 2) throw new Error("stepped");
    `);
    expect(result.failure?.message).toContain("stepped");
  });

  it("stops destructuring an iterator through a parameter that an Iterable types", async () => {
    const result = await checkModel(`
      const take = ([first]: Iterable<number>) => first;
      if (take([5].values()) === 5) throw new Error("taken");
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't destructure an object through its iterator",
    );
  });

  it("stops assigning from an iterator through a pattern that an Iterable types", async () => {
    const result = await checkModel(`
      let first = 0;
      const assign = (values: Iterable<number>) => {
        [first] = values;
      };
      assign([5].values());
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't destructure an object through its iterator",
    );
  });

  it("stops destructuring an iterator that a nested pattern reads", () => {
    expect(() =>
      checkModel(`
        const holder = { values: [7].values() };
        const { values: [first] } = holder;
      `),
    ).toThrow("tla-ts can't destructure this object through its iterator");
  });

  it("steps a string's iterator with next", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const iterator = "ab"[Symbol.iterator]();
      const first = iterator.next();
      if (first.value !== "a" || first.done) throw new Error("first");
      iterator.next();
      holder.count = 1;
      if (iterator.next().done) throw new Error("done");
    `);
    expect(result.failure?.message).toContain("done");
  });

  it("steps a string's iterator by code points", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const pair = "\\uD834\\uDF06";
      const iterator = pair[Symbol.iterator]();
      if (iterator.next().value !== pair) throw new Error("pair");
      holder.count = 1;
      if (iterator.next().done) throw new Error("done");
    `);
    expect(result.failure?.message).toContain("done");
  });

  it("gives a string's iterator back from Iterator.from", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const characters = Array.from(Iterator.from("ab"));
      holder.count = 1;
      if (characters.join() === "a,b") throw new Error("from");
    `);
    expect(result.failure?.message).toContain("from");
  });

  it("iterates the string that a String object holds", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const characters = Array.from(Iterator.from(new String("ab")));
      holder.count = 1;
      if (characters.join() === "a,b") throw new Error("wrapped");
    `);
    expect(result.failure?.message).toContain("wrapped");
  });

  it("makes a string's iterator inherit from %StringIteratorPrototype%", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const prototype = Object.getPrototypeOf(""[Symbol.iterator]());
      const iteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([].values()));
      if (prototype === iteratorPrototype) throw new Error("same");
      holder.count = 1;
      if (Object.getPrototypeOf(prototype) === iteratorPrototype) throw new Error("ancestry");
    `);
    expect(result.failure?.message).toContain("ancestry");
  });

  it("runs a for-of over a variable's string iterator from where next left it", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const iterator = "ab"[Symbol.iterator]();
      iterator.next();
      let joined = "";
      for (const character of iterator) joined += character;
      holder.count = 1;
      if (joined === "b") throw new Error("rest");
    `);
    expect(result.failure?.message).toContain("rest");
  });

  it("destructures a string's iterator in an assignment", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      let first = "";
      let rest: string[] = [];
      [first, ...rest] = "abc"[Symbol.iterator]();
      holder.count = 1;
      if (first === "a" && rest.join("") === "bc") throw new Error("assigned");
    `);
    expect(result.failure?.message).toContain("assigned");
  });

  it("spreads a generator where it's made and where a variable holds it", async () => {
    await expect(
      checkModel(`
      function* g() {
        yield 1;
        yield 2;
      }
      const source = g();
      source.next();
      const all = [0, ...g(), ...source, 3];
      if (all.join() === "0,1,2,2,3") throw new Error("spread");
    `),
    ).rejects.toThrow("spread");
  });

  it("spreads the iterators of an array and a string", async () => {
    const result = await checkModel(`
      const holder = { count: 0 };
      const iterator = "ab"[Symbol.iterator]();
      const all = [...iterator, ...Iterator.from([1]), ...iterator];
      holder.count = 1;
      if (all.join() === "a,b,1") throw new Error("spread");
    `);
    expect(result.failure?.message).toContain("spread");
  });

  it("stops a generator's spread after what reads what the generator changes", () => {
    expect(() =>
      checkModel(`
        let count = 0;
        function* g() {
          count += 1;
          yield count;
        }
        const all = [count, ...g()];
      `),
    ).toThrow("tla-ts can't run this before what reads what it changes");
  });

  it("stops a generator's spread that a statement can't step first", () => {
    expect(() =>
      checkModel(`
        function* g() {
          yield 1;
        }
        const pick = (isPicked: boolean) => (isPicked ? [...g()] : []);
        if (pick(true).length !== 1) throw new Error("picked");
      `),
    ).toThrow("tla-ts can't step an iterator in this spread");
  });

  it("throws the TypeError of an Array.prototype method on undefined or null", async () => {
    const result = await checkModel(`
      let caught = 0;
      try {
        Array.prototype.find.call(null, () => true);
      } catch (error) {
        if (error instanceof TypeError) caught += 1;
      }
      try {
        [].values.call(undefined);
      } catch (error) {
        if (error instanceof TypeError) caught += 1;
      }
      if (caught === 2) throw new Error("thrown");
    `);
    expect(result.failure?.message).toContain("thrown");
  });

  it("runs an Array.prototype method on a boolean, a number, or a string through its wrapper", async () => {
    const result = await checkModel(`
      const found = Array.prototype.indexOf.call("abc", "b");
      const joined = Array.prototype.join.call(true);
      const isWrapped = Array.prototype.some.call(
        "a",
        (value: string, index: number, object: unknown) => typeof object === "object",
      );
      if (found === 1 && joined === "" && isWrapped) throw new Error("wrapped");
    `);
    expect(result.failure?.message).toContain("wrapped");
  });

  it("pushes, pops, shifts, unshifts, and reverses an array-like object through call", async () => {
    const result = await checkModel(`
      const object = { 0: "a", 1: "b", length: 2 };
      const pushed = Array.prototype.push.call(object, "c");
      const shifted = Array.prototype.shift.call(object);
      Array.prototype.reverse.call(object);
      const popped = Array.prototype.pop.call(object);
      const unshifted = Array.prototype.unshift.call(true, 1);
      if (
        pushed === 3 &&
        shifted === "a" &&
        popped === "b" &&
        unshifted === 1 &&
        object[0] === "c" &&
        object.length === 1
      ) {
        throw new Error("changed");
      }
    `);
    expect(result.failure?.message).toContain("changed");
  });

  it("stops a reverse through call whose object a script reads", () => {
    expect(() =>
      checkModel(`
        const reversed = Array.prototype.reverse.call(true);
        if (!(reversed instanceof Boolean)) throw new Error("reversed");
      `),
    ).toThrow("Unsupported call: Array.prototype.reverse.call");
  });

  it("runs [].method.call as Array.prototype.method.call, through the object's getters", async () => {
    const result = await checkModel(`
      class Abrupt extends Error {}
      const object = { length: 1 };
      Object.defineProperty(object, 0, {
        get: function () {
          throw new Abrupt();
        },
      });
      let isThrown = false;
      try {
        [].find.call(object, function () {});
      } catch (error) {
        isThrown = error instanceof Abrupt;
      }
      if (isThrown) throw new Error("found");
    `);
    expect(result.failure?.message).toContain("found");
  });

  it("takes or drops up to Infinity or Number.MAX_SAFE_INTEGER", async () => {
    const result = await checkModel(`
      function* g(): Generator<number> {
        yield 0;
        yield 1;
      }
      const largest = g().take(Number.MAX_SAFE_INTEGER).toArray();
      const unlimited = g().take(Infinity).toArray();
      const dropped = g().drop(Infinity).toArray();
      if (largest.join() !== "0,1" || unlimited.join() !== "0,1" || dropped.length !== 0) {
        throw new Error("limit");
      }
    `);
    expect(result.failure).toBeUndefined();
  });

  it("takes or drops up to a fraction's whole part", async () => {
    await expect(
      checkModel(`
        function* g(): Generator<number> {
          yield 0;
          yield 1;
        }
        const truncated = g().take(1.9).toArray();
        const halfDropped = g().drop(1.5).toArray();
        if (truncated.join() !== "0" || halfDropped.join() !== "1") throw new Error("limit");
        if (truncated.length === 1) throw new Error("one");
      `),
    ).rejects.toThrow("one");
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

  it("defines a class's fields under literal and computed literal keys", async () => {
    const getSource = (keys: string) => `
      const C = class {
        [1.5e1] = "a";
        ["x"] = "b";
        2 = "c";
        static [1e3] = () => 7;
      };
      const made = new C();
      const keys = Object.keys(made).join(",");
      if (keys !== "${keys}" || made[15] !== "a" || made.x !== "b" || C[1000]() !== 7) {
        throw new Error("fields");
      }
    `;
    expect((await checkModel(getSource("2,15,x"))).failure).toBeUndefined();
    expect((await checkModel(getSource("15,x,2"))).failure?.message).toContain("fields");
  });

  it("throws the ReferenceError of a name that a class's computed key reads", async () => {
    const getSource = (caught: string) => `
      let caught = "";
      const evaluate = () => {
        // @ts-ignore
        class C { ["a"] = 1; [noRef] = 2; }
      };
      try {
        evaluate();
      } catch (error) {
        caught = error instanceof ReferenceError ? "reference" : "other";
      }
      if (caught !== "${caught}") throw new Error("caught");
    `;
    expect((await checkModel(getSource("reference"))).failure).toBeUndefined();
    expect((await checkModel(getSource("other"))).failure?.message).toContain("caught");
  });

  it("constructs a class that a field of a class constructed once holds", async () => {
    const getSource = (own: number) => `
      class C {
        #m = 1;
        get #g() { return 2; }
        B = class {
          #own = 3;
          read(o: C) { return o.#m + o.#g; }
          own() { return this.#own; }
        };
      }
      const c = new C();
      const inner = new c.B();
      const other = new c.B();
      const isShared = Object.getPrototypeOf(inner) === Object.getPrototypeOf(other);
      if (inner.read(c) !== 3 || inner.own() !== ${own} || !isShared) throw new Error("nested");
    `;
    expect((await checkModel(getSource(3))).failure).toBeUndefined();
    expect((await checkModel(getSource(4))).failure?.message).toContain("nested");
  });

  it("stops at a new of a field whose class a script replaced", async () => {
    const result = await checkModel(`
      class D { m() { return 2; } }
      class C { B = class { m() { return 1; } }; }
      const c = new C();
      Object.defineProperty(c, "B", { value: D });
      const inner = new c.B();
      if (inner.m() !== 2) throw new Error("replaced");
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell which class this value holds");
  });

  it("stops at a class that a field of a class constructed twice holds", () => {
    expect(() =>
      compile(`
        class C { B = class { m() { return 1; } }; }
        const one = new C();
        const two = new C();
        if (new one.B().m() !== new two.B().m()) throw new Error("twice");
      `),
    ).toThrow("Unsupported expression");
  });

  it("runs a class's method through call with another object as this", async () => {
    const getSource = (got: number) => `
      class C {
        x = 5;
        m(add: number) { return this.x + add; }
        set() { this.x = 9; }
      }
      const c = new C();
      const o = { x: 7 };
      const got = c.m.call(o, 1);
      C.prototype.set.call(o);
      if (got !== ${got} || c.m(1) !== 6 || o.x !== 9 || c.x !== 5) throw new Error("call");
    `;
    expect((await checkModel(getSource(8))).failure).toBeUndefined();
    expect((await checkModel(getSource(6))).failure?.message).toContain("call");
  });

  it("throws the TypeError of a private name that an object lacks", async () => {
    const getSource = (expected: string) => `
      let log = "";
      class S {
        #m() { return 1; }
        run() { return this.#m(); }
      }
      class D extends S {
        #f = 0;
        static #s = 1;
        go() { this.#f = 2; log += "go"; }
        each() { for (this.#f of [1]) {} }
        static read() { return this.#s; }
      }
      const s = new S();
      const d = new D();
      let caught = "";
      try { D.prototype.go.call(s); } catch (error) { caught += error instanceof TypeError ? "t" : "o"; }
      try { D.prototype.each.call({}); } catch (error) { caught += error instanceof TypeError ? "t" : "o"; }
      try { D.read.call(d); } catch (error) { caught += error instanceof TypeError ? "t" : "o"; }
      try { S.prototype.run.call(d); } catch (error) { caught += error instanceof TypeError ? "t" : "o"; }
      if (caught !== "${expected}" || log !== "") throw new Error("brand");
    `;
    expect((await checkModel(getSource("ttt"))).failure).toBeUndefined();
    expect((await checkModel(getSource("tttt"))).failure?.message).toContain("brand");
  });

  it("calls the arrows that the objects a function makes hold, each an object of its own", async () => {
    const getSource = (expected: string) => `
      interface State {
        count: number;
      }
      type Predicate = (state: State) => boolean;
      interface Unit {
        type: string;
        semantic: Predicate | undefined;
      }
      const isBig = (state: State) => state.count > 2;
      const lookahead = (options: { semantic?: Predicate }): Unit => ({
        type: "lookahead",
        semantic: options.semantic,
      });
      const getItem = () => lookahead({ semantic: (state) => isBig(state) || state.count === 0 });
      const first = getItem();
      const second = getItem();
      const run = (unit: Unit, count: number) =>
        unit.semantic === undefined || unit.semantic({ count });
      const result = [run(first, 3), run(second, 1), run(first, 0), first.semantic === second.semantic];
      if (result.join(",") !== "${expected}") throw new Error(result.join(","));
    `;
    expect((await checkModel(getSource("true,false,true,false"))).failure).toBeUndefined();
    expect((await checkModel(getSource("true,false,true,true"))).failure?.message).toContain(
      "true,false,true,false",
    );
  });

  it("calls the closures of a factory with variables that something besides its one call names", async () => {
    const getSource = (expected: string) => `
      const createCount = (start: number) => {
        let count = start;
        return () => ++count;
      };
      const first = createCount(0);
      const tools = { createCount };
      const second = tools.createCount(10);
      const result = [first(), second(), first(), second()].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("1,11,2,12"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,11,2,11"))).failure?.message).toContain("1,11,2,12");
  });

  it("calls the arrows that a function returns, each with its call's locals", async () => {
    const getSource = (expected: string) => `
      interface State {
        count: number;
      }
      type Predicate = (state: State) => boolean;
      interface Unit {
        semantic: Predicate;
      }
      const isAbove = (limit: number) => (state: State) => state.count > limit;
      const isBig = isAbove(2);
      const getItem = (limit: number): Unit => ({ semantic: isAbove(limit) });
      const low = getItem(0);
      const high = getItem(5);
      const check = (count: number) => isAbove(4)({ count }) || count === 0;
      const result = [isBig({ count: 3 }), low.semantic({ count: 1 }), high.semantic({ count: 1 })];
      const checked = [check(5), check(1), check(0)];
      if ([...result, ...checked].join(",") !== "${expected}") {
        throw new Error([...result, ...checked].join(","));
      }
    `;
    expect(
      (await checkModel(getSource("true,true,false,true,false,true"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(getSource("true,true,true,true,false,true"))).failure?.message,
    ).toContain("true,true,false,true,false,true");
  });

  it("calls the closures that the objects a function makes hold, each with its call's locals", async () => {
    const getSource = (expected: string) => `
      const named = (name: string) => ({ type: "named", read: () => name });
      const first = named("a");
      const second = named("b");
      const result = [first.read(), second.read(), first.read()].join("");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("aba"))).failure).toBeUndefined();
    expect((await checkModel(getSource("abb"))).failure?.message).toContain("aba");
  });

  it("calls the function that a closure's parameter holds", async () => {
    const getSource = (expected: number) => `
      interface State {
        count: number;
      }
      const action = (run: (state: State) => string | undefined | void) => ({
        type: "action",
        run: (state: State) => run(state) ?? undefined,
      });
      const bump = action((state) => {
        state.count++;
      });
      const state: State = { count: 0 };
      bump.run(state);
      bump.run(state);
      if (state.count !== ${expected}) throw new Error(String(state.count));
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    expect((await checkModel(getSource(1))).failure?.message).toContain("2");
  });

  const getConstSource = (write: string, caught: number) => `
      const seen = { count: 0 };
      const fixed = 1;
      try {
        // @ts-ignore
        ${write};
      } catch (error) {
        seen.count += error instanceof TypeError ? 1 : 10;
      }
      if (fixed !== 1 || seen.count !== ${caught}) throw new Error("const");
  `;

  it("throws the TypeError of an assignment to a const", async () => {
    expect((await checkModel(getConstSource("fixed = 2", 1))).failure).toBeUndefined();
  });

  it("throws the TypeError of a compound assignment to a const", async () => {
    expect((await checkModel(getConstSource("fixed += 2", 1))).failure).toBeUndefined();
  });

  it("throws the TypeError of an increment of a const", async () => {
    expect((await checkModel(getConstSource("fixed++", 1))).failure).toBeUndefined();
  });

  it("leaves a const that a logical assignment doesn't write as it is", async () => {
    expect((await checkModel(getConstSource("fixed ||= 2", 0))).failure).toBeUndefined();
  });

  it("throws no other error for an assignment to a const", async () => {
    expect((await checkModel(getConstSource("fixed = 2", 10))).failure?.message).toContain("const");
  });

  it("throws the TypeError of a write to a const that a closure reads", async () => {
    expect(
      (
        await checkModel(`
          const seen = { count: 0 };
          let probe: (() => void) | undefined;
          function make() {
            const kept = 1;
            probe = function () {
              // @ts-ignore
              kept = 2;
            };
          }
          make();
          try {
            probe!();
          } catch (error) {
            seen.count += error instanceof TypeError ? 1 : 10;
          }
          if (seen.count !== 1) throw new Error("const");
        `)
      ).failure,
    ).toBeUndefined();
  });

  const getOwnNameWriteSource = (directive: string, expected: string) => `
      ${directive}
      const seen = { count: 0 };
      const func = function f() {
        // @ts-ignore
        f = 1;
        if (typeof f !== "function") throw new Error("changed");
      };
      let result = "none";
      try {
        func();
        result = "ran";
      } catch (error) {
        result = error instanceof TypeError ? "TypeError" : "other";
      }
      if (result !== "${expected}") throw new Error("own " + result);
  `;

  it("ignores a write to a function expression's own name outside strict code", async () => {
    expect((await checkModel(getOwnNameWriteSource("", "ran"))).failure).toBeUndefined();
  });

  it("throws the TypeError of a write to a function expression's own name in strict code", async () => {
    expect(
      (await checkModel(getOwnNameWriteSource('"use strict";', "TypeError"))).failure,
    ).toBeUndefined();
  });

  it("stops where a pattern writes a const", () => {
    expect(() =>
      compile(`
        const seen = { count: 0 };
        const pair = 1;
        try {
          // @ts-ignore
          [pair] = [5];
        } catch (error) {
          seen.count += 1;
        }
      `),
    ).toThrow("tla-ts can't follow this write to pair");
  });

  const getClosureSource = (expected: string) => `
      const seen = { count: 0 };
      let probe: (() => { greeting: string }) | undefined;
      let kept: (() => { greeting: string }) | undefined;
      let read = "";
      function make(name: string) {
        var greeting = "hi " + name;
        probe = function () { seen.count += 1; return { greeting }; };
        if (kept !== undefined) read = kept().greeting;
      }
      make("a");
      kept = probe;
      make("b");
      var greeting = "outside";
      const both = read + probe!().greeting;
      if (both !== "${expected}" || seen.count !== 2 || greeting !== "outside") {
        throw new Error("closures");
      }
  `;

  it("calls a function that outlives the call that made it with the locals of that call", async () => {
    expect((await checkModel(getClosureSource("hi ahi b"))).failure).toBeUndefined();
  });

  it("reads the locals of the call that made a closure, not of a later call", async () => {
    expect((await checkModel(getClosureSource("hi bhi b"))).failure?.message).toContain("closures");
  });

  it("stops where a function that made a closure changes a local after making it", () => {
    expect(() =>
      compile(`
        const seen = { count: 0 };
        let probe: (() => number) | undefined;
        function make() {
          let count = 0;
          probe = function () { return count; };
          count += 1;
        }
        make();
        if (probe!() !== 1) throw new Error("closures");
      `),
    ).toThrow("tla-ts can't follow a function that outlives its call");
  });

  const getOwnNameSource = (operator: string) => `
      const seen = { count: 0 };
      var probe: (() => unknown) | undefined;
      var func = function f(): unknown {
        probe = function () { return f; };
        return f;
      };
      var f = "outside";
      const returned = func();
      if (f !== "outside" || returned !== func || probe!() ${operator} func) throw new Error("own");
  `;

  it("reads the name that a function expression gives itself as the function", async () => {
    expect((await checkModel(getOwnNameSource("!=="))).failure).toBeUndefined();
  });

  it("reads the name that a function expression gives itself as no other value", async () => {
    expect((await checkModel(getOwnNameSource("==="))).failure?.message).toContain("own");
  });

  it("stops where a function that the script makes as an object reads its own name", () => {
    expect(() =>
      compile(`
        const seen = { count: 0 };
        function make() { return function f(): unknown { return f; }; }
        const made = make();
        const other = make();
        if (made() !== made || other() !== other) throw new Error("own");
      `),
    ).toThrow("tla-ts can't read f, the name that this function gives itself");
  });

  const getAsyncClosureSource = (expected: number) => `
      "use strict";
      let count = 0;
      const make = async function make(x: number) {
        const own = arguments;
        return async () => [x, arguments === own];
      };
      const other = { async method(y: number) { return async function () { return y; }; } };
      make(1).then((first) => {
        count++;
        return first();
      }).then((result) => {
        if (result[0] !== 1 || result[1] !== true) throw new Error("async");
        return other.method(2);
      }).then((second) => second()).then((result) => {
        if (result !== ${expected} || count !== 1) throw new Error("async");
      });
  `;

  it("calls an async closure that a promise gives with the locals of the call that made it", async () => {
    expect((await checkModel(getAsyncClosureSource(2))).failure).toBeUndefined();
  });

  it("rejects where an async closure gives another value", async () => {
    expect((await checkModel(getAsyncClosureSource(3))).failure?.message).toContain("rejected");
  });

  const getArrowArgumentsSource = (expected: number) => `
      "use strict";
      const seen = { count: 0 };
      let read: (() => unknown) | undefined;
      let kept: (() => unknown) | undefined;
      function make(first: number) {
        const own = arguments;
        const second = (() => arguments[0] as number)();
        read = () => (arguments === own ? (arguments[0] as number) + second : 0);
      }
      make(1);
      kept = read;
      make(2);
      if (kept!() !== ${expected} || read!() !== 4) throw new Error("arguments");
  `;

  it("reads the arguments of the function around an arrow", async () => {
    expect((await checkModel(getArrowArgumentsSource(2))).failure).toBeUndefined();
  });

  it("reads the arguments of the call that made an arrow, not of a later call", async () => {
    expect((await checkModel(getArrowArgumentsSource(4))).failure?.message).toContain("arguments");
  });

  const getIteratorSource = (expected: number) => `
      const seen = { count: 0 };
      const iterable = {
        [Symbol.iterator]: function () {
          let count = 0;
          return {
            next: function () {
              count += 1;
              return { value: count, done: count > 2 };
            },
          };
        },
      };
      let total = 0;
      for (const value of iterable) total += value;
      for (const value of iterable) total += value * 10;
      if (total !== ${expected}) throw new Error("iter");
  `;

  const getEscapedNextSource = (expected: number) => `
      const seen = { count: 0 };
      let next: (() => { value: number; done: boolean }) | undefined;
      function make(limit: number) {
        let count = 0;
        next = function () {
          count += 1;
          return { value: count, done: count > limit };
        };
      }
      make(2);
      const iterable = { [Symbol.iterator]() { return { next: next! }; } };
      let total = 0;
      for (const value of iterable) total += value;
      if (total !== ${expected}) throw new Error("iter");
  `;

  it("calls a closure that outlives its call through the iterator protocol", async () => {
    expect((await checkModel(getEscapedNextSource(3))).failure).toBeUndefined();
  });

  it("reads what a closure keeps in its environment where a protocol calls it", async () => {
    expect((await checkModel(getEscapedNextSource(6))).failure?.message).toContain("iter");
  });

  it("calls a closure that an object's property holds through the iterator protocol", async () => {
    expect((await checkModel(getIteratorSource(33))).failure).toBeUndefined();
  });

  it("gives each call that makes a closure an environment of its own", async () => {
    expect((await checkModel(getIteratorSource(34))).failure?.message).toContain("iter");
  });

  const getBoxSource = (expected: number) => `
      const seen = { count: 0 };
      function Box(this: { valueOf: () => number }, value: number) {
        this.valueOf = function () {
          return value;
        };
      }
      // @ts-ignore
      const first = new Box(2);
      // @ts-ignore
      const second = new Box(3);
      if (first * 10 + second !== ${expected}) throw new Error("box");
  `;

  it("calls a closure that a constructor assigns to a property of this through valueOf", async () => {
    expect((await checkModel(getBoxSource(23))).failure).toBeUndefined();
  });

  it("reads the locals of the constructor call that assigned the closure", async () => {
    expect((await checkModel(getBoxSource(32))).failure?.message).toContain("box");
  });

  it("stops where a call doesn't enter the closure that it runs", () => {
    expect(() =>
      compile(`
        const seen = { count: 0 };
        function make(x: number) {
          return { get: function () { return x; } };
        }
        if (make(3).get() !== 3) throw new Error("get");
      `),
    ).toThrow("tla-ts can't tell which call made this function");
  });

  const getCounterSource = (expected: string) => `
      const seen = { count: 0 };
      let next: (() => number) | undefined;
      let other: (() => number) | undefined;
      function counter(start: number) {
        let count = start;
        next = function () {
          count += 1;
          if (count === 3) throw new Error("three");
          return count;
        };
      }
      counter(0);
      other = next;
      counter(10);
      let thrown = 0;
      const first = other!();
      const second = other!();
      try { other!(); } catch (error) { thrown += 1; }
      const third = other!();
      const fourth = next!();
      if ([first, second, third, fourth, thrown].join() !== "${expected}") {
        throw new Error("counters");
      }
  `;

  it("keeps the locals that a closure changes in its environment", async () => {
    expect((await checkModel(getCounterSource("1,2,4,11,1"))).failure).toBeUndefined();
  });

  it("keeps a closure's change to a local where the closure throws", async () => {
    expect((await checkModel(getCounterSource("1,2,3,11,1"))).failure?.message).toContain(
      "counters",
    );
  });

  it("stops where a function reads a local after a closure that changes it is made", () => {
    expect(() =>
      compile(`
        const seen = { count: 0 };
        let next: (() => number) | undefined;
        function counter() {
          let count = 0;
          next = function () { count += 1; return count; };
          return count;
        }
        counter();
        if (next!() !== 1) throw new Error("counters");
      `),
    ).toThrow("tla-ts can't follow a function that outlives its call and shares a local");
  });

  it("makes a class expression that a script only reads where it runs", async () => {
    const getSource = (length: number) => `
      const describe = (made: object, key: string) => Object.getOwnPropertyDescriptor(made, key)!.value;
      const method = class { m(x = 42, y?: number) {} }.prototype.m;
      const length = describe(method, "length");
      const staticMethod = class { static n(x: number, y = 1) {} }.n;
      const staticLength = describe(staticMethod, "length");
      let value: { name: string } | undefined = undefined;
      value ??= class {};
      const assigned = describe(value, "name");
      const anonymous = describe(class {}, "name");
      const named = describe(class cls {}, "name");
      if (length !== 0 || staticLength !== ${length} || assigned !== "value" || anonymous !== "" || named !== "cls") {
        throw new Error("classes");
      }
    `;
    expect((await checkModel(getSource(1))).failure).toBeUndefined();
    expect((await checkModel(getSource(2))).failure?.message).toContain("classes");
  });

  it("makes the generator methods of a class expression that a script only reads", async () => {
    const getSource = (lengths: string) => `
      const describe = (made: object, key: string) => Object.getOwnPropertyDescriptor(made, key)!.value;
      const prototype = class { a() {} *g(x: number, y = 1) {} static *h() {} b(x: number) {} }.prototype;
      const generator: object = prototype.g;
      const isGenerator = Object.getPrototypeOf(generator) === Object.getPrototypeOf(function* () {});
      const generated: object = describe(generator, "prototype");
      const isGenerated =
        Object.getPrototypeOf(generated) === Object.getPrototypeOf(function* () {}).prototype;
      const made: { h: object } = describe(prototype, "constructor");
      const lengths = [describe(generator, "length"), describe(prototype.b, "length")].join();
      if (lengths !== "${lengths}" || !isGenerator || !isGenerated || describe(made.h, "name") !== "h") {
        throw new Error("generator");
      }
    `;
    expect((await checkModel(getSource("1,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,0"))).failure?.message).toContain("generator");
  });

  it("stops at a call of a class expression that a script only reads", () => {
    expect(() =>
      compile(`
        const got = class { m() { return 1; } }.prototype.m();
        if (got !== 1) throw new Error("called");
      `),
    ).toThrow("Unsupported call");
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

  describe("follows an array through a method's parameters and the array it returns", () => {
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

    it("agrees with Node on first !== 4 || second !== 9", async () => {
      expect((await checkModel(getSource("first !== 4 || second !== 9"))).failure).toBeUndefined();
    });

    it("rejects the expectation first === 4", async () => {
      expect((await checkModel(getSource("first === 4"))).failure?.message).toContain("Pool");
    });

    it("rejects the expectation second === 9", async () => {
      expect((await checkModel(getSource("second === 9"))).failure?.message).toContain("Pool");
    });
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

  it("names an array after each removal, so that later removals read the name", async () => {
    const getSource = (count: number, expected: number) => `
      const queues: number[][] = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]];
      ${Array.from({ length: count }, (_, position) =>
        position % 2 === 0 ? `const removed${position} = queues[0].pop();` : "queues[0].shift();",
      ).join("\n")}
      const last = removed${Math.floor((count - 1) / 2) * 2};
      if (queues[0].length !== ${12 - count} || last !== ${expected}) throw new Error("removed");
    `;
    const getSize = (count: number) =>
      printModule(compile(getSource(count, 0), "spec.ts").source).length;
    expect(getSize(10)).toBeLessThan(3 * getSize(5));
    expect((await checkModel(getSource(10, 8))).failure).toBeUndefined();
    expect((await checkModel(getSource(10, 7))).failure?.message).toContain("removed");
  });

  it("gives undefined where an optional chain removes from an array that is missing", async () => {
    const declared = await checkModel(`
      const pops: (number[] | undefined)[] = [undefined];
      const shifts: (number[] | undefined)[] = [undefined];
      const splices: (number[] | undefined)[] = [undefined];
      const popped = pops[0]?.pop();
      const shifted = shifts[0]?.shift();
      const spliced = splices[0]?.splice(0, 1);
      if (popped !== undefined || shifted !== undefined || spliced !== undefined || pops[0] !== undefined) {
        throw new Error("declared");
      }
    `);
    expect(declared.failure).toBeUndefined();
  });

  it("assigns undefined where an optional chain removes from an array that is missing", async () => {
    const assigned = await checkModel(`
      const pops: (number[] | undefined)[] = [undefined];
      const shifts: (number[] | undefined)[] = [undefined];
      const splices: (number[] | undefined)[] = [undefined];
      let popped: number | undefined = 0;
      let shifted: number | undefined = 0;
      let spliced: number[] | undefined = [];
      popped = pops[0]?.pop();
      shifted = shifts[0]?.shift();
      spliced = splices[0]?.splice(0, 1);
      if (popped !== undefined || shifted !== undefined || spliced !== undefined) {
        throw new Error("assigned");
      }
    `);
    expect(assigned.failure).toBeUndefined();
  });

  it("removes through an optional chain from an array that is there", async () => {
    const getSource = (expected: string) => `
      const found: (number[] | undefined)[] = [[1, 2, 3, 4]];
      let last: number | undefined = 0;
      last = found[0]?.pop();
      const first = found[0]?.shift();
      let taken: number[] | undefined = [];
      taken = found[0]?.splice(0, 1);
      const result = [last, first, taken?.length, taken?.[0], found[0]?.length].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("4;1;1;2;1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("4;1;1;3;1"))).failure?.message).toContain("4;1;1;2;1");
  });

  it("throws a TypeError where a non-null assertion removes from an array that is missing", async () => {
    const getSource = (removal: string) => `
      const queues: (number[] | undefined)[] = [undefined];
      let removed: number | undefined = 0;
      let isThrown = false;
      try {
        ${removal}
      } catch (error) {
        isThrown = error instanceof TypeError;
      }
      if (!isThrown || removed !== 0) throw new Error("thrown");
    `;
    expect(
      (await checkModel(getSource("const value = queues[0]!.shift();"))).failure,
    ).toBeUndefined();
    expect((await checkModel(getSource("removed = queues[0]!.pop();"))).failure).toBeUndefined();
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

  it("sorts a spread copy of a parameter whose callback calls the function again", async () => {
    const getSource = (expected: string) => `
      let calls = 0;
      const compare = (left: number[], right: number[]): number => {
        calls += 1;
        return sortAll([left]).length - sortAll([right]).length + left[0] - right[0];
      };
      const sortAll = (lists: number[][]): number[][] =>
        [...lists].sort((left, right) => compare(left, right));
      const lists = [[3], [1], [2]];
      const sorted = sortAll(lists);
      const result = [
        sorted.map((inner) => inner[0]).join(),
        lists.map((inner) => inner[0]).join(),
        calls > 0,
      ].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("1,2,3;3,1,2;true"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,2,3;1,2,3;true"))).failure?.message).toContain(
      "1,2,3;3,1,2;true",
    );
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

  it("runs the callback of a spread array's method in a branch", async () => {
    const getSource = (expected: string) => `
      let calls = 0;
      const list = [3, 1, 2];
      const sorted = list.length < 2 ? list : [...list].sort((left, right) => {
        calls += 1;
        return left - right;
      });
      const doubled = list.length > 2 ? list : [...list].map((value) => {
        calls += 100;
        return value * 2;
      });
      const result = [sorted.join(), doubled.join(), list.join(), calls > 0].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("1,2,3;3,1,2;3,1,2;true"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,2,3;6,2,4;3,1,2;true"))).failure?.message).toContain(
      "1,2,3;3,1,2;3,1,2;true",
    );
  });

  it("changes a collection that may be missing only where an optional chain finds it", async () => {
    const result = await checkModel(`
      const scopes: (Set<string> | undefined)[] = [undefined];
      const queues: (number[] | undefined)[] = [undefined];
      scopes[0]?.add("a");
      queues[0]?.push(1);
      const getThrown = (change: () => void) => {
        try {
          change();
        } catch (error) {
          return error instanceof TypeError;
        }
        return false;
      };
      if (scopes[0] !== undefined || queues[0] !== undefined) throw new Error("optional");
      if (!getThrown(() => scopes[0]!.add("b")) || !getThrown(() => queues[0]!.push(2))) {
        throw new Error("thrown");
      }
    `);
    expect(result.failure).toBeUndefined();
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

  it("assigns an array pattern through the iterator that an object's method makes", async () => {
    const getSource = (closedAfter: number) => `
      let steps = 0;
      let closed = 0;
      const read = (): number => closed;
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
      let first = 0;
      [first] = iterable;
      if (first !== 10 || read() !== ${closedAfter}) throw new Error("close");
    `;
    expect((await checkModel(getSource(1))).failure).toBeUndefined();
    expect((await checkModel(getSource(0))).failure?.message).toContain("close");
  });

  it("assigns a rest element the values that an object's iterator gives", async () => {
    const getSource = (last: number) => `
      let steps = 0;
      const iterable = {
        [Symbol.iterator]: function () {
          return {
            next: function () {
              steps += 1;
              return { value: steps * 10, done: steps > 3 };
            },
          };
        },
      };
      let first = 0;
      let rest: number[] = [];
      [first, ...rest] = iterable;
      if (first !== 10 || rest.length !== 2 || rest[1] !== ${last}) throw new Error("rest");
    `;
    expect((await checkModel(getSource(30))).failure).toBeUndefined();
    expect((await checkModel(getSource(20))).failure?.message).toContain("rest");
  });

  it("assigns a for-of's array pattern through an object's iterator", async () => {
    const getSource = (closedAfter: number) => `
      let closed = 0;
      const read = (): number => closed;
      const iterable = {
        [Symbol.iterator]: function () {
          return {
            next: function () {
              return { value: 10, done: false };
            },
            return: function () {
              closed += 1;
              return { value: 0, done: true };
            },
          };
        },
      };
      let first = 0;
      for ([first] of [iterable]) {
        first += 1;
      }
      if (first !== 11 || read() !== ${closedAfter}) throw new Error("loop");
    `;
    expect((await checkModel(getSource(1))).failure).toBeUndefined();
    expect((await checkModel(getSource(0))).failure?.message).toContain("loop");
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

  it("converts a primitive that a string method takes as a string", async () => {
    const getSource = (expected: string) => `
      const outcomes = [
        // @ts-ignore
        "1234567890".split(null).length,
        // @ts-ignore
        "undefinedd".split(undefined)[0],
        // @ts-ignore
        "a1b1c".split(1).join("-"),
        // @ts-ignore
        "null-x".indexOf(null),
        // @ts-ignore
        "xundefined".indexOf(undefined),
        // @ts-ignore
        "atrue".replace(true, "T"),
        // @ts-ignore
        "ab".concat(undefined, null, 1),
        // @ts-ignore
        "a".padEnd(3, undefined) + "|",
      ].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect(
      (await checkModel(getSource("1,undefinedd,a-b-c,0,1,aT,abundefinednull1,a  |"))).failure,
    ).toBeUndefined();
    await expect(checkModel(getSource("1,undefinedd,a-b-c,0,1,aT,ab1,a  |"))).rejects.toThrow(
      "outcomes 1,undefinedd,a-b-c,0,1,aT,abundefinednull1,a  |",
    );
  });

  it("converts an object that a string method takes, with its parameter's hint", async () => {
    const getSource = (expected: string) => `
      const seen: string[] = [];
      const separator = { toString: () => (seen.push("separator"), "b") };
      const limit = { valueOf: () => (seen.push("limit"), 2) };
      // @ts-ignore
      seen.push("abcbdbe".split(separator, limit).join("-"));
      // @ts-ignore
      seen.push(String("abc".indexOf(separator)), "abc".replace(separator, "B"), "abcd".slice(limit));
      const outcomes = seen.join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    const expected = "limit,separator,a-c,separator,separator,limit,1,aBc,cd";
    expect((await checkModel(getSource(expected))).failure).toBeUndefined();
    expect(
      (await checkModel(getSource("separator,limit,a-c,separator,separator,limit,1,aBc,cd")))
        .failure?.message,
    ).toContain(`outcomes ${expected}`);
  });

  it("reads the method that a string method would call of an object it takes", async () => {
    const getSource = (expected: string) => `
      const seen: string[] = [];
      const create = (value: unknown) => ({ [Symbol.split]: value, toString: () => "-" });
      // @ts-ignore
      seen.push("a-a".split(create(null)).join("+"));
      try {
        // @ts-ignore
        "a-a".split(create(1));
        seen.push("none");
      } catch (error) {
        seen.push(error instanceof TypeError ? "type" : "other");
      }
      try {
        // @ts-ignore
        "ab".startsWith({ [Symbol.match]: true });
        seen.push("none");
      } catch (error) {
        seen.push(error instanceof TypeError ? "type" : "other");
      }
      const outcomes = seen.join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("a+a,type,type"))).failure).toBeUndefined();
    expect((await checkModel(getSource("a+a,none,none"))).failure?.message).toContain(
      "outcomes a+a,type,type",
    );
  });

  it("calls an object's Symbol.split method in place of split", async () => {
    const getSource = (expected: string) => `
      const separator = {
        [Symbol.split](text: string, limit: unknown): string[] {
          return [String(this === separator), text, String(limit)];
        },
      };
      // @ts-ignore
      const outcomes = ["a-a".split(separator, 3).join("+"), "a".split(separator).join("+")].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("true+a-a+3,true+a+undefined"))).failure).toBeUndefined();
    expect((await checkModel(getSource("a,a"))).failure?.message).toContain(
      "outcomes true+a-a+3,true+a+undefined",
    );
  });

  it("calls a Symbol.replace method whose value what takes it reads as unknown", async () => {
    const getSource = (isSame: boolean) => `
      const returned = {};
      const other = {};
      const searchValue = { [Symbol.replace]: () => returned };
      // @ts-ignore
      if (!Object.is("".replace(searchValue, "x"), ${isSame ? "returned" : "other"})) throw new Error("replaced");
    `;
    expect((await checkModel(getSource(true))).failure).toBeUndefined();
    expect((await checkModel(getSource(false))).failure?.message).toContain("replaced");
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

  it("escapes and unescapes strings of ASCII", async () => {
    const getSource = (expected: string) => `
      const outcomes = [
        escape("a b*@+-./_,~"),
        unescape("%0%u00410%41%%0000%u004%7A%u007a"),
        unescape("%U0000%zz%"),
      ].join("|");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect(
      (await checkModel(getSource("a%20b*@+-./_%2C%7E|%0A0A%\\x0000%u004zz|%U0000%zz%"))).failure,
    ).toBeUndefined();
    await expect(
      checkModel(getSource("a%20b*@+-./_%2C%7E|%0A0A%\\x0000%u004zz|%U0000%zz")),
    ).rejects.toThrow("outcomes");
    await expect(
      checkModel(`if (unescape("%u00E9") === "") throw new Error("never");`),
    ).rejects.toThrow("tla-ts can't make a character outside ASCII");
  });

  it("names a built-in that tla-ts doesn't run where a script calls it", () => {
    expect(() => compile(`let value: unknown = 0; value = eval("1");`)).toThrow(
      "spec.ts:1:33 tla-ts can't run eval",
    );
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

  describe("converts the value that a String.prototype method reads through call", () => {
    it("agrees with Node", async () => {
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
    });

    it("agrees with Node (2)", async () => {
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
    });

    it("rejects wrong expectation 1", async () => {
      const nullish = await checkModel(
        `const box = { size: 0 };\nconst value: number | undefined = undefined;\nconst trimmed = String.prototype.trim.call(value);`,
      );
      expect(nullish.failure?.message).toContain("TypeError");
    });
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

  it("runs Object.prototype.toString that a script stores under a key", async () => {
    const stored = (expected: string) => `
      const object: { getClass?: () => string } = {};
      object.getClass = Object.prototype.toString;
      const list = [0, 1];
      // @ts-ignore
      list.getClass = Object.prototype.toString;
      // @ts-ignore
      const kinds = object.getClass() + list.getClass();
      if (kinds !== "${expected}") throw new Error(kinds);
    `;
    expect((await check(compile(stored("[object Object][object Array]")))).failure).toBeUndefined();
    expect(
      (await check(compile(stored("[object Object][object Object]")))).failure?.message,
    ).toContain("[object Object][object Array]");
  });

  it("runs the array methods that a script stores under a key of an object", async () => {
    const stored = (expected: string) => `
      type Method = (...args: unknown[]) => unknown;
      const object: { [key: string | symbol]: unknown } = {};
      object.push = Array.prototype.push;
      object.pop = Array.prototype.pop;
      object.shift = Array.prototype.shift;
      object.unshift = Array.prototype.unshift;
      object.reverse = Array.prototype.reverse;
      object.join = Array.prototype.join;
      const pushed = (object.push as Method)("a", "b", "c");
      const popped = (object.pop as Method)();
      const unshifted = (object.unshift as Method)("z");
      const shifted = (object.shift as Method)();
      object[4] = "e";
      object.length = 6;
      const reversed = (object.reverse as Method)();
      const joined = (object.join as Method)("-");
      const result = [pushed, popped, unshifted, shifted, reversed === object, joined].join(" ");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await check(compile(stored("3 c 3 z true -e---b-a")))).failure).toBeUndefined();
    expect((await check(compile(stored("3 c 3 z true -e--b-a")))).failure?.message).toContain(
      "3 c 3 z true -e---b-a",
    );
  });

  it("runs the array methods that an object inherits from an array that is its prototype", async () => {
    const inherited = (expected: string) => `
      type Method = (...args: unknown[]) => unknown;
      type Made = new () => { [key: string | symbol]: unknown };
      function Holder() {}
      Holder.prototype = new Array(1, 2, 3);
      function Letters() {}
      Letters.prototype = ["a", "b", "c"];
      const numbers = new (Holder as unknown as Made)();
      numbers.length = 2;
      const letters = new (Letters as unknown as Made)();
      letters.length = 3;
      const every = (numbers.every as Method)((value: number) => value < 3);
      const some = (numbers.some as Method)((value: number) => value > 2);
      const sum = (numbers.reduce as Method)((total: number, value: number) => total + value, 10);
      const joined = (letters.join as Method)("-");
      const result = [every, some, sum, joined].join(" ");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await check(compile(inherited("true false 13 a-b-c")))).failure).toBeUndefined();
    expect((await check(compile(inherited("true false 16 a-b-c")))).failure?.message).toContain(
      "true false 13 a-b-c",
    );
  });

  it("runs an inherited array method whose callback counts its calls", async () => {
    const counted = (expected: string) => `
      type Method = (...args: unknown[]) => unknown;
      type Made = new () => { [key: string | symbol]: unknown };
      function Holder() {}
      Holder.prototype = new Array(1, 2, 3);
      const numbers = new (Holder as unknown as Made)();
      numbers.length = 2;
      let total = 0;
      let calls = 0;
      (numbers.forEach as Method)((value: number) => {
        calls++;
        total += value;
      });
      const every = (numbers.every as Method)((value: number) => {
        calls++;
        return value < 2;
      });
      const result = total + " " + every + " " + calls;
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await check(compile(counted("3 false 4")))).failure).toBeUndefined();
    expect((await check(compile(counted("3 false 3")))).failure?.message).toContain("3 false 4");
  });

  it("stops where an object's key holds another method than the one it inherits", async () => {
    const result = await check(
      compile(`
        type Method = (...args: unknown[]) => unknown;
        type Made = new () => { [key: string | symbol]: unknown };
        function Holder() {}
        Holder.prototype = new Array(1, 2, 3);
        const numbers = new (Holder as unknown as Made)();
        numbers.forEach = Array.prototype.map;
        let calls = 0;
        (numbers.forEach as Method)(() => {
          calls++;
        });
        if (calls !== 3) throw new Error(String(calls));
      `),
    );
    expect(result.failure?.message).toContain("tla-ts can't tell which function this call runs");
  });

  it("throws where an inherited reduce has no initial value and no element", async () => {
    const empty = (expected: string) => `
      type Method = (...args: unknown[]) => unknown;
      type Made = new () => { [key: string | symbol]: unknown };
      function Holder() {}
      Holder.prototype = new Array(1, 2, 3);
      const numbers = new (Holder as unknown as Made)();
      numbers.length = 0;
      let thrown = "none";
      try {
        (numbers.reduce as Method)((total: number, value: number) => total + value);
      } catch (error) {
        thrown = error instanceof TypeError ? "TypeError" : "other";
      }
      const seeded = (numbers.reduceRight as Method)((total: number, value: number) => total + value, 7);
      const result = thrown + " " + seeded;
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await check(compile(empty("TypeError 7")))).failure).toBeUndefined();
    expect((await check(compile(empty("none 7")))).failure?.message).toContain("TypeError 7");
  });

  it("stops where a key that stores an array method holds another function", async () => {
    const result = await check(
      compile(`
        const object: { [key: string | symbol]: unknown } = {};
        object.pop = Array.prototype.pop;
        object.pop = Array.prototype.sort;
        (object.pop as (...args: unknown[]) => unknown)();
      `),
    );
    expect(result.failure?.message).toContain("tla-ts can't tell which function this call runs");
  });

  it("holds the array that a method makes where a script gives it a property", async () => {
    const made = (expected: number) => `
      const list = [0, 1, 2, 3];
      const removed = list.splice(1, 2);
      // @ts-ignore
      removed.tag = "removed";
      const copied = list.slice(1);
      // @ts-ignore
      copied.tag = "copied";
      const joined = list.concat([4]);
      // @ts-ignore
      joined.tag = "joined";
      // @ts-ignore
      if (removed.tag + copied.tag + joined.tag !== "removedcopiedjoined") throw new Error("tag");
      if (removed.length !== 2 || removed[0] !== 1 || removed[1] !== 2) throw new Error("removed");
      if (copied.length !== 1 || copied[0] !== 3 || joined[2] !== 4) throw new Error("copied");
      if (list.length !== ${expected} || list[1] !== 3) throw new Error("list");
    `;
    expect((await check(compile(made(2)))).failure).toBeUndefined();
    expect((await check(compile(made(4)))).failure?.message).toContain("list");
  });

  it("spreads into concat an array that the heap holds or an object that says to", async () => {
    const getSource = (expected: string) => `
      const held: number[] = [1, 2];
      Object.defineProperty(held, "extra", { value: 1 });
      const item: { [key: symbol]: unknown } = {};
      const plain: unknown[] = ([0] as unknown[]).concat(item);
      item[Symbol.isConcatSpreadable] = true;
      const spread: unknown[] = ([0] as unknown[]).concat(item);
      const outcomes = [[0].concat(held).length, plain.length, spread.length].join(",");
      if (outcomes !== "${expected}") throw new Error("outcomes " + outcomes);
    `;
    expect((await checkModel(getSource("3,2,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("2,2,2"))).failure?.message).toContain("outcomes 3,2,1");
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

  it("reads this in an arrow function of a static field or block as the class", async () => {
    const source = `
      const box = { seen: 0 };
      class C {
        static f = () => this;
        static g: () => unknown;
        static {
          C.g = () => this;
        }
      }
      class D extends C {}
      if (C.f() !== C || C.g() !== C || D.f() !== C) throw new Error("this");
      box.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("D.f() !== C", "D.f() !== D");
    expect((await checkModel(wrong)).failure?.message).toContain('"this"');
  });

  it("reads this in an arrow function of a class expression's static field as the variable's class", async () => {
    const source = `
      const box = { seen: 0 };
      var C = class {
        static f = () => this;
      };
      const D = class extends C {};
      if (C.f() !== C || D.f() !== C) throw new Error("this");
      box.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("D.f() !== C", "D.f() !== D");
    expect((await checkModel(wrong)).failure?.message).toContain('"this"');
  });

  it("stops on this in a class expression's static field that a static block calls", () => {
    expect(() =>
      compile(`
        const box = { seen: 0 };
        var C = class {
          static f = () => this;
          static { box.seen = this.f() === undefined ? 2 : 1; }
        };
      `),
    ).toThrow("spec.ts:4:28 Unsupported expression: this");
  });

  it("reads a module's this as undefined, and stops on a script's", async () => {
    const source = `
      const box = { seen: 0 };
      const read = () => this;
      const value: unknown = await this;
      if (value !== undefined || read() !== undefined || typeof this !== "undefined") throw new Error("this");
      box.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace("value !== undefined ||", "value === undefined ||");
    expect((await checkModel(wrong)).failure?.message).toContain('"this"');
    expect(() =>
      compile(
        "const box = { seen: 0 };\nconst read = () => this;\nif (read() !== undefined) box.seen = 1;",
      ),
    ).toThrow("spec.ts:2:20 Unsupported expression: this");
  });

  it("runs a call that makes an object before a declaration reads it through another call", async () => {
    const source = `
      const box = { seen: 0 };
      const value = Object.getOwnPropertyDescriptor(
        (function () {
          return { a: 1 };
        })(),
        "a",
      )!.value;
      if (value !== 1) throw new Error("value");
      const thrower = Object.getOwnPropertyDescriptor(
        (function () {
          "use strict";
          return arguments;
        })(),
        "callee",
      )!.get;
      const caller = Object.getOwnPropertyDescriptor(Function.prototype, "caller")!.get;
      if (thrower !== caller) throw new Error("thrower");
      box.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const value = source.replace("value !== 1", "value !== 2");
    expect((await checkModel(value)).failure?.message).toContain('"value"');
    const thrower = source.replace("thrower !== caller", "thrower === caller");
    expect((await checkModel(thrower)).failure?.message).toContain('"thrower"');
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

  describe("compares, writes, and truncates the fractions that literals give", () => {
    it("agrees with Node", async () => {
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
    });

    it("agrees with Node (2)", async () => {
      const converted = await checkModel(`
      const object = {};
      if (parseFloat("2.5") !== 2.5 || JSON.parse("-0.5") !== -0.5 || +"1.5" !== 1.5) {
        throw new Error("fraction");
      }
      if (!Number.isNaN(Number("abc")) || Number("-Infinity") !== -Infinity) throw new Error("special");
    `);
      expect(converted.failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      const sum = await checkModel(`
      const object = {};
      const sum = 0.1 + 0.2;
      if (sum === 0.3) throw new Error("missed");
    `);
      expect(sum.failure?.message).toContain("tla-ts can't add fractions");
    });
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

  describe("disposes a block's resources last first as it leaves the block", () => {
    const getSource = (statements: string, expected: string) => `
      const order: string[] = [];
      const make = (name: string) => ({
        name,
        [Symbol.dispose]() {
          order.push(this.name);
        },
      });
      ${statements}
      if (order.join() !== "${expected}") throw new Error(order.join());
    `;
    const block = `{
        using first = make("a"), second = make("b");
        using third = make("c");
        using nothing = null;
        order.push("body");
      }`;
    const exits = `const run = (): number => {
        using held = make("run");
        return 1;
      };
      if (run() !== 1) throw new Error("result");
      for (let step = 0; step < 3; step++) {
        using held = make(String(step));
        if (step === 1) break;
      }
      let index = 0;
      for (using held = make("for"); index < 2; index++) order.push("loop");`;

    it("agrees with Node on body,c,b,a", async () => {
      const result = await checkModel(getSource(block, "body,c,b,a"));
      expect(result.failure).toBeUndefined();
    });

    it("rejects the expectation body,a,b,c", async () => {
      const wrong = await checkModel(getSource(block, "body,a,b,c"));
      expect(wrong.failure?.message).toContain("body,c,b,a");
    });

    it("agrees with Node on run,0,1,loop,loop,for where a function returns and loops leave", async () => {
      const result = await checkModel(getSource(exits, "run,0,1,loop,loop,for"));
      expect(result.failure).toBeUndefined();
    });

    it("rejects the expectation run,0,1,for,loop,loop", async () => {
      const wrong = await checkModel(getSource(exits, "run,0,1,for,loop,loop"));
      expect(wrong.failure?.message).toContain("run,0,1,loop,loop,for");
    });
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
      if (order.join() !== "${expected}") throw new Error(order.join());
    `;
    const result = await checkModel(source("body,a,body,b,body,c"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("body,body,a,b,body,c"));
    expect(wrong.failure).toBeDefined();
  });

  it("disposes what a for-of's using declaration holds where its body returns", async () => {
    const source = (expected: string) => `
      const order: string[] = [];
      const resources = [{ [Symbol.dispose]() { order.push("disposed"); } }];
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
    const result = await checkModel(source("run,disposed"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("disposed,run"));
    expect(wrong.failure).toBeDefined();
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

  describe("runs a DisposableStack's methods, disposing last first", () => {
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

    it("agrees with Node on disposed,defer,adopt x,use", async () => {
      const result = await checkModel(source("disposed,defer,adopt x,use"));
      expect(result.failure).toBeUndefined();
    });

    it("rejects the expectation disposed,use,adopt x,defer", async () => {
      const wrong = await checkModel(source("disposed,use,adopt x,defer"));
      expect(wrong.failure?.message).toContain("disposed,defer,adopt x,use");
    });
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

  it("disposes the AsyncDisposableStack that an await using declaration holds", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const run = async () => {
        {
          await using stack = new AsyncDisposableStack();
          stack.defer(() => { order.push("defer"); });
        }
        order.push("after");
      };
      run();
      order.push("called");
      Promise.resolve()
        .then(() => order.push("tick 1"))
        .then(() => order.push("tick 2"));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("defer,called,tick 1,after,tick 2"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("defer,called,after,tick 1,tick 2"));
    expect(wrong.failure).toBeDefined();
  });

  it("awaits once as it disposes the DisposableStack that an await using declaration holds", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const run = async () => {
        {
          await using stack = new DisposableStack();
          stack.defer(() => { order.push("defer"); });
        }
        order.push("after");
      };
      run();
      order.push("called");
      Promise.resolve()
        .then(() => order.push("tick 1"))
        .then(() => order.push("tick 2"));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("defer,called,after,tick 1,tick 2"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("defer,called,tick 1,after,tick 2"));
    expect(wrong.failure).toBeDefined();
  });

  it("awaits the async dispose method of what an AsyncDisposableStack uses, as Node does", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const stack = new AsyncDisposableStack();
      stack.use({ async [Symbol.asyncDispose]() { order.push("async"); } });
      stack.disposeAsync().then(() => order.push("done"));
      order.push("after call");
      Promise.resolve()
        .then(() => order.push("tick 1"))
        .then(() => order.push("tick 2"));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("async,after call,tick 1,done,tick 2"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("async,after call,done,tick 1,tick 2"));
    expect(wrong.failure).toBeDefined();
  });

  it("awaits each function and resource that an AsyncDisposableStack disposes, as Node does", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const stack = new AsyncDisposableStack();
      stack.use({ [Symbol.dispose]() { order.push("sync"); } });
      stack.defer(() => { order.push("defer"); });
      stack.disposeAsync();
      order.push("after call");
      Promise.resolve().then(() => order.push("tick 1"));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("defer,after call,sync,tick 1"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("defer,sync,after call,tick 1"));
    expect(wrong.failure).toBeDefined();
  });

  it("awaits once for null that an AsyncDisposableStack uses, as Node does", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const stack = new AsyncDisposableStack();
      stack.use(null);
      stack.disposeAsync().then(() => order.push("done"));
      Promise.resolve()
        .then(() => order.push("tick 1"))
        .then(() => order.push("tick 2"));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("tick 1,done,tick 2"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("done,tick 1,tick 2"));
    expect(wrong.failure).toBeDefined();
  });

  it("fulfills disposeAsync's promise with undefined once the AsyncDisposableStack is disposed", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const stack = new AsyncDisposableStack();
      stack.defer(() => { order.push("defer"); });
      stack.disposeAsync().then((value) => order.push(\`done \${value} \${stack.disposed}\`));
      order.push("after call");
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("defer,after call,done undefined true"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("defer,after call,done undefined false"));
    expect(wrong.failure).toBeDefined();
  });

  describe("awaits what an await using declaration disposes, as Node does", () => {
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

    it("agrees with Node", async () => {
      const result = await checkModel(source(expected));
      expect(result.failure).toBeUndefined();
    });

    it("rejects wrong expectation 1", async () => {
      const wrong = await checkModel(source(expected.replace("left,async", "async,left")));
      expect(wrong.failure).toBeDefined();
    });
  });

  it("runs a dispose method that reads the locals of the async call that made it", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let result = "";
      const asyncTest = (body: () => Promise<void>) => {
        body();
      };
      asyncTest(async () => {
        const disposed: unknown[] = [];
        const first = { async [Symbol.asyncDispose]() { disposed.push(this); } };
        const second = { [Symbol.dispose]() { disposed.push(this); } };
        {
          await using _1 = first;
          await using _2 = second;
        }
        result = [disposed[0] === second, disposed[1] === first, disposed.length].join();
      });
      setTimeout(() => {
        if (result !== "${expected}") throw new Error(result);
      });
    `;
    const result = await checkModel(source("true,true,2"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("false,true,2"));
    expect(wrong.failure).toBeDefined();
  });

  it("stops where a method runs in a call other than the one that made it", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let kept: AsyncDisposable | undefined;
      let count = 0;
      const run = async (isFirst: boolean) => {
        const label = isFirst ? "first" : "second";
        const resource = { async [Symbol.asyncDispose]() { count += label === "first" ? 1 : 10; } };
        if (isFirst) {
          kept = resource;
          return;
        }
        if (kept !== undefined) {
          await using _ = kept;
        }
      };
      run(true);
      run(false);
      setTimeout(() => {
        if (count !== 1) throw new Error(String(count));
      });
    `);
    expect(result.failure?.message).toContain("tla-ts can't call a method here");
  });

  it("runs an arrow that defer takes, which may change the locals of the async call that made it", async () => {
    const source = (expected: string) => `
      const order: string[] = [];
      const run = async (name: string) => {
        let count = 0;
        {
          using stack = new DisposableStack();
          stack.defer(() => { count += 1; });
        }
        order.push(\`\${name} \${count}\`);
      };
      run("a");
      run("b");
      if (order.join() !== "${expected}") throw new Error(order.join());
    `;
    const result = await checkModel(source("a 1,b 1"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("a 1,b 2"));
    expect(wrong.failure).toBeDefined();
  });

  it("runs a function that adopt takes, which may change the locals of the async call that made it", async () => {
    const source = (expected: string) => `
      const order: string[] = [];
      const run = async (name: string) => {
        let count = 0;
        {
          using stack = new DisposableStack();
          stack.adopt(10, function (value) { count += value; });
        }
        order.push(\`\${name} \${count}\`);
      };
      run("a");
      run("b");
      if (order.join() !== "${expected}") throw new Error(order.join());
    `;
    const result = await checkModel(source("a 10,b 10"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("a 10,b 20"));
    expect(wrong.failure).toBeDefined();
  });

  it("runs an async function that an AsyncDisposableStack defers, which changes the locals of the async call that made it", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let result = "";
      const run = async (isUsed: boolean) => {
        if (!isUsed) return;
        const stack = new AsyncDisposableStack();
        let isDisposed = false;
        stack.defer(async () => {
          isDisposed = true;
        });
        await stack.disposeAsync();
        result = String(isDisposed);
      };
      run(true);
      run(false);
      setTimeout(() => {
        if (result !== "${expected}") throw new Error(result);
      });
    `;
    const result = await checkModel(source("true"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("false"));
    expect(wrong.failure).toBeDefined();
  });

  it("resumes a function that an AsyncDisposableStack defers with the locals that its async call changed meanwhile", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const run = async (isUsed: boolean) => {
        if (!isUsed) return;
        const stack = new AsyncDisposableStack();
        let count = 0;
        stack.defer(async () => {
          await 0;
          count += 1;
        });
        const disposing = stack.disposeAsync();
        count = 10;
        order.push(\`before \${count}\`);
        await disposing;
        order.push(\`after \${count}\`);
      };
      run(true);
      run(false);
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("before 10,after 11"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("before 10,after 10"));
    expect(wrong.failure).toBeDefined();
  });

  it("runs a thenable's then that changes the locals of the async call that made it", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const log: string[] = [];
      const run = async (tag: string) => {
        let counter = 0;
        const thenable = {
          then(resolve: (value: string) => void) {
            counter++;
            resolve(tag);
          },
        };
        const value = await thenable;
        counter += 10;
        log.push(\`\${value}:\${counter}\`);
      };
      run("a");
      run("b");
      setTimeout(() => {
        if (log.join() !== "${expected}") throw new Error(log.join());
      });
    `;
    expect((await checkModel(source("a:11,b:11"))).failure).toBeUndefined();
    expect((await checkModel(source("a:10,b:10"))).failure).toBeDefined();
  });

  it("runs the then of a thenable that Array.fromAsync awaits, which reads the locals of its maker", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let result = "";
      const check = async (body: () => Promise<void>) => {
        await body();
      };
      check(async function () {
        let counter = 0;
        const expected = {};
        const thenable = {
          then(resolve: (value: object) => void) {
            counter++;
            resolve(expected);
          },
        };
        const input = [thenable].values();
        const output = await Array.fromAsync(input as Iterable<PromiseLike<object>>);
        result = \`\${output[0] === expected}:\${counter}\`;
      });
      setTimeout(() => {
        if (result !== "${expected}") throw new Error(result);
      });
    `;
    expect((await checkModel(source("true:1"))).failure).toBeUndefined();
    expect((await checkModel(source("true:0"))).failure).toBeDefined();
  });

  it("keeps the locals of each async call apart, where AsyncDisposableStacks run their functions in turns", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const run = async (name: string) => {
        const stack = new AsyncDisposableStack();
        let count = 0;
        stack.defer(async () => {
          await 0;
          count += 1;
          order.push(\`\${name}\${count}\`);
        });
        await stack.disposeAsync();
        order.push(\`\${name} after \${count}\`);
      };
      run("a");
      run("b");
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("a1,b1,a after 1,b after 1"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("a1,b1,a after 1,b after 2"));
    expect(wrong.failure).toBeDefined();
  });

  it("keeps what a function that disposeAsync runs after it awaits pushes to an array of the async call around it", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let result = "";
      const run = async () => {
        const log: string[] = [];
        const stack = new AsyncDisposableStack();
        stack.defer(() => {
          log.push("sync");
        });
        stack.defer(async () => {
          log.push("async");
        });
        await stack.disposeAsync();
        result = log.join();
      };
      run();
      setTimeout(() => {
        if (result !== "${expected}") throw new Error(result);
      });
    `;
    const result = await checkModel(source("async,sync"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("async"));
    expect(wrong.failure).toBeDefined();
  });

  it("keeps what a function pushes to an array of the async call that made it, where another async function disposes its stack", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let result = "";
      const dispose = async (stack: AsyncDisposableStack) => {
        await stack.disposeAsync();
      };
      const run = async () => {
        const log: string[] = [];
        const stack = new AsyncDisposableStack();
        stack.defer(() => {
          log.push("sync");
        });
        stack.defer(async () => {
          log.push("async");
        });
        await dispose(stack);
        result = log.join();
      };
      run();
      setTimeout(() => {
        if (result !== "${expected}") throw new Error(result);
      });
    `;
    const result = await checkModel(source("async,sync"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("async"));
    expect(wrong.failure).toBeDefined();
  });

  it("keeps what an async function pushes after it awaits to an array of the async call that made it", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let result = "";
      const run = async () => {
        const log: string[] = [];
        const helper = async () => {
          await 0;
          log.push("helper");
        };
        const pending = helper();
        log.push("run");
        await pending;
        result = log.join();
      };
      run();
      setTimeout(() => {
        if (result !== "${expected}") throw new Error(result);
      });
    `;
    const result = await checkModel(source("run,helper"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("run"));
    expect(wrong.failure).toBeDefined();
  });

  it("keeps what an async function that a call declares and calls by name changes after it awaits", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const order: string[] = [];
      const run = async (name: string) => {
        let count = 0;
        async function bump() {
          await 0;
          count += 1;
        }
        const pending = bump();
        count += 10;
        await pending;
        order.push(\`\${name} \${count}\`);
      };
      run("a");
      run("b");
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    const result = await checkModel(source("a 11,b 11"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("a 11,b 12"));
    expect(wrong.failure).toBeDefined();
  });

  it("calls the dispose method that a getter returns, as a DisposableStack disposes", async () => {
    const source = (expected: string) => `
      const resource = {
        disposed: false,
        get [Symbol.dispose]() {
          return function (this: { disposed: boolean }) {
            this.disposed = true;
          };
        },
      };
      const stack = new DisposableStack();
      stack.use(resource);
      stack.dispose();
      if (String(resource.disposed) !== "${expected}") throw new Error(String(resource.disposed));
    `;
    const result = await checkModel(source("true"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("false"));
    expect(wrong.failure).toBeDefined();
  });

  it("reads the dispose getter of what a using declaration holds once", async () => {
    const source = (expected: number) => `
      let count = 0;
      const resource = {
        get [Symbol.dispose]() {
          count += 1;
          return function () {};
        },
      };
      {
        using held = resource;
      }
      if (count !== ${expected}) throw new Error(String(count));
    `;
    const result = await checkModel(source(1));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source(2));
    expect(wrong.failure).toBeDefined();
  });

  it("awaits the async function that an asyncDispose getter returns, as an AsyncDisposableStack disposes", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let count = 0;
      const resource = {
        disposed: false,
        get [Symbol.asyncDispose]() {
          count += 1;
          return async function (this: { disposed: boolean }) {
            this.disposed = true;
          };
        },
      };
      const run = async () => {
        const stack = new AsyncDisposableStack();
        stack.use(resource);
        await stack.disposeAsync();
      };
      run();
      setTimeout(() => {
        const result = \`\${resource.disposed} \${count}\`;
        if (result !== "${expected}") throw new Error(result);
      });
    `;
    const result = await checkModel(source("true 1"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("false 1"));
    expect(wrong.failure).toBeDefined();
  });

  it("runs a DisposableStack's dispose that Function.prototype.call runs, which throws a TypeError for another this", async () => {
    const source = (expected: string) => `
      const dispose: (this: unknown) => void = DisposableStack.prototype.dispose;
      const results: string[] = [];
      const stack = new DisposableStack();
      try {
        dispose.call(1);
      } catch (error) {
        results.push(error instanceof TypeError ? "TypeError" : "other");
      }
      dispose.call(stack);
      results.push(String(stack.disposed));
      if (results.join() !== "${expected}") throw new Error(results.join());
    `;
    const result = await checkModel(source("TypeError,true"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("TypeError,false"));
    expect(wrong.failure).toBeDefined();
  });

  it("throws a TypeError where move runs on a stack of the other kind", async () => {
    const source = (expected: string) => `
      const move: (this: unknown) => DisposableStack = DisposableStack.prototype.move;
      const results: string[] = [];
      const asyncStack = new AsyncDisposableStack();
      const other = new DisposableStack();
      const attempt = (receiver: unknown) => {
        try {
          move.call(receiver);
          results.push("ok");
        } catch (error) {
          results.push(error instanceof TypeError ? "TypeError" : "other");
        }
      };
      attempt(DisposableStack.prototype);
      attempt(asyncStack);
      attempt(other);
      if (results.join() !== "${expected}") throw new Error(results.join());
    `;
    const result = await checkModel(source("TypeError,TypeError,ok"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("TypeError,ok,ok"));
    expect(wrong.failure).toBeDefined();
  });

  it("rejects the promise of a disposeAsync that Function.prototype.call runs on another this", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const disposeAsync: (this: unknown) => Promise<void> = AsyncDisposableStack.prototype.disposeAsync;
      const results: string[] = [];
      const other = new DisposableStack();
      const run = async () => {
        try {
          await disposeAsync.call(other);
          results.push("ok");
        } catch (error) {
          results.push(error instanceof TypeError ? "TypeError" : "other");
        }
        const stack = new AsyncDisposableStack();
        await disposeAsync.call(stack);
        results.push(String(stack.disposed));
      };
      run();
      setTimeout(() => {
        if (results.join() !== "${expected}") throw new Error(results.join());
      });
    `;
    const result = await checkModel(source("TypeError,true"));
    expect(result.failure).toBeUndefined();
    const wrong = await checkModel(source("ok,true"));
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

  it("awaits unknown parameters that numbers and a promise pass", async () => {
    const result = await checkModel(`
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const make = (): unknown => Promise.resolve(7);
      async function echo(value: unknown) {
        return await value;
      }
      async function run(value: unknown) {
        const got = await echo(value);
        log += String(got);
      }
      run(1);
      run(2);
      run(3);
      run(4);
      run(5);
      run(make());
      setTimeout(() => {
        if (log !== "123457") throw new Error(log);
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

  describe("runs Array.fromAsync of the values() of an array of promises that Promise.resolve makes", () => {
    const getSource = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let log = "";
      const input = [0, Promise.resolve(1)].values();
      Array.fromAsync(input).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      Promise.resolve()
        .then(() => { log += "0"; })
        .then(() => { log += "1"; })
        .then(() => { log += "2"; })
        .then(() => { log += "3"; })
        .then(() => { log += "4"; });
      setTimeout(() => {
        if (log !== "${expected}") throw new Error(log);
      });
    `;

    it("settles after the jobs that Node runs first", async () => {
      expect((await checkModel(getSource("01234[0,1]"))).failure).toBeUndefined();
    });

    it("doesn't settle a job sooner", async () => {
      expect((await checkModel(getSource("0123[0,1]4"))).failure).toBeDefined();
    });
  });

  describe("call an executor's resolve that a variable holds through a non-null assertion", () => {
    const getSource = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let log = "";
      let resolve: ((value: number) => void) | undefined;
      const promise = new Promise<number>((innerResolve) => {
        resolve = innerResolve;
      });
      promise.then((value) => { log += value; });
      resolve!(45);
      setTimeout(() => {
        if (log !== "${expected}") throw new Error(log);
      });
    `;

    it("fulfills the promise with the value", async () => {
      expect((await checkModel(getSource("45"))).failure).toBeUndefined();
    });

    it("doesn't fulfill it with another value", async () => {
      expect((await checkModel(getSource("44"))).failure).toBeDefined();
    });
  });

  describe("convert a value that TypeScript types as any to a number", () => {
    const getSource = (expected: string) => `
      const made = new String("1");
      let x: any = "x";
      x *= 1;
      let y: any = made;
      y *= 2;
      let z: any = null;
      const result = [isNaN(x), isNaN(y), isNaN(z)].join();
      if (result !== "${expected}") throw new Error(result);
    `;

    it("tests whether each is NaN", async () => {
      expect((await checkModel(getSource("true,false,false"))).failure).toBeUndefined();
    });

    it("doesn't take null for NaN", async () => {
      expect((await checkModel(getSource("true,false,true"))).failure).toBeDefined();
    });

    it("stops at an array or a function, which it can't convert", async () => {
      const getStop = async (value: string) =>
        (
          await checkModel(`
            const made = new String("1");
            let x: any = ${value};
            if (isNaN(x)) throw new Error("NaN");
          `)
        ).failure?.message;
      expect(await getStop("[5]")).toContain("tla-ts can't convert this object to a number");
      expect(await getStop("() => 1")).toContain("tla-ts can't convert this function to a number");
    });
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

  describe("runs Array.fromAsync of an array-like object and of a string", () => {
    const getSource = (call: string, expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let log = "";
${call}
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
        if (log !== "${expected}") throw new Error(log);
      });
    `;

    it("maps an array-like object's values, awaiting each", async () => {
      const call = `
      const items = { length: 2, 0: 1, 1: Promise.resolve(2) };
      Array.fromAsync(items, (value: number, k: number) => {
        log += "m";
        return value * 10 + k;
      }).then((values) => {
        log += "[" + values.join(",") + "]";
      });
      `;
      expect((await checkModel(getSource(call, "m01m23[10,21]45"))).failure).toBeUndefined();
    });

    it("takes a string's characters", async () => {
      const call = `
      Array.fromAsync("ab").then((values) => {
        log += "(" + values.join(",") + ")";
      });
      `;
      expect((await checkModel(getSource(call, "012345(a,b)"))).failure).toBeUndefined();
    });

    it("rejects where an array-like object's value rejects", async () => {
      const call = `
      Array.fromAsync({ length: 1, 0: Promise.reject("r") }).catch((error) => {
        log += "<" + String(error) + ">";
      });
      `;
      expect((await checkModel(getSource(call, "0<r>12345"))).failure).toBeUndefined();
    });
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

  it("tells whether a promise's reason is an instance of an error by its prototypes", async () => {
    const getInheritedSource = (expected: string) => `
      let seen = "";
      const reason: object = Object.create(TypeError.prototype);
      await Promise.reject(reason).catch((error) => {
        seen = [error instanceof TypeError, error instanceof RangeError, error instanceof Error].join(
          "+",
        );
      });
      if (seen !== "${expected}") throw new Error(seen);
    `;
    expect((await checkModel(getInheritedSource("true+false+true"))).failure).toBeUndefined();
    expect((await checkModel(getInheritedSource("false+false+true"))).failure?.message).toContain(
      "true+false+true",
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

  it("yields each element of an array that a variable holds, which yield* takes", async () => {
    const source = (expected: string) => `
      let values = [1, 2, 3];
      values = [4, 5];
      function* gen() {
        yield* values;
        return "done";
      }
      const iterator = gen();
      const first = iterator.next();
      const second = iterator.next();
      const third = iterator.next();
      const log = \`\${first.value},\${second.value},\${third.value},\${third.done}\`;
      if (log !== "${expected}") throw new Error(log);
    `;
    expect((await checkModel(source("4,5,done,true"))).failure).toBeUndefined();
    expect((await checkModel(source("4,5,undefined,true"))).failure).toBeDefined();
  });

  it("passes on what a generator that a call makes yields through yield*", async () => {
    const source = (expected: string) => `
      let log = "";
      function* inner() {
        log += "i";
        yield 1;
        yield 2;
        return 9;
      }
      function* outer() {
        yield* inner();
        log += "o";
        yield 3;
      }
      const iterator = outer();
      const a = iterator.next();
      const b = iterator.next();
      const c = iterator.next();
      const d = iterator.next();
      log += \`\${a.value}\${b.value}\${c.value}\${d.done}\`;
      if (log !== "${expected}") throw new Error(log);
    `;
    expect((await checkModel(source("io123true"))).failure).toBeUndefined();
    expect((await checkModel(source("i123true"))).failure).toBeDefined();
  });

  it("passes on what nested yield*s give from a generator that a variable holds", async () => {
    const source = (expected: string) => `
      function* leaf() {
        yield* [1, 2];
      }
      const held = leaf();
      function* middle() {
        yield* held;
        yield* held;
      }
      function* top() {
        yield* middle();
        yield 3;
      }
      const iterator = top();
      const a = iterator.next();
      const b = iterator.next();
      const c = iterator.next();
      const d = iterator.next();
      const log = \`\${a.value}\${b.value}\${c.value}\${d.done}\`;
      if (log !== "${expected}") throw new Error(log);
    `;
    expect((await checkModel(source("123true"))).failure).toBeUndefined();
    await expect(checkModel(source("123false"))).rejects.toThrow("123true");
  });

  it("throws what a generator that yield* runs throws to the try around the yield*", async () => {
    const source = (expected: string) => `
      let log = "";
      function* inner() {
        yield 1;
        throw new Error("boom");
      }
      function* outer() {
        try {
          yield* inner();
        } catch (error) {
          log += "caught";
        }
        yield 2;
      }
      const iterator = outer();
      const a = iterator.next();
      const b = iterator.next();
      log += \`\${a.value}\${b.value}\`;
      if (log !== "${expected}") throw new Error(log);
    `;
    expect((await checkModel(source("caught12"))).failure).toBeUndefined();
    expect((await checkModel(source("12"))).failure).toBeDefined();
  });

  it("stops where yield* takes more elements of an array that a variable holds than it follows", async () => {
    const result = await checkModel(`
      let values = [1, 2, 3, 4, 5];
      function* gen() {
        yield* values;
      }
      const iterator = gen();
      const first = iterator.next();
      const second = iterator.next();
      const third = iterator.next();
      const fourth = iterator.next();
      if (fourth.value !== 4) throw new Error("fourth");
    `);
    expect(result.failure?.message).toContain("tla-ts can't follow more than 3 values of a yield*");
  });

  it("awaits the promises of an array that a variable holds, which an async yield* takes", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let values: (number | Promise<number>)[] = [];
      values = [Promise.resolve(1), 2];
      const order: string[] = [];
      async function* gen() {
        yield* values;
        order.push("end");
      }
      const iterator = gen();
      iterator.next().then((first) => {
        order.push(\`a\${first.value}\`);
        iterator.next().then((second) => {
          order.push(\`b\${second.value}\`);
          iterator.next().then((third) => order.push(\`c\${third.done}\`));
        });
      });
      Promise.resolve()
        .then(() => order.push("t1"))
        .then(() => order.push("t2"))
        .then(() => order.push("t3"))
        .then(() => order.push("t4"))
        .then(() => order.push("t5"))
        .then(() => order.push("t6"))
        .then(() => order.push("t7"))
        .then(() => order.push("t8"));
      setTimeout(() => {
        if (order.join() !== "${expected}") throw new Error(order.join());
      });
    `;
    expect(
      (await checkModel(source("t1,t2,a1,t3,t4,t5,b2,t6,t7,end,t8,ctrue"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(source("t1,a1,t2,t3,t4,t5,b2,t6,t7,end,t8,ctrue"))).failure,
    ).toBeDefined();
  });

  it("throws the rejection of a promise that an array a variable holds gives an async yield*", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      const error = new Error("boom");
      let values = [Promise.reject(error), "unreachable"];
      let log = "";
      async function* gen() {
        yield* values;
      }
      const iterator = gen();
      iterator.next().then(
        () => { log += "resolved;"; },
        (reason) => {
          log += reason === error ? "rejected;" : "other;";
          iterator.next().then((result) => { log += \`\${result.done}:\${String(result.value)};\`; });
        },
      );
      setTimeout(() => {
        if (log !== "${expected}") throw new Error(log);
      });
    `;
    expect((await checkModel(source("rejected;true:undefined;"))).failure).toBeUndefined();
    expect((await checkModel(source("rejected;false:undefined;"))).failure).toBeDefined();
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

  it("reads a call before a call whose function changes what it reads", async () => {
    const getSource = (expected: string) => `
      let count = 0;
      const getCount = (offset: number) => count + offset;
      function counter() {
        count += 1;
        return count;
      }
      const result = [getCount(0), counter()].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("0,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("1,1"))).failure?.message).toContain("0,1");
  });

  it("reads a map through a call before a call that makes an array", async () => {
    const getSource = (expected: string) => `
      const KINDS = new Map([
        ["A", 1],
        ["B", 2],
      ]);
      const getKind = (name: string) => KINDS.get(name) ?? 0;
      const getRange = (last: string) => Array.from({ length: getKind(last) }, (_, offset) => offset);
      const result = [getKind("B"), ...getRange("A"), ...getRange("B")].join(",");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("2,0,0,1"))).failure).toBeUndefined();
    expect((await checkModel(getSource("2,0,1"))).failure?.message).toContain("2,0,0,1");
  });

  it("runs a call that may throw before a later call that makes an array", async () => {
    const getSource = (first: string) => `
      const KINDS = new Map([
        ["A", 1],
        ["B", 2],
      ]);
      const getKind = (name: string) => {
        const kind = KINDS.get(name);
        if (kind === undefined) throw new Error(\`Unknown kind \${name}\`);
        return kind;
      };
      const getRange = (last: string) => Array.from({ length: getKind(last) }, (_, offset) => offset);
      const values = [getKind("${first}"), ...getRange("A"), ...getRange("Y")];
    `;
    expect((await checkModel(getSource("Z"))).failure?.message).toContain("Unknown kind Z");
    expect((await checkModel(getSource("A"))).failure?.message).toContain("Unknown kind Y");
  });

  it("evaluates where it is a call whose arguments ran first and that may throw", async () => {
    const getSource = (expected: string) => `
      interface Tree { left?: Tree; right?: Tree; hash: number }
      const getPair = (left: Tree, right: Tree) => Math.imul(getHash(left), 5) + getHash(right);
      const getHash = (tree: Tree): number => {
        if (tree.hash > 99) throw new RangeError("big");
        if (tree.left !== undefined && tree.right !== undefined) {
          tree.hash = getPair(tree.left, tree.right);
        }
        return tree.hash;
      };
      const leaf: Tree = { hash: 2 };
      const tree: Tree = { left: leaf, right: { left: leaf, right: { hash: 3 }, hash: 0 }, hash: 0 };
      const result = [getHash(tree), tree.right?.hash].join();
      if (result !== "${expected}") throw new Error(result);
    `;
    expect((await checkModel(getSource("23,13"))).failure).toBeUndefined();
    expect((await checkModel(getSource("23,0"))).failure?.message).toContain("23,13");
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

  it("throws where a nested pattern destructures an element that an array lacks", async () => {
    const getSource = (expected: string) => `
      const values: { x: number }[][] = [[]];
      const read = () => {
        for (const [{ x }] of values) {
          return;
        }
      };
      let caught = "none";
      try {
        read();
      } catch (error) {
        caught = error instanceof TypeError ? "type" : "other";
      }
      if (caught !== "${expected}") throw new Error("caught " + caught);
      const other: { x: number }[][] = [[{ x: 1 }]];
      for (const [{ x }] of other) {
        if (x !== 1) throw new Error("x");
      }
    `;
    expect((await checkModel(getSource("type"))).failure).toBeUndefined();
    expect((await checkModel(getSource("none"))).failure?.message).toContain("caught type");
  });

  describe("destructures an array that the heap holds and gives the array back", () => {
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

    it("agrees with Node", async () => {
      expect((await checkModel(source)).failure).toBeUndefined();
    });

    it.each([
      ["b !== 9", "b !== 2", "values"],
      ["result !== vals", "result === vals", "identity"],
      ["q !== 5", "q !== 2", "declared"],
    ])("rejects replacing %s with %s", async (from, to, message) => {
      expect((await checkModel(source.replace(from, to))).failure?.message).toContain(message);
    });
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

  it("visits the enumerable keys that a function inherits through for-in", async () => {
    const source = `
      const holder = { seen: 0 };
      Object.defineProperty(Function.prototype, "hidden", { value: 1, enumerable: false, configurable: true });
      Object.defineProperty(Function.prototype, "shown", { value: 2, enumerable: true, configurable: true });
      Object.defineProperty(Function.prototype, "name", { value: "x", enumerable: true, configurable: true });
      const made = function () {};
      let keys = "";
      for (const key in made) keys += key + ",";
      if (keys !== "shown,") throw new Error(keys);
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"shown,"', '"name,shown,"');
    expect((await checkModel(wrong)).failure?.message).toContain('"shown,"');
  });

  it("visits an arrow's inherited keys and a function's own keys through for-in", async () => {
    const source = `
      const holder = { seen: 0 };
      Object.defineProperty(Function.prototype, "shown", { value: 2, enumerable: true, configurable: true });
      const arrow = () => 1;
      const defined = function () {};
      Object.defineProperty(defined, "own", { value: 1, enumerable: true, configurable: true });
      let keys = "";
      for (const key in arrow) keys += key + ";";
      for (const key in defined) keys += key + ".";
      if (keys !== "shown;own.shown.") throw new Error(keys);
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('"shown;own.shown."', '"shown;shown."');
    expect((await checkModel(wrong)).failure?.message).toContain('"shown;own.shown."');
  });

  it("visits a built-in object that a variable holds through for-in", async () => {
    const source = `
      const holder = { seen: 0 };
      const json = JSON;
      let keys = "";
      for (const key in json) keys += key;
      if (keys !== "") throw new Error("json");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace('keys !== ""', 'keys !== "parse"');
    expect((await checkModel(wrong)).failure?.message).toContain('"json"');
  });

  it("stops on for-in over a function where it can't tell its own arguments and caller", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      Object.defineProperty(Function.prototype, "caller", { value: 1, enumerable: true, configurable: true });
      const made = function () {};
      let keys = "";
      for (const key in made) keys += key;
      holder.seen = keys.length;
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't tell whether this function has its own arguments and caller",
    );
  });

  it("answers hasOwnProperty on a function that a script makes", async () => {
    const source = `
      const holder = { seen: 0 };
      Object.defineProperty(Function.prototype, "prop", { value: 1, enumerable: true, configurable: true });
      const made = function () {};
      if (made.hasOwnProperty("prop") || !made.hasOwnProperty("prototype") || !made.hasOwnProperty("length")) {
        throw new Error("made");
      }
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(
      '!made.hasOwnProperty("prototype")',
      'made.hasOwnProperty("prototype")',
    );
    expect((await checkModel(wrong)).failure?.message).toContain('"made"');
  });

  it("answers hasOwnProperty on an arrow function that a script makes", async () => {
    const source = `
      const holder = { seen: 0 };
      const arrow = () => 1;
      if (arrow.hasOwnProperty("prototype") || !Object.prototype.hasOwnProperty.call(arrow, "name")) {
        throw new Error("arrow");
      }
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(
      'if (arrow.hasOwnProperty("prototype")',
      'if (!arrow.hasOwnProperty("prototype")',
    );
    expect((await checkModel(wrong)).failure?.message).toContain('"arrow"');
  });

  it("answers propertyIsEnumerable on a function that a script makes", async () => {
    const source = `
      const holder = { seen: 0 };
      Object.defineProperty(Function.prototype, "prop", { value: 1, enumerable: true, configurable: true });
      const made = function () {};
      if (made.propertyIsEnumerable("prop") || made.propertyIsEnumerable("name")) throw new Error("enumerable");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(
      'made.propertyIsEnumerable("name")',
      '!made.propertyIsEnumerable("name")',
    );
    expect((await checkModel(wrong)).failure?.message).toContain('"enumerable"');
  });

  it("answers hasOwnProperty on a key that a script defines on its function", async () => {
    const source = `
      const holder = { seen: 0 };
      const defined = function () {};
      Object.defineProperty(defined, "prop", { value: 2, enumerable: false, configurable: true });
      if (!defined.hasOwnProperty("prop") || defined.propertyIsEnumerable("prop")) throw new Error("defined");
      holder.seen = 1;
    `;
    expect((await checkModel(source)).failure).toBeUndefined();
    const wrong = source.replace(
      '!defined.hasOwnProperty("prop")',
      'defined.hasOwnProperty("prop")',
    );
    expect((await checkModel(wrong)).failure?.message).toContain('"defined"');
  });

  it("stops on hasOwnProperty where it can't tell a function's own arguments and caller", async () => {
    const result = await checkModel(`
      const holder = { seen: 0 };
      const made = function () {};
      if (made.hasOwnProperty("caller")) holder.seen = 1;
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't tell whether this function has its own arguments and caller",
    );
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

  describe("runs a proxy's prototype and extensibility traps and checks what they give", () => {
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

    it("agrees with Node on 6", async () => {
      expect((await checkModel(getSource(6))).failure).toBeUndefined();
    });

    it("rejects the expectation 5", async () => {
      expect((await checkModel(getSource(5))).failure?.message).toContain("unexpected");
    });
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

  describe("runs a proxy's traps on each key that Object's functions read", () => {
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

    it("agrees with Node on 13", async () => {
      expect((await checkModel(getSource(13))).failure).toBeUndefined();
    });

    it("rejects the expectation 10", async () => {
      expect((await checkModel(getSource(10))).failure?.message).toContain("unexpected");
    });
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

  it("tell whether a class matches a lone surrogate that a script holds", async () => {
    const getSource = (operator: string) =>
      `if (${operator}/[^\\u00e0-\\u05ff]/.test("\\ud800")) throw new Error("class");`;
    expect((await checkModel(getSource("!"))).failure).toBeUndefined();
    await expect(checkModel(getSource(""))).rejects.toThrow("class");
  });

  it("tell whether a class matches a character outside ASCII that a script holds", async () => {
    const getSource = (operator: string) =>
      `if (${operator}/[^\\u00e0-\\u05ff]/.test("é")) throw new Error("class");`;
    expect((await checkModel(getSource(""))).failure).toBeUndefined();
    await expect(checkModel(getSource("!"))).rejects.toThrow("class");
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

  it("match a surrogate pair as one character with the u flag", async () => {
    const getSource = (pattern: string) => `
      const found = /./u.exec("😀x");
      if (found === null || found[0] !== "😀" || !${pattern}.test("😀x")) throw new Error("dot");
    `;
    expect((await checkModel(getSource("/^..$/u"))).failure).toBeUndefined();
    await expect(checkModel(getSource("/^...$/u"))).rejects.toThrow("dot");
  });

  it("match the code points that a pattern with the u flag writes, and not half a pair", async () => {
    const getSource = (text: string) => `
      if (/\\udf06/u.test("\\ud834\\udf06") || !/\\udf06/.test("\\ud834\\udf06")) throw new Error("half");
      if (!/^[😀-😂]$/u.test("😁") || /^[^😀]$/u.test("${text}")) throw new Error("class");
    `;
    expect((await checkModel(getSource("😀"))).failure).toBeUndefined();
    await expect(checkModel(getSource("😁"))).rejects.toThrow("class");
  });

  it("advance past a surrogate pair after an empty match with the u flag", async () => {
    const getSource = (pattern: string) => `
      if ("😀😀".split(${pattern}).length !== 2) throw new Error("split");
      if ("😀a".replace(/(?:)/gu, "-") !== "-😀-a-") throw new Error("replace");
    `;
    expect((await checkModel(getSource("/(?:)/u"))).failure).toBeUndefined();
    await expect(checkModel(getSource("/(?:)/"))).rejects.toThrow("split");
  });

  it("set a regexp's lastIndex past a surrogate pair with the u flag", async () => {
    const result = await checkModel(`
      const pattern = /./gu;
      const first = pattern.exec("😀x");
      const afterFirst = pattern.lastIndex;
      const next = pattern.exec("😀x");
      if (first === null || afterFirst !== 2) throw new Error("lastIndex");
      if (next === null || next[0] !== "x" || pattern.lastIndex !== 3) throw new Error("next");
      const record = { pattern };
    `);
    expect(result.failure).toBeUndefined();
  });

  it("stop where a regexp with the u flag matches from inside a surrogate pair", async () => {
    const result = await checkModel(`
      const pattern = /./gu;
      pattern.lastIndex = 1;
      const found = pattern.exec("😀x");
      const record = { pattern };
    `);
    expect(result.failure?.message).toContain(
      "tla-ts can't match from a lastIndex inside a surrogate pair",
    );
  });

  it("fold case by Unicode with the u and i flags", async () => {
    const getSource = (flags: string) => `
      if (!/[\\u0390]/${flags}.test("\\u1fd3") || !/(\\u039C)+/${flags}.test("\\xB5")) throw new Error("fold");
      if (/^[^\\u00e9]$/ui.test("\\u00c9") || !/^[^a-z]$/ui.test("\\u0131")) throw new Error("class");
    `;
    expect((await checkModel(getSource("ui"))).failure).toBeUndefined();
    await expect(checkModel(getSource("i"))).rejects.toThrow("fold");
  });

  it("read the characters that fold into ASCII as word characters with the u and i flags", async () => {
    const getSource = (flags: string) => `
      if (!/\\b/${flags}.test("\\u017F") || !/^(s)\\1$/${flags}.test("s\\u017F")) throw new Error("word");
      if (!/(i\\B\\u212A)/ui.test("ik") || /\\b/u.test("\\u212A")) throw new Error("boundary");
    `;
    expect((await checkModel(getSource("ui"))).failure).toBeUndefined();
    await expect(checkModel(getSource("i"))).rejects.toThrow("word");
  });

  it("match a class with the u flag against letters outside ASCII that a script holds", async () => {
    const getSource = (text: string) =>
      `if (!/^\\p{L}+$/u.test("${text}")) throw new Error("letters");`;
    expect((await checkModel(getSource("éà"))).failure).toBeUndefined();
    await expect(checkModel(getSource("é1"))).rejects.toThrow("letters");
  });

  it("replace and search with the u flag in text outside ASCII", async () => {
    const getSource = (expected: number) => `
      if ("ñandú".replace(/[^\\w]/gu, "-") !== "-and-") throw new Error("word");
      if ("naïve".search(/[ï]/u) !== ${expected}) throw new Error("search");
    `;
    expect((await checkModel(getSource(2))).failure).toBeUndefined();
    await expect(checkModel(getSource(3))).rejects.toThrow("search");
  });

  it("run a regexp's methods under Symbol.match, Symbol.replace, Symbol.search, and Symbol.split", async () => {
    const getSource = (flags: string) => `
      const found = /b(.)/[Symbol.match]("abc");
      if (found === null || found[0] !== "bc" || found[1] !== "c") throw new Error("match");
      if (/x/[Symbol.search]("abx") !== 2) throw new Error("search");
      if (/a/${flags}[Symbol.replace]("banana", "o") !== "bonono") throw new Error("replace");
      const pieces = /,/[Symbol.split]("a,b,c", 2);
      if (pieces.length !== 2 || pieces[1] !== "b") throw new Error("split");
    `;
    expect((await checkModel(getSource("g"))).failure).toBeUndefined();
    expect((await checkModel(getSource(""))).failure?.message).toContain("replace");
  });

  it("call a replace function from a regexp's method under Symbol.replace", async () => {
    const getSource = (expected: string) => `
      const replaced = /(a)/g[Symbol.replace]("banana", (whole: string, first: string, index: number) =>
        first.toUpperCase() + index,
      );
      if (replaced !== "${expected}") throw new Error("replacer");
    `;
    expect((await checkModel(getSource("bA1nA3nA5"))).failure).toBeUndefined();
    expect((await checkModel(getSource("bA1nA3nA4"))).failure?.message).toContain("replacer");
  });

  it("escape a string's syntax, punctuation, white space, and leading digit with RegExp.escape", async () => {
    const getSource = (expected: string) => `
      const escaped = [RegExp.escape("1a.b"), RegExp.escape("x,\\t\\u00a0\\ud800")].join(" ");
      if (escaped !== String.raw\`${expected}\`) throw new Error(escaped);
    `;
    expect(
      (await checkModel(getSource("\\x31a\\.b \\x78\\x2c\\t\\xa0\\ud800"))).failure,
    ).toBeUndefined();
    await expect(checkModel(getSource("1a\\.b x\\x2c\\t\\xa0\\ud800"))).rejects.toThrow("x31a");
  });

  it("add and remove the i flag for a modifier group's body", async () => {
    const getSource = (text: string) => `
      if (!/a(?i:b)c/.test("${text}") || /(?-i:a)b/i.test("Ab")) throw new Error("i");
      if (!/(?i:(a)\\1)/.test("aA") || /(?i:(a))\\1/.test("aA")) throw new Error("backreference");
    `;
    expect((await checkModel(getSource("aBc"))).failure).toBeUndefined();
    await expect(checkModel(getSource("ABc"))).rejects.toThrow("i");
  });

  it("add and remove the m and s flags for a modifier group's body", async () => {
    const getSource = (pattern: string) => `
      if (!/(?m:es$)/.test("es\\ns") || /es$/.test("es\\ns")) throw new Error("m");
      if (!${pattern}.test("\\n") || /(?-s:^.$)/s.test("\\n")) throw new Error("s");
    `;
    expect((await checkModel(getSource("/(?s:^.$)/"))).failure).toBeUndefined();
    await expect(checkModel(getSource("/^.$/"))).rejects.toThrow("s");
  });

  it("make a regexp of a regexp literal with its flags or new ones", async () => {
    const getSource = (flags: string) => `
      const copied = new RegExp(/a/im);
      if (copied.flags !== "${flags}" || !copied.test("A")) throw new Error("copied");
      const flagged = RegExp(/(?s:^.$)/m, "");
      if (flagged.flags !== "" || !flagged.test("\\n")) throw new Error("flagged");
    `;
    expect((await checkModel(getSource("im"))).failure).toBeUndefined();
    await expect(checkModel(getSource("i"))).rejects.toThrow("copied");
  });

  it("drop a regexp that a statement makes of literals", async () => {
    const getSource = (count: number) => `
      /(?i-s:)/;
      new RegExp("(?m:)", "i");
      const count: number = ${count};
      if (count !== 1) throw new Error("count");
    `;
    expect((await checkModel(getSource(1))).failure).toBeUndefined();
    await expect(checkModel(getSource(2))).rejects.toThrow("count");
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

  it("runs the function that a variable holds where the call asserts that it isn't null", async () => {
    const getSource = (expected: number) => `
      let count: number = 1;
      let read: (() => number) | undefined;
      let other: (() => number) | undefined;
      (() => {
        read = () => count + 1;
        other = () => count + 2;
      })();
      count = 5;
      const value = read!() * 10 + (other as () => number)();
      if (value !== ${expected}) throw new Error("value " + value);
    `;
    expect((await checkModel(getSource(67))).failure).toBeUndefined();
    expect((await checkModel(getSource(66))).failure?.message).toContain("value 67");
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

  it("rejects the promise of an async function whose default calls null", async () => {
    const source = (expected: string) => `
      declare function setTimeout(callback: () => void): void;
      let result = "";
      const held: any = null;
      async function run(value = held()) {}
      run().then(
        () => { result = "fulfilled"; },
        (error) => { result = error instanceof TypeError ? "TypeError" : "other"; },
      );
      setTimeout(() => {
        if (result !== "${expected}") throw new Error(result);
      });
    `;
    expect((await checkModel(source("TypeError"))).failure).toBeUndefined();
    expect((await checkModel(source("fulfilled"))).failure).toBeDefined();
  });

  it("stops where a default may call its own async function through a value", async () => {
    const result = await checkModel(`
      let held: any = null;
      const run = async (value = held()) => {};
      held = run;
      run().catch(() => {});
    `);
    expect(result.failure?.message).toContain("tla-ts can't tell which function this call runs");
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

  it("copies an array's elements into a typed array", async () => {
    const getSource = (expected: string) => `
      const keys = new Int32Array(8).fill(-1);
      keys.set([1, 2, 3, 4], 4);
      const list = [5, 6];
      list.push(7);
      keys.set(list);
      const bytes = new Uint8Array(3);
      bytes.set([300, -1, 1.5]);
      const errors: string[] = [];
      try {
        keys.set([1, 2], 7);
      } catch (error) {
        errors.push(error instanceof RangeError ? "range" : "other");
      }
      try {
        keys.set([1], -1);
      } catch (error) {
        errors.push(error instanceof RangeError ? "range" : "other");
      }
      const result = [keys.join(","), bytes.join(","), errors.join(",")].join(";");
      if (result !== "${expected}") throw new Error(result);
    `;
    expect(
      (await checkModel(getSource("5,6,7,-1,1,2,3,4;44,255,1;range,range"))).failure,
    ).toBeUndefined();
    expect(
      (await checkModel(getSource("5,6,7,-1,1,2,3,4;44,255,2;range,range"))).failure?.message,
    ).toContain("44,255,1;");
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

  describe("makes a typed array of the values of an iterator that a script gives", () => {
    const iterable = `
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
    `;

    it("takes each value that the iterator gives", async () => {
      const result = await checkModel(`${iterable}
      const constructors = [Int8Array, Float64Array];
      let out = "";
      for (const TA of constructors) {
        const sample = new TA(make([1, -2, 3]) as never);
        out += sample.length + ":" + sample[1] + ";";
      }
      if (out !== "3:-2;3:-2;") throw new Error(out);
    `);
      expect(result.failure).toBeUndefined();
    });

    it("makes an empty typed array of an iterator that gives nothing", async () => {
      const result = await checkModel(`${iterable}
      const plain = new Uint8Array(make([]) as never);
      if (plain.length !== 0) throw new Error("empty");
    `);
      expect(result.failure).toBeUndefined();
    });

    it("throws what the iterator's next throws", async () => {
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
