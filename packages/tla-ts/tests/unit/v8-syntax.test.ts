import { spawnSync } from "node:child_process";
import { Script } from "node:vm";
import { describe, expect, it } from "vite-plus/test";
import { getV8SyntaxError } from "../../src/typescript/v8-syntax/parser";

// The SyntaxError that Node's V8 throws as it parses a script or a module, with its line, or
// undefined where it accepts the source: a script through vm, and a module through Node's check,
// which prints the line of the error.
const getNodeError = (source: string, isModule: boolean) => {
  if (!isModule) {
    try {
      new Script(source, { filename: "source.js" });
      return undefined;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      const line = /:(\d+)$/.exec(error.stack?.split("\n")[0] ?? "")?.[1];
      return { message: error.message, line: Number(line ?? 1) };
    }
  }
  const run = spawnSync(process.execPath, ["--input-type=module", "--check"], {
    input: source,
    encoding: "utf8",
  });
  if (run.status === 0) return undefined;
  const lines = run.stderr.split("\n");
  const message = lines.find((line) => line.startsWith("SyntaxError: "));
  const line = /:(\d+)$/.exec(lines.find((inner) => /^\[stdin\]:\d+$/.test(inner)) ?? "")?.[1];
  return {
    message: message?.slice("SyntaxError: ".length),
    line: Number(line ?? 1),
  };
};

interface SyntaxCase {
  name: string;
  source: string;
  // A program that differs from the source only where V8 accepts it.
  accepted: string;
  isModule?: boolean;
}

// Each source V8 rejects as tla-ts does, with V8's message and line, and its accepted variant
// that both accept.
const checkCases = (cases: SyntaxCase[]) => {
  it.each(cases)("rejects $name as V8 does", (item) => {
    const isModule = item.isModule ?? false;
    const expected = getNodeError(item.source, isModule);
    expect(expected).toBeDefined();
    expect(getV8SyntaxError(item.source, isModule)).toEqual(expected);
  });
  it.each(cases)("accepts the variant of $name as V8 does", (item) => {
    const isModule = item.isModule ?? false;
    expect(getNodeError(item.accepted, isModule)).toBeUndefined();
    expect(getV8SyntaxError(item.accepted, isModule)).toBeUndefined();
  });
};

describe("parse a file's syntax as V8 does without a Node to parse it", () => {
  describe("declarations", () => {
    checkCases([
      { name: "a let twice", source: "let a;\n\nlet a;", accepted: "let a;\n{ let a; }" },
      { name: "a let after a var", source: "var f;\nlet f;", accepted: "var f;\nvar f;" },
      {
        name: "a var in a block of the let's name",
        source: "{\n  let x;\n  var x;\n}",
        accepted: "{\n  let x;\n}\nvar x;",
      },
      {
        name: "a parameter's name that the body lets",
        source: "function f(a) {\n  let a;\n}",
        accepted: "function f(a) {\n  var a;\n}",
      },
      {
        name: "a non-simple parameter's name that the body lets",
        source: "function f(a = 1) {\n  let a;\n}",
        accepted: "function f(a = 1) {\n  var a;\n}",
      },
      {
        name: "a catch parameter that its block lets",
        source: "try {} catch (e) {\n  let e;\n}",
        accepted: "try {} catch (e) {\n  var e;\n}",
      },
      {
        name: "a catch pattern's name that its block vars",
        source: "try {} catch ([e]) {\n  var e;\n}",
        accepted: "try {} catch ([e]) {\n  var f;\n}",
      },
      {
        name: "a strict block's function twice",
        source: '"use strict";\n{ function f() {} function f() {} }',
        accepted: "{ function f() {} function f() {} }",
      },
      {
        name: "an import that a let redeclares",
        source: 'import a from "x";\nlet a;',
        accepted: 'import a from "x";\na;',
        isModule: true,
      },
      { name: "a let named let", source: "let let = 1;", accepted: "var let = 1;" },
      { name: "a const without a value", source: "const a;", accepted: "const a = 1;" },
      {
        name: "a private name twice",
        source: "class C {\n  #x;\n  #x() {}\n}",
        accepted: "class C {\n  get #x() {}\n  set #x(value) {}\n}",
      },
      {
        name: "an arrow function's parameter twice",
        source: "(a, a) => 1;",
        accepted: "(function (a, a) {});",
      },
    ]);
  });

  describe("strict mode", () => {
    checkCases([
      {
        name: "a with statement",
        source: '"use strict";\nwith (a) {}',
        accepted: '"use\\x20strict";\nwith (a) {}',
      },
      {
        name: "an octal literal before a later error",
        source: 'function f() {\n  "use strict";\n  010;\n  a b\n}',
        accepted: "function f() {\n  010;\n}",
      },
      { name: "a var named eval", source: '"use strict";\nvar eval;', accepted: "var eval;" },
      {
        name: "a function named eval that turns strict",
        source: 'function eval() {\n  "use strict";\n}',
        accepted: 'function f() {\n  "use strict";\n}',
      },
      {
        name: "a parameter twice in a function that turns strict",
        source: 'function f(a, a) {\n  "use strict";\n}',
        accepted: "function f(a, a) {}",
      },
      {
        name: "a strict directive after non-simple parameters",
        source: 'function f(a = 1) {\n  "use strict";\n}',
        accepted: 'function f(a) {\n  "use strict";\n}',
      },
      {
        name: "a delete of a name",
        source: '"use strict";\ndelete x;',
        accepted: '"use strict";\ndelete x.y;',
      },
      { name: "an \\8 escape", source: '"use strict";\n"\\8";', accepted: '"\\8";' },
      {
        name: "a reserved word as a name",
        source: '"use strict";\nimplements = 1;',
        accepted: "implements = 1;",
      },
    ]);
  });

  describe("control flow", () => {
    checkCases([
      { name: "a break outside a loop", source: "break;", accepted: "while (1) break;" },
      {
        name: "a continue outside a loop",
        source: "continue;",
        accepted: "while (1) continue;",
      },
      {
        name: "a continue to a block's label",
        source: "a: {\n  continue a;\n}",
        accepted: "a: while (1) {\n  continue a;\n}",
      },
      { name: "a break to no label", source: "break b;", accepted: "b: break b;" },
      { name: "a label twice", source: "a: a: ;", accepted: "a: b: ;" },
      {
        name: "two default clauses",
        source: "switch (1) {\n  default:\n  default:\n}",
        accepted: "switch (1) {\n  case 1:\n  default:\n}",
      },
      {
        name: "a return in a static block",
        source: "class C {\n  static {\n    return;\n  }\n}",
        accepted: "class C {\n  x;\n  static {\n    return;\n  }\n}",
      },
      { name: "a return in a script", source: "return;", accepted: "function f() { return; }" },
    ]);
  });

  describe("functions and classes", () => {
    checkCases([
      { name: "a getter's parameter", source: "({ get a(b) {} });", accepted: "({ get a() {} });" },
      { name: "a setter without one", source: "({ set a() {} });", accepted: "({ set a(b) {} });" },
      {
        name: "a setter's rest parameter",
        source: "({ set a(...b) {} });",
        accepted: "({ set a([...b]) {} });",
      },
      {
        name: "a parameter after a rest one",
        source: "function f(...a, b) {}",
        accepted: "function f(b, ...a) {}",
      },
      {
        name: "a rest parameter's initializer",
        source: "function f(...a = 1) {}",
        accepted: "function f(...[a = 1]) {}",
      },
      {
        name: "a constructor twice",
        source: "class C {\n  constructor() {}\n  constructor() {}\n}",
        accepted: "class C {\n  constructor() {}\n  static constructor() {}\n}",
      },
      {
        name: "a getter constructor",
        source: "class C { get constructor() {} }",
        accepted: "class C { get ['constructor']() {} }",
      },
      {
        name: "a generator constructor",
        source: "class C { *constructor() {} }",
        accepted: "class C { *['constructor']() {} }",
      },
      {
        name: "a static prototype",
        source: "class C { static prototype() {} }",
        accepted: "class C { prototype() {} }",
      },
      {
        name: "a field named constructor",
        source: "class C { constructor = 1 }",
        accepted: "class C { ['constructor'] = 1 }",
      },
      {
        name: "a super call in a method",
        source: "class C { m() { super(); } }",
        accepted: "class C extends Object { constructor() { super(); } }",
      },
      {
        name: "an undeclared private name",
        source: "class C {\n  m() {\n    this.#y;\n  }\n}",
        accepted: "class C {\n  #y;\n  m() {\n    this.#y;\n  }\n}",
      },
      {
        name: "a delete of a private field",
        source: "class C { #x; m() { delete this.#x; } }",
        accepted: "class C { #x; m() { delete this.x; } }",
      },
      {
        name: "an await in an async function's parameters",
        source: "async function f(a = await 1) {}",
        accepted: "async function f() { await 1; }",
      },
      {
        name: "a yield in a generator's parameters",
        source: "function* g(a = yield) {}",
        accepted: "function* g() { yield; }",
      },
      {
        name: "a parameter past V8's limit",
        source: `function f(\n${Array.from({ length: 65526 }, (_, index) => `a${index}`).join()}\n) {}`,
        accepted: `function f(\n${Array.from({ length: 65525 }, (_, index) => `a${index}`).join()}\n) {}`,
      },
      {
        name: "an argument past V8's limit",
        source: `f(\n${Array(65526).fill(0).join()}\n);`,
        accepted: `f(\n${Array(65525).fill(0).join()}\n);`,
      },
      {
        name: "arguments in a field's initializer",
        source: "class C { x = arguments; }",
        accepted: "class C { x = function () { arguments; }; }",
      },
    ]);
  });

  describe("modules", () => {
    checkCases([
      {
        name: "an export of no declaration",
        source: "export { x };",
        accepted: "let x;\nexport { x };",
        isModule: true,
      },
      {
        name: "an export twice",
        source: "export let a;\nexport { a };",
        accepted: "export let a;\nexport { a as b };",
        isModule: true,
      },
      {
        name: "a string export name without a from",
        source: 'export { "a" };',
        accepted: 'export { "a" } from "x";',
        isModule: true,
      },
      {
        name: "an export name's lone surrogate",
        source: 'export { "\\uD800" as a } from "x";',
        accepted: 'export { "\\uD800\\uDC00" as a } from "x";',
        isModule: true,
      },
      {
        name: "an import attribute twice",
        source: 'import a from "x" with { type: "json", type: "json" };',
        accepted: 'import a from "x" with { type: "json" };',
        isModule: true,
      },
      { name: "a let named await", source: "let await;", accepted: "let wait;", isModule: true },
      {
        name: "an HTML comment",
        source: "x;\n<!-- y",
        accepted: "x;\n// y",
        isModule: true,
      },
      { name: "import.meta in a script", source: "import.meta;", accepted: "import('x');" },
      { name: "an import in a script", source: 'import x from "y";', accepted: "x;" },
      { name: "a new of an import call", source: 'new import("x");', accepted: 'import("x");' },
    ]);
  });

  describe("expressions", () => {
    checkCases([
      {
        name: "an assignment to a number, but not to a call, which V8 throws for as it runs",
        source: "1 = 2;",
        accepted: "f() = 2;",
      },
      { name: "a prefix increment of a postfix one", source: "++a++;", accepted: "++a;" },
      {
        name: "__proto__ twice",
        source: "({ __proto__: 1, __proto__: 2 });",
        accepted: '({ __proto__: 1, ["__proto__"]: 2 });',
      },
      {
        name: "a shorthand property's initializer",
        source: "({ a = 1 });",
        accepted: "({ a = 1 } = {});",
      },
      { name: "an assignment to an optional chain", source: "a?.b = 1;", accepted: "a.b = 1;" },
      {
        name: "a tagged template on an optional chain",
        source: "a?.b`c`;",
        accepted: "a.b`c`;",
      },
      { name: "?? beside ||", source: "a ?? b || c;", accepted: "(a ?? b) || c;" },
      {
        name: "a for-of declaration's initializer",
        source: "for (let x = 1 of y);",
        accepted: "for (var x = 1 in y);",
      },
      {
        name: "a for-of of async",
        source: "for (async of x);",
        accepted: "for ((async) of x);",
      },
      { name: "a for-of of let", source: "for (let of x);", accepted: "for ((let) of x);" },
      {
        name: "new.target outside a function",
        source: "new.target;",
        accepted: "function f() { new.target; }",
      },
      { name: "a unary operator before **", source: "-1 ** 2;", accepted: "(-1) ** 2;" },
      {
        name: "a rest element before another",
        source: "[...a, b] = c;",
        accepted: "[b, ...a] = c;",
      },
      { name: "a template's bad escape", source: "`\\u{`;", accepted: "tag`\\u{`;" },
      { name: "two numeric separators", source: "1__0;", accepted: "1_0;" },
      { name: "accessor after an expression", source: "a accessor;", accepted: "a;\naccessor;" },
    ]);
  });

  describe("regular expressions", () => {
    checkCases([
      { name: "an unterminated group", source: "/(/;", accepted: "/\\(/;" },
      { name: "a flag twice", source: "/a/gg;", accepted: "/a/g;" },
      {
        name: "a capture group's name twice",
        source: "/(?<a>.)(?<a>.)/;",
        accepted: "/(?<a>.)|(?<a>.)/;",
      },
      { name: "an unknown property", source: "/\\p{Foo}/u;", accepted: "/\\p{L}/u;" },
      { name: "u and v flags together", source: "/a/uv;", accepted: "/a/v;" },
    ]);
  });
});
