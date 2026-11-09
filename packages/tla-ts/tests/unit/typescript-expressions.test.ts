import { describe, expect, it } from "vite-plus/test";
import { evaluateExpression } from "./typescript-harness";

// Each expression evaluates the same in JavaScript and in the TLA+ that tla-ts compiles it to.
const CASES: Record<string, (string | [string, string])[]> = {
  numbers: [
    "1 + 2 * 3 - 4",
    "2 ** 10",
    "-(3 - 5)",
    "7 % 3",
    "-7 % 3",
    "7 % -3",
    "-7 % -3",
    "0 % 5",
    "Math.floor(7 / 2)",
    "Math.floor(-7 / 2)",
    "Math.trunc(7 / 2)",
    "Math.trunc(-7 / 2)",
    "Math.trunc(7 / -2)",
    "Math.abs(-4)",
    "Math.abs(4)",
    "Math.min(3, 1, 2)",
    "Math.max(3, 1, 2)",
    "Math.min(...[4, 2, 8])",
    "Math.max(...new Set([4, 2, 8]))",
    "Math.abs(2 - 7)",
    "Math.max(1 + 1, 5 - 4, 2 * 2, -3)",
    "Math.min(...[4, 2, 8].map((value) => value - 5))",
    "[1 < 2, 2 <= 2, 3 > 4, 4 >= 5]",
  ],
  booleans: [
    "true && false",
    "true || false",
    "!true",
    ["one === 1 && two !== 3", "const one: number = 1;\nconst two: number = 2;"],
    "(1 > 2) === false",
    "3 > 2 ? 10 : 20",
    "3 < 2 ? 10 : 20",
  ],
  "null and undefined": [
    "null",
    "undefined",
    ["value ?? 5", "const value: number | null = null as number | null;"],
    ["value ?? 5", "const value: number | undefined = 3 as number | undefined;"],
    ["(value ?? 2) * (value ?? 3)", "const value: number | null = null as number | null;"],
    ["value === null", "const value: number | null = null as number | null;"],
    "[Object.is(1, 1), Object.is('a', 'b')]",
  ],
  strings: [
    '"tla" + "+"',
    '"a" + 1',
    "`x${1}y${'z'}`",
    "`${[1, 2].length} items`",
    '"hello".length',
    ['letter === "a"', 'const letter: string = "a";'],
    ['letter !== "b"', 'const letter: string = "a";'],
    "'a\\0b\\u0001c\\td\"e\\\\f'",
    "['abc'[1], 'abc'[3], 'a\\u2028b'[1]]",
    "`${true},${false},${null},${undefined}`",
  ],
  arrays: [
    "[]",
    ["[0 in list, 1 in list, -1 in list]", "const list = [42];"],
    [
      "list.every((value: number, index: number, array: unknown) => typeof array === 'object')",
      "const list = [0, 1];",
    ],
    [
      "[list.filter((value) => value), list.some((value) => (value > 1 ? 'yes' : '')), list.findIndex((value) => value)]",
      "const list = [0, 1, 2];",
    ],
    [
      "['v' + values[0], 'v' + values[1] + values[2], `${values[3]}-${values[4]}`]",
      "const values: unknown[] = [1, 'a', true, null, undefined];",
    ],
    [
      "[new Array().length, new Array(1, 2, 3), new Array('a'), new Array(zero).length]",
      "const zero = 0;",
    ],
    "[1, 2, 3]",
    "[[1, 2], [3]]",
    "[...[1, 2], 3, ...[4]]",
    "[1, 2, 3][0]",
    "[1, 2, 3][2]",
    "[[1, 2][5], [1, 2][-1]]",
    "[1, 2, 3].length",
    "[1, 2, 3].at(-1)",
    "[1, 2, 3].at(0)",
    "[1, 2, 3].at(5)",
    "[1, 2, 3].includes(2)",
    "[1, 2, 3].includes(4)",
    "[3, 1, 3].indexOf(3)",
    "[3, 1, 3].indexOf(4)",
    "[[1, 2, 1].includes(1, 1), [1, 2].includes(1, 1), [1, 2].includes(1, -2), [1, 2].includes(2, -9)]",
    "[[3, 1, 3].indexOf(3, 1), [3, 1, 3].indexOf(3, -1), [3, 1].indexOf(3, 1), [3, 1].indexOf(1, -5)]",
    "[[3, 1, 3].lastIndexOf(3), [3, 1, 3].lastIndexOf(4), [3, 1, 3].lastIndexOf(3, 1), [3, 1, 3].lastIndexOf(3, -2), [3, 1].lastIndexOf(3, -5), [3, 1].lastIndexOf(1, 9), [3, 1].lastIndexOf(3, undefined), [1, 3].lastIndexOf(3, undefined)]",
    ["[[3, 1, 3].lastIndexOf(3, from), [3, 1, 3].indexOf(3, from)]", "const from: number = -2;"],
    "[[1, 2, 3].reduce((sum, value) => sum + value), [1, 2, 3].reduce((sum, value) => sum + value, 10), [1, 2, 3].reduceRight((text, value) => text + String(value), ''), ['a', 'b'].reduceRight((text, value) => text + value), [5].reduce((sum, value) => sum + value), [4, 5].reduce((sum, value, index, array) => sum + index * array.length, 0), ([] as number[]).reduce((sum, value) => sum + value, 7)]",
    "[[1, 2, 3, 4].findLast((value) => value % 2 === 1), [1, 2].findLast((value) => value > 5), [1, 2, 3, 4].findLastIndex((value) => value % 2 === 1), [1, 2].findLastIndex((value) => value > 5), [5, 6, 7].findLastIndex((value, index) => index < 2)]",
    "[1, 2, 3].map((value) => value * 2).indexOf(2 + 2)",
    "[1, 2, 3].filter((value) => value > 1).at(-1)",
    "[1, 2, 3, 4].slice(1)",
    "[1, 2, 3, 4].slice(1, 3)",
    "[1, 2, 3, 4].slice(-2)",
    "[1, 2, 3, 4].slice(1, -1)",
    "[1, 2, 3, 4].slice(0, 10)",
    "[1, 2, 3, 4].slice(3, 1)",
    "[1, 2].concat([3], 4)",
    "[1, 2, 3].with(1, 9)",
    "[1, 2, 3].slice(-5)",
    ["[1, 2, 3].slice(start)", "const start: number = -2;"],
    ["[1, 2, 3].slice(0, end)", "const end: number = -1;"],
    ["[1, 2, 3].slice(start, 2)", "const start: number = 5;"],
    ["[1, 2, 3].at(position)", "const position: number = -1;"],
    ["[1, 2, 3].with(position, 9)", "const position: number = -1;"],
    "[1, 2, 3].toReversed()",
    "[1, 2, 3].map((value) => value * 2)",
    "[5, 6].map((value, index) => value + index)",
    "[1, 2, 3, 4].filter((value) => value % 2 === 0)",
    "[5, 6, 7, 8].filter((value, index) => index % 2 === 1)",
    "[5, 6, 7].filter((value, index, array) => array[index] === value && value > 5)",
    "[5, 6].map((value, index, array) => array.length + index)",
    "[5, 6].some((value, index, array) => array[1 - index] === 5)",
    "[1, 2, 3].every((value) => value > 0)",
    "[1, 2, 3].some((value) => value > 2)",
    "[1, 2, 3].some((value, index) => index === 2 && value === 3)",
    "[].every((value) => value > 0)",
    "[4, 5, 6].find((value) => value > 4)",
    "[4, 5, 6].find((value) => value > 9)",
    "[4, 5, 6].findIndex((value) => value > 4)",
    "[4, 5, 6].findIndex((value) => value > 9)",
    "Array.from({ length: 3 }, (_, index) => index * index)",
    "Array(3).fill(7)",
    "new Array(2).fill(false)",
    "[[1, 2], [3, 4]].map((pair) => pair[0] + pair[1])",
    "[[1, 2], [3, 4]].map(([first, second]) => first * second)",
  ],
  sets: [
    "new Set()",
    "new Set([1, 2, 2, 3])",
    "new Set([3, 1, 2])",
    "new Set([1, 2]).has(2)",
    "new Set([1, 2]).has(3)",
    "new Set([1, 2, 2]).size",
    "new Set([1, 2]).union(new Set([2, 3]))",
    "new Set([1, 2]).intersection(new Set([2, 3]))",
    "new Set([1, 2]).difference(new Set([2, 3]))",
    "new Set([1, 2]).symmetricDifference(new Set([2, 3]))",
    "new Set([1]).isSubsetOf(new Set([1, 2]))",
    "new Set([1, 3]).isSubsetOf(new Set([1, 2]))",
    "new Set([1, 2]).isSupersetOf(new Set([1]))",
    "new Set([1]).isDisjointFrom(new Set([2]))",
    "new Set([1, 2]).isDisjointFrom(new Set([2]))",
    "new Set([2]).isSubsetOf(new Map([[2, 'two']]))",
    "new Set([1]).isDisjointFrom(new Map([[2, 'two']]))",
    "[...new Set([1, 2, 3])].filter((value) => value > 1).length",
    "new Set([...new Set([1, 2, 3])].map((value) => value % 2))",
    "new Set([1, 2, 3].map((value) => value % 2))",
    "new Set([1, 2, 3]).values().every((value) => value < 4)",
    "new Set([1, 2, 3]).values().some((value) => value === 2)",
    "new Set([1, 2, 3]).values().filter((value) => value !== 2).toArray().length",
    "[...new Set([1, 2, 3])].includes(2)",
    "new Set([5]).values().find((value) => value > 1)",
    "new Set([5]).values().find((value) => value > 9)",
    "new Set([1, 2]).add(3)",
    "new Set([1, 2]).has(1) === new Set([2, 1]).has(1)",
  ],
  maps: [
    "new Map()",
    "new Map([['a', 1], ['b', 2]])",
    "new Map([['a', 1], ['a', 2]])",
    "new Map([['a', 1]]).get('a')",
    "new Map([['a', 1]]).get('b')",
    "new Map([['ab', 1]]).get('a' + 'b')",
    "new Map([['a', 1]]).has('a')",
    "new Map([['a', 1]]).has('b')",
    "new Map([['a', 1], ['b', 2]]).size",
    "new Set(new Map([['a', 1], ['b', 2]]).keys())",
    "new Set(new Map([['a', 1], ['b', 1]]).values())",
    "new Set(new Map([['a', 1]]).entries())",
    "new Map(new Set([1, 2]).values().map((key) => [key, key * 10]))",
    "new Map(new Map([['a', 1]])).set('b', 2)",
  ],
  records: [
    "{ a: 1, b: 'x' }",
    "{ a: { b: [1, 2] } }",
    "{ ...{ a: 1, b: 2 }, b: 3 }",
    "{ ...{ a: 1 }, ...{ b: 2 } }",
    "{ a: 1, b: 2 }.b",
    "{ a: 1, b: 2 }['a']",
    "new Set(Object.keys({ a: 1, b: 2 }))",
    "new Set(Object.values({ a: 1, b: 1 }))",
    "new Set(Object.entries({ a: 1 }))",
    "new Set([1, 2, 3].filter((value) => value > 1).map((value) => value * 10))",
    "'a' in { a: 1 }",
    "Object.fromEntries(new Set(['a', 'b']).values().map((key) => [key, key + '!']))",
    "({ 1: 'one', 2: 'two' })[2]",
    "{ IF: 1, 'b-c': 2, bre\\u0061k: 3 }",
    "{ IF: 1, 'b-c': 2 }['b-c'] + { IF: 1 }.IF",
  ],
  types: [
    "[typeof 1, typeof 'a', typeof true, typeof undefined, typeof null, typeof { a: 1 }, typeof [1]]",
    "[typeof TypeError, typeof (() => 1)]",
    "[Boolean(), Boolean(0), Boolean(2), Boolean(''), Boolean('a'), Boolean(undefined), Boolean(null), Boolean([1]), Boolean(false)]",
    "[String(), String(-12), String(true), String(undefined), String(null), String('a'), Number(), Number(true), Number(null), Number(' 42 '), Number(''), parseInt('12px'), parseInt('0x1F'), parseFloat('3e2')]",
    [
      "values.map((value) => String(value))",
      "const values: unknown[] = [1, -3, 'a', '', true, false, undefined, null];",
    ],
    "[['a', 'b', 'c'].join(), ['a', 'b'].join('; '), [''].join('-'), ([] as string[]).join()]",
    "[+1, +true, +false, +'7', +' -3 ', +'']",
    "[Array.isArray([1]), Array.isArray([[1], [2]]), Array.isArray(1), Array.isArray('a'), Array.isArray(undefined)]",
    "[Object.getPrototypeOf(Array) === Function.prototype, Object.getPrototypeOf(TypeError) === Error, Object.getPrototypeOf(Error) === Function.prototype]",
    "[Object.getPrototypeOf(TypeError.prototype) === Error.prototype, Object.getPrototypeOf(Error.prototype) === Object.prototype, Object.getPrototypeOf(Object.prototype) === null]",
    "[Object.getPrototypeOf([1]) === Array.prototype, Object.getPrototypeOf(new RangeError('r')) === RangeError.prototype, Object.getPrototypeOf(1) === Number.prototype, Object.getPrototypeOf('a') === Object.prototype]",
    "[Object.getPrototypeOf(() => 1) === Function.prototype, Object.getPrototypeOf({ a: 1 }) === Object.prototype, Object.getPrototypeOf(Object.getPrototypeOf(new Set([1]))) === Object.prototype]",
    "[Object.prototype.isPrototypeOf(new TypeError('t')), Error.prototype.isPrototypeOf(Array.prototype), Function.prototype.isPrototypeOf(Map), Function.prototype === Object.prototype]",
    [
      "[proto === Error.prototype, Object.is(proto, Error.prototype)]",
      "const proto = Object.getPrototypeOf(TypeError.prototype);",
    ],
    [
      "[isSame(Object.getPrototypeOf(Map), Function.prototype), isSame(Array.prototype, Object.getPrototypeOf([1])), isSame(Array.prototype, Map.prototype), isSame(Object.prototype, null), getType(Array.prototype), getType(Function.prototype)]",
      "const isSame = (left: unknown, right: unknown) => Object.is(left, right);\nconst getType = (value: unknown) => typeof value;",
    ],
    [
      "[getType(1), getType('a'), getType('TRUE'), getType(false), getType(undefined), getType(null), getType([1]), getType(new Set([1])), getType(TypeError), getType(new TypeError('t'))]",
      "const getType = (value: unknown) => typeof value;",
    ],
    [
      "[isSame(1, '1'), isSame(1, 1), isSame(undefined, null), isSame(null, null), isSame(TypeError, TypeError), isSame(TypeError, RangeError), Object.is(text, 1)]",
      "const isSame = (left: unknown, right: unknown) => left === right;\nconst text: string | number = 'a' as string | number;",
    ],
  ],
  objects: [
    [
      "[first === second, first === first, [first].includes(first), [{ a: 1 }].includes({ a: 1 })]",
      "const first = {};\nconst second = {};",
    ],
    [
      "[point.x, point.y]",
      "const point = { x: 1, y: 2 };\nconst alias = point;\nalias.x = 5;\npoint.y += alias.x;",
    ],
    [
      "holder.inner.n",
      "const holder = { inner: { n: 1 } };\nconst inner = holder.inner;\ninner.n = 7;",
    ],
    [
      "total",
      "let total = 0;\nfor (let index = 0; index < 3; index++) {\n  const box = { index };\n  box.index *= 2;\n  total += box.index;\n}",
    ],
    ["{ ...base, b: 3, ['c']: 4 }", "const base = { a: 1, b: 2 };"],
    ["[x, y]", "const point: { x: number; y?: number } = { x: 1 };\nconst { x, y = 9 } = point;"],
    [
      "['a' in point, 'z' in point, Object.getPrototypeOf(point) === Object.prototype]",
      "const point = { a: 1 };",
    ],
    ["new Set(Object.keys(point))", "const point = { a: 1, 2: 'b' };"],
    [
      "[[0, box, 2].indexOf(box, 2), [0, 1, box].indexOf(box, 2), [2, box].includes(box)]",
      "const box = {};",
    ],
    ["[box === 1, 1 === box]", "const box: {} = {};"],
    [
      "[point.hasOwnProperty('a'), point.hasOwnProperty('toString'), Object.hasOwn(point, 1), Object.prototype.hasOwnProperty.call(point, 'b'), Array.isArray(point)]",
      "const point = { a: 1, 1: 2 };",
    ],
    [
      "[before, has(box)]",
      `const box: { a?: number } = {};
      const has = (value: object) => Object.prototype.hasOwnProperty.call(value, "a");
      let before = "absent";
      if (has(box)) before = "present";
      box.a = 1;`,
    ],
    [
      "[count, b]",
      `let count = 0;
      const { b = 2 } = {};
      for (var { a = 1 } = {}; count < 1; ) {
        count += a;
      }`,
    ],
    [
      "[box.a, other.b, box === copy, box === box]",
      `const flag = 1 > 2;
      const box = flag ? { a: 1 } : { a: 2 };
      const maybe: { b: number } | undefined = flag ? { b: 3 } : undefined;
      const other = maybe ?? { b: 4 };
      const copy = flag ? box : { a: 2 };`,
    ],
    [
      "[count, box.a, label, kind, steps]",
      `let count = 0;
      const box = { a: 1 };
      const size: number = 2;
      if (size > 1) {
        count = count + 1;
        box.a = 5;
      } else {
        count = count + 2;
      }
      if (size > 3) {
        var label = "big";
      } else {
        var label = "small";
      }
      let kind = "none";
      try {
        if (size > 1) throw new Error("size");
        kind = "fine";
      } catch {
        kind = "caught";
        box.a = box.a + 1;
      }
      switch (size) {
        case 1:
          count = 10;
          break;
        case 2:
          count = count + 20;
          break;
        default:
          count = 30;
      }
      const measure = (value: number) => {
        if (value > 1) return value * 2;
        box.a = 0;
        return value;
      };
      const first = measure(size);
      const second = measure(1);
      const steps = [first, second];`,
    ],
    [
      "[total, counter['double'](4), count, typeof counter.add, counter.add === other.add, Object.hasOwn(counter, 'add')]",
      `let count = 0;
      const counter = {
        add(step: number) {
          count = count + step;
        },
        double(value: number) {
          return value * 2;
        },
      };
      const other = { add() {} };
      counter.add(2);
      const total = counter.double(3);`,
    ],
    [
      "[box.read(), box.v, doubled]",
      `let doubled = 0;
      const box = {
        v: 3,
        read() {
          return this.v;
        },
        bump(step: number) {
          this.v = this.v + step;
          const double = () => this.v * 2;
          doubled = double();
        },
      };
      box.bump(2);`,
    ],
    [
      "[counter.read(), Counter.make(), typeof Counter, Counter.name, Counter.length, counter instanceof Counter, Object.getPrototypeOf(counter) === Counter.prototype, Object.getOwnPropertyNames(Counter.prototype), Object.hasOwn(counter, 'bump')]",
      `class Counter {
        count = 0;
        step: number;
        constructor(step: number) {
          this.step = step;
        }
        bump() {
          this.count = this.count + this.step;
        }
        read() {
          return this.count;
        }
        static make() {
          return 7;
        }
      }
      const counter = new Counter(2);
      counter.bump();
      counter.bump();`,
    ],
    [
      "[box.first === first, box.second === second, box.first === box.second, typeof box.first]",
      `const first = function () {
        return 1;
      };
      function second() {
        return 2;
      }
      const box = { first: first, second: second };`,
    ],
    [
      "has(point)",
      "const point = { a: 1 };\nconst has = (value: { a: number }) => Object.hasOwn(value, 'a');",
    ],
    [
      "[box.a, box.hasOwnProperty('a'), new Set(Object.keys(box)), caught]",
      `const box: { a?: number } = {};
      Object.defineProperty(box, "a", { value: 1 });
      Object.defineProperty(box, "a", { value: 1, enumerable: false });
      let caught = "none";
      try {
        Object.defineProperty(box, "a", { value: 2 });
      } catch (error) {
        caught = error instanceof TypeError ? "TypeError" : "other";
      }`,
    ],
    [
      "[getter!.get === read, getter!.set, setter!.set === write, Object.hasOwn(getter!, 'writable'), box.propertyIsEnumerable('b'), box.b, changed, caught]",
      `const box: { a?: number; b?: number } = {};
      const read = function () {
        return 1;
      };
      const write = function (value: number) {};
      Object.defineProperty(box, "a", { get: read, configurable: true });
      Object.defineProperty(box, "b", { set: write, enumerable: true });
      const getter = Object.getOwnPropertyDescriptor(box, "a");
      const setter = Object.getOwnPropertyDescriptor(box, "b");
      Object.defineProperty(box, "a", { value: 2, writable: true });
      const changed = Object.getOwnPropertyDescriptor(box, "a")!.value;
      Object.defineProperty(box, "a", { get: read });
      let caught = "none";
      try {
        Object.defineProperty(box, "b", { set: read });
      } catch (error) {
        caught = error instanceof TypeError ? "TypeError" : "other";
      }`,
    ],
    [
      "[box.a, child.a, Object.hasOwn(child, 'a'), Object.getOwnPropertyDescriptor(described, 'b')!.writable, caught]",
      `const box: { a?: number } = {};
      Object.defineProperty(box, "a", {
        get: function () {
          return 10;
        },
        set: function (value: number) {},
      });
      const child: { a?: number } = Object.create(box);
      Object.preventExtensions(child);
      child.a = 5;
      box.a = 3;
      const attributes = {};
      Object.defineProperty(attributes, "writable", {
        get: function () {
          return true;
        },
      });
      const described = {};
      Object.defineProperty(described, "b", attributes);
      const fixed: { c?: number } = {};
      Object.defineProperty(fixed, "c", {
        get: function () {
          return 1;
        },
      });
      let caught = "none";
      try {
        fixed.c = 2;
      } catch (error) {
        caught = error instanceof TypeError ? "TypeError" : "other";
      }`,
    ],
    ["['MAX_VALUE' in Number, 'missing' in Number, 'name' in TypeError]", "const box = {};"],
    ["[Reflect.has === Reflect.has, Reflect.has === Reflect.get]", "const box = {};"],
    [
      "Optional.length",
      `class Optional {
        constructor(first?: number, second = 1) {}
      }`,
    ],
    [
      "[child.length, Object.getPrototypeOf(child) === proto, point.x, Point.length, Con.name, typeof Point, child instanceof Con, Object.getOwnPropertyDescriptor(Point, 'prototype')!.writable]",
      `const proto = { length: 2 };
      const Con = function () {};
      Con.prototype = proto;
      const child = new (Con as unknown as new () => { [key: string]: unknown })();
      const point = new (Point as unknown as new (x: unknown) => { [key: string]: unknown })(3);
      function Point(this: { [key: string]: unknown }, x: unknown) {
        this.x = x;
      }`,
    ],
    [
      "[Object.keys(keyed).join(), Object.entries(keyed)[0][0], Object.entries(keyed)[0][1], Object.values(keyed).length === 3, Object.keys(list).join(), Object.entries(list)[1][0], Object.keys(Promise).length]",
      `const keyed: { [key: string]: unknown } = { x: 1, y: 2, 2: "two" };
      Object.defineProperty(keyed, "hidden", { value: 3, enumerable: false });
      const list = [5, 6];`,
    ],
    [
      "[list.every(readFlag, flagged), list.some(isUndefined), count, Array.prototype.every.call(holder, readFlag, flagged)]",
      `const flagged: { [key: string]: unknown } = { flag: true, step: 2 };
      let count = 0;
      function readFlag(this: { [key: string]: unknown }, value: number) {
        return this.flag === true && value > 0;
      }
      function isUndefined(this: unknown) {
        return this === undefined;
      }
      function bump(this: { [key: string]: unknown }, value: number) {
        count = count + (this.step as number) + value;
      }
      const list = [1, 2];
      list.forEach(bump, flagged);
      const holder: { [key: string]: unknown } = { 0: 3, length: 1 };`,
    ],
    [
      "[unset, flag, zero, empty, kept, held, shown]",
      `const box = {};
      let unset: unknown = undefined;
      let flag = true;
      let zero: unknown = 0;
      let empty: unknown = null;
      let kept: unknown = 3;
      const echo = (item: unknown) => item;
      unset ||= 1;
      flag &&= false;
      zero ??= 5;
      empty ??= 6;
      kept ||= 9;
      let held = 0;
      const shown = echo((held ||= 4));`,
    ],
    [
      "[found, fallback, kept]",
      `const source: { [key: string]: unknown } = { found: 4, kept: null };
      let found: unknown = 0;
      let fallback: unknown = 0;
      let kept: unknown = 0;
      ({ found } = source);
      ({ fallback = 5 } = source);
      ({ kept = 6 } = source);`,
    ],
    [
      "[x, flag, y + z, a + b, assigned === pair, declared]",
      `const box = {};
      let x = 0;
      let y = 0;
      let z = 0;
      let flag = "none";
      if ((x = 1) !== 1) flag = "bad";
      else flag = "good";
      y = z = 5;
      let a = 0;
      let b = 0;
      const pair = [7, 8];
      let assigned: number[] = [];
      assigned = [a, b] = pair;
      const declared = (z = 9) + 1;`,
    ],
    [
      "[shape.sides, Shape.prototype.sides]",
      `const box = {};
      function Shape() {}
      Shape.prototype.sides = 4;
      const shape = new (Shape as unknown as new () => { [key: string]: unknown })();`,
    ],
    [
      "[Array.prototype.every.call(holed, (value: unknown, index: number) => index !== 5 || value === 10), Array.prototype.filter.call(holed, (value: unknown, index: number) => index > 0).length, Array.prototype.indexOf.call(holed, 10), Array.prototype.lastIndexOf.call(holed, 6), Array.prototype.reduce.call(holed, (sum: unknown, value: unknown, index: number) => (sum as number) + index, 0)]",
      `const holed: { [key: string]: unknown } = Object.create({ 1: 6 });
      holed[0] = 11;
      holed[5] = 10;
      holed.length = 20;`,
    ],
    [
      "[counter.getX(), counter.callM(), counter.readA(), stored, Counter.has(counter), Counter.has(other), Counter.has({}), other.getX(), Object.keys(counter).length]",
      `let stored: unknown = "none";
      class Counter {
        #x = 1;
        #m() {
          return 40;
        }
        get #a() {
          return "got";
        }
        set #a(value: unknown) {
          stored = value;
        }
        bump() {
          this.#x = this.#x + 1;
        }
        getX() {
          return this.#x;
        }
        callM() {
          return this.#m() + 2;
        }
        readA() {
          return this.#a;
        }
        writeA() {
          this.#a = "set";
        }
        static has(object: object) {
          return #x in object;
        }
      }
      class Other {
        #x = 5;
        getX() {
          return this.#x;
        }
      }
      const counter = new Counter();
      counter.bump();
      counter.writeA();
      const other = new Other();`,
    ],
    [
      "[typeof retyped.value, typeof (retyped.value)]",
      `const retyped = { value: 1 };
      Object.defineProperty(retyped, "value", { value: "text" });`,
    ],
    [
      "created",
      `const box = {};
      let created = "none";
      try {
        new (Array.prototype.map as unknown as new () => unknown)();
      } catch (error) {
        created = error instanceof TypeError ? "TypeError" : "other";
      }`,
    ],
    [
      "[C.prototype['0.1'], keys['16'], keys.s, first, stringSet]",
      `let stringSet: unknown;
      class C {
        get .1() {
          return "decimal";
        }
        set .1(param: unknown) {
          stringSet = param;
        }
      }
      var keys = {
        get [0x10]() {
          return "hex";
        },
        set [0x10](param: unknown) {
          stringSet = param;
        },
        get "s"() {
          return "string";
        },
      };
      C.prototype["0.1"] = "first";
      const first = stringSet;
      keys["16"] = "second";`,
    ],
    [
      "[box.double, described.enumerable, described.configurable, typeof described.set, 'double' in box]",
      `const box = {
        count: 2,
        get double() {
          return this.count * 2;
        },
        set double(value: number) {},
      };
      const described = Object.getOwnPropertyDescriptor(box, "double")!;`,
    ],
    [
      "[counter.next, Counter.zero, typeof described.get, typeof described.set, described.enumerable, Object.getOwnPropertyNames(Counter.prototype), replaced.value]",
      `var Counter = class {
        count = 1;
        get next() {
          return this.count + 1;
        }
        set next(value: number) {}
        static get zero() {
          return 0;
        }
      };
      const counter = new Counter();
      const described = Object.getOwnPropertyDescriptor(Counter.prototype, "next")!;
      var Replaced = class {
        get value() {
          return 1;
        }
      };
      Object.defineProperty(Replaced.prototype, "value", { value: 2 });
      const replaced = new Replaced();`,
    ],
    [
      "[made === again, typeof made, Object.getPrototypeOf(made) === Object.prototype, 'x' in made, 'x' in again]",
      `interface ObjectConstructor {
        new (value?: null): object;
      }
      const nothing = undefined;
      const made = new Object();
      const again = new Object(nothing);
      Object.defineProperty(made, "x", { value: 1, enumerable: true });`,
    ],
    [
      "[method, constructor, created]",
      `const box = {};
      let method = "none";
      try {
        Reflect.construct(function () {}, [], Object.create as unknown as Function);
      } catch (error) {
        method = error instanceof TypeError ? "TypeError" : "other";
      }
      let constructor = "none";
      try {
        Reflect.construct(function () {}, [], Object);
      } catch (error) {
        constructor = error instanceof TypeError ? "TypeError" : "other";
      }
      let created = "none";
      try {
        new (Array.prototype.map as unknown as new () => unknown)();
      } catch (error) {
        created = error instanceof TypeError ? "TypeError" : "other";
      }`,
    ],
    ["[read({}), read({ x: 2 })]", "var read = ({ x = 1 }) => x;"],
    [
      "[thrown.constructor === TypeError, thrown.constructor === Error, thrown.name, thrown.toString === Error.prototype.toString]",
      `const box = {};
      let caught: unknown;
      try {
        Object.defineProperty(box, "a", { value: 1 });
        Object.defineProperty(box, "a", { value: 2 });
      } catch (error) {
        caught = error;
      }
      const thrown = caught as { constructor: unknown; name: string };`,
    ],
    [
      "[caught, 'a' in box, box.b]",
      `const box: { b?: number } = {};
      Object.defineProperty(box, "b", { value: 1 });
      let caught = false;
      try {
        Object.defineProperties(box, { a: { value: 1, writable: true }, b: { value: 2 } });
      } catch {
        caught = true;
      }`,
    ],
    [
      "[Object.isFrozen(frozen), Object.isSealed(sealed), Object.isFrozen(sealed), Object.isExtensible(empty), Object.isFrozen(empty), Object.isFrozen(1), Object.isExtensible(open), Object.isExtensible(Array.prototype), Object.isSealed([1]), Object.isFrozen(make)]",
      `const frozen = { a: 1 };
      const sealed = { a: 1 };
      const empty = {};
      const open = {};
      Object.freeze(frozen);
      Object.seal(sealed);
      Object.preventExtensions(empty);
      function make() {
        return 1;
      }`,
    ],
    [
      "[first!.value, first!.writable, second!.enumerable, second!.writable, missing === undefined, first === again]",
      `const box = { a: 1 };
      Object.defineProperty(box, "b", { value: 2 });
      const first = Object.getOwnPropertyDescriptor(box, "a");
      const second = Object.getOwnPropertyDescriptor(box, "b");
      const missing = Object.getOwnPropertyDescriptor(box, "c");
      const again = Object.getOwnPropertyDescriptor(box, "a");`,
    ],
    [
      "['a' in child, Object.hasOwn(child, 'a'), Object.getPrototypeOf(child) === base, Object.getPrototypeOf(orphan) === null, Object.getPrototypeOf(base) === Object.prototype, base.isPrototypeOf(child), Object.prototype.isPrototypeOf(child), Object.prototype.isPrototypeOf(orphan), 'a' in orphan]",
      `const base = { a: 1 };
      const child = { __proto__: base, b: 2 };
      const orphan = { __proto__: null };`,
    ],
    [
      "[child.a, child.b, Object.getPrototypeOf(child) === base, Object.getPrototypeOf(bare) === null, bare.x, Object.hasOwn(child, 'a'), 'toString' in bare]",
      `const base = { a: 1 };
      const child: { [key: string]: unknown } = Object.create(base);
      const bare: { [key: string]: unknown } = Object.create(null, { x: { value: 2 } });
      child.b = 2;`,
    ],
    [
      "[copy.a, 'b' in copy, base.b]",
      `const base = { a: 1, b: 0 };
      Object.defineProperty(base, "b", { enumerable: false });
      const copy = { ...base };`,
    ],
    [
      "[point.x, point === other]",
      "const make = () => ({ x: 4 });\nconst point = make();\nconst other = make();",
    ],
    [
      "[abs.writable, abs.enumerable, abs.value === Math.abs, abs.value === Math.max, length.value, length.writable, length.configurable, prototype.value === Array.prototype, missing === undefined, typeof abs.value, typeof prototype.value, typeof source.get, source.set]",
      `const abs = Object.getOwnPropertyDescriptor(Math, "abs")!;
      const length = Object.getOwnPropertyDescriptor(Function, "length")!;
      const prototype = Object.getOwnPropertyDescriptor(Array, "prototype")!;
      const missing = Object.getOwnPropertyDescriptor(Math, "missing");
      const source = Object.getOwnPropertyDescriptor(RegExp.prototype, "source")!;`,
    ],
    [
      "[box.a, caught, Object.getOwnPropertyDescriptor(Math, 'PI')!.writable, constant, Object.isFrozen(Math), Object.isExtensible(Math)]",
      `const box = { a: 1 };
      Object.freeze(box);
      let caught = "none";
      try {
        box.a = 2;
      } catch (error) {
        caught = error instanceof TypeError ? "TypeError" : "other";
      }
      let constant = "none";
      try {
        Object.defineProperty(Math, "PI", { value: 3 });
      } catch (error) {
        constant = error instanceof TypeError ? "TypeError" : "other";
      }`,
    ],
    [
      "[Object.getOwnPropertyNames(box), 'b' in box, caught, Object.getOwnPropertyNames(Math.abs), Object.hasOwn(Math, 'answer'), Object.hasOwn(Math, 'abs'), Object.hasOwn(Math.abs, 'name')]",
      `const box: { [key: string]: number } = { b: 1, 2: 3, a: 2, 1: 4 };
      delete box.b;
      delete box.missing;
      Object.defineProperty(box, "fixed", { value: 5 });
      let caught = "none";
      try {
        delete box.fixed;
      } catch (error) {
        caught = error instanceof TypeError ? "TypeError" : "other";
      }
      Object.defineProperty(Math, "answer", { value: 42, configurable: true });
      // @ts-expect-error Math has no answer
      delete Math.answer;
      // @ts-expect-error A function's name is read-only
      delete Math.abs.name;`,
    ],
    [
      "[keys, inherited]",
      `const base = { a: 1, b: 2, 3: 0 };
      const child: { [key: string]: number } = Object.create(base);
      child.c = 3;
      child[1] = 4;
      Object.defineProperty(child, "b", { value: 5, enumerable: false });
      let keys = "";
      for (const key in child) {
        keys = keys + key;
      }
      let inherited = 0;
      for (const key in Math) {
        inherited = inherited + 1;
      }`,
    ],
    [
      "[before, Math.max.name, Math.max.length, Array.prototype.length, isOwn(Math.max, 'name'), isOwn(Math, 'max'), Object.prototype.propertyIsEnumerable.call(Math, 'max'), box.propertyIsEnumerable('a'), constant]",
      `const isOwn = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
      const box = { a: 1 };
      const before = Math.max.name;
      Object.defineProperty(Math.max, "name", { value: "biggest" });
      let constant = "none";
      try {
        // @ts-expect-error Math.PI is read-only
        Math.PI = 3;
      } catch (error) {
        constant = error instanceof TypeError ? "TypeError" : "other";
      }`,
    ],
    [
      "[proto === Error, Object.getPrototypeOf(Uint8Array.prototype) === Object.getPrototypeOf(Int8Array.prototype), parseInt.name, Object.hasOwn(Proxy, 'revocable')]",
      `const box = {};
      const proto = Object.getPrototypeOf(AggregateError);`,
    ],
    [
      "objects.map((object) => Array.prototype.filter.call(object, () => true).length)",
      `const base = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 };
      const objects = [{ ...base, length: undefined }, { ...base, length: null }, { ...base, length: true }, { ...base, length: false }, { ...base, length: 0 }, { ...base, length: -3 }, { ...base, length: 2 }, { ...base, length: "" }, { ...base, length: "2" }, { ...base, length: "0002.0" }, { ...base, length: "2E0" }, { ...base, length: "2.3E-1" }, { ...base, length: "1e1" }, { ...base, length: "-4294967294" }, { ...base, length: "0x2" }, { ...base, length: "0X1" }, { ...base, length: "0o2" }, { ...base, length: "0b10" }, { ...base, length: "-0x2" }, { ...base, length: "one" }, { ...base, length: "1e" }, { ...base, length: "." }, { ...base, length: ".5" }, { ...base, length: "-Infinity" }];`,
    ],
    [
      "[Array.prototype.every.call(digits, (value: number) => value > 0), Array.prototype.some.call(digits, (value: number, index: unknown, array: unknown) => array === digits && index === 1 && value === 2), Array.prototype.filter.call(digits, (value: number) => value !== 2), Array.prototype.map.call(digits, (value: number) => value * 2), Array.prototype.lastIndexOf.call(digits, 1), Array.prototype.includes.call(digits, 3), Array.prototype.find.call(digits, (value: number) => value > 1), Array.prototype.reduce.call(digits, (sum, value: number) => (typeof sum === 'number' ? sum + value : 0), 0)]",
      "const digits = { 0: 1, 1: 2, 2: 1, length: 3 };",
    ],
    "[Date.prototype.hasOwnProperty('constructor'), Math.hasOwnProperty('missing'), Object.prototype.hasOwnProperty.call(Array.prototype, 'map'), Object.hasOwn(Function, 'length')]",
  ],
  helpers: [
    ["double(4)", "const double = (value: number) => value * 2;"],
    [
      "factorial(5)",
      "const factorial = (value: number): number => (value <= 1 ? 1 : value * factorial(value - 1));",
    ],
    [
      "apply((value) => value + 1, 2)",
      "const apply = (fn: (value: number) => number, value: number) => fn(value);",
    ],
    ["[1, 2, 3].filter(isOdd)", "const isOdd = (value: number) => value % 2 !== 0;"],
    ["LIMIT * 2", "const LIMIT = 21;"],
    [
      "classify(5)",
      `function classify(value: number) {
        if (value < 0) return "negative";
        const half = Math.floor(value / 2);
        if (half * 2 === value) return "even";
        return "odd";
      }`,
    ],
    [
      "describe(Color.Green)",
      `enum Color { Red, Green }
      const describe = (color: Color) => {
        switch (color) {
          case Color.Red:
            return "red";
          default:
            return "other";
        }
      };`,
    ],
    [
      "sum([1, 2, 3])",
      "const sum = (values: number[]): number => (values.length === 0 ? 0 : values[0] + sum(values.slice(1)));",
    ],
    [
      "getLength({ x: 3, y: 4 })",
      "const getLength = (point: { x: number; y: number }) => { const { x, y } = point; return x * x + y * y; };",
    ],
    ["[getOr(), getOr(2)]", "const getOr = (value?: number) => value ?? 7;"],
    [
      "run()",
      "const run = () => { const add = (value: number, step = 1) => value + step; return [add(1), add(1, undefined), add(1, 5)]; };",
    ],
    ["run()", "const run = () => { const nothing = () => {}; return nothing(); };"],
    ["run()", "const run = () => { let value: number | undefined; return value; };"],
    [
      "run()",
      "const run = () => { const values: number[] = [1]; const [first, second] = values; return [first, second]; };",
    ],
    [
      "run()",
      "const run = () => { const values: (number | undefined)[] = [undefined, 2, 3]; const [first = 5, ...rest] = values; const [, , , fourth = 9] = values; return [first, rest, fourth]; };",
    ],
    [
      "run()",
      "const run = () => { const point: { x?: number; y: number } = { y: 2 }; const { x = 7, y = 8 } = point; return [x, y]; };",
    ],
    [
      "run()",
      "const run = () => { const [first, ...{ length, 0: second, 5: sixth = 4 }] = [1, 2, 3]; return [first, length, second, sixth]; };",
    ],
    ["call()", "let call = () => 4;"],
    [
      "count(new Set([1, 2, 3]))",
      "const count = (values: Set<number>) => { const isLarge = (value: number) => value > 1; return [...values].filter(isLarge).length; };",
    ],
  ],
};

describe.each(Object.entries(CASES))("%s", (_, cases) => {
  it.each(cases.map((entry) => (typeof entry === "string" ? [entry, ""] : entry)))(
    "%s",
    async (expression, setup) => {
      const result = await evaluateExpression(expression, setup);
      expect(result.actual).toBe(result.expected);
    },
  );
});
