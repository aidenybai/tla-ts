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
        name: "arguments in a field's initializer",
        source: "class C { x = arguments; }",
        accepted: "class C { x = function () { arguments; }; }",
      },
    ]);
  });
});
