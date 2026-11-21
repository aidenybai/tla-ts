import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vite-plus/test";

const FIXTURES = join(import.meta.dirname, "../fixtures/typescript/cli");

const CLI = join(import.meta.dirname, "../../src/cli.ts");

const copies: string[] = [];

afterAll(() => copies.forEach((copy) => rmSync(copy, { recursive: true, force: true })));

// Each run works in a copy, so a test can see that the CLI writes nothing beside the file.
const copyFixtures = (directory: string) => {
  const copy = mkdtempSync(join(tmpdir(), "tla-ts-typescript-"));
  copies.push(copy);
  cpSync(join(FIXTURES, directory), copy, { recursive: true });
  return copy;
};

const runCli = (directory: string, args: string[]) =>
  spawnSync("bun", [CLI, ...args], { cwd: directory, encoding: "utf8" });

// The code and stderr of a run, without the stack frames that Node prints and tla-ts doesn't, or
// the version of Node, which Bun gives the CLI as its own.
const getExit = (result: ReturnType<typeof runCli>) => [
  result.status,
  result.stderr
    .replace(/(?:\n {4}at [^\n]*?)+( \{)?(?=\n)/g, "$1")
    .replace(/\nNode\.js v[\d.]+\n$/, "\nNode.js\n"),
];

const runNode = (directory: string, file: string) =>
  spawnSync(process.execPath, [file], { cwd: directory, encoding: "utf8" });

describe("the CLI with TypeScript files", () => {
  // ESCore parses each character of a JSON string and each element of a JSON array in a loop of its
  // own, which overflowed the check's stack where its CASE nested a call for each one.
  const getLongInputs = (offset: number) => ({
    "string.ts": `const text = JSON.parse(JSON.stringify("a".repeat(20000)));\nif (text.length !== ${20000 + offset}) throw new Error("length");\n`,
    "array.ts": `const items = JSON.parse("[" + "0,".repeat(7999) + "0]");\nif (items.length !== ${8000 + offset}) throw new Error("length");\n`,
  });

  it.each(["string.ts", "array.ts"] as const)(
    "checks %s, which loops over a long input, as Node runs it",
    (file) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, file), getLongInputs(0)[file]);
      expect(runNode(directory, file).status).toBe(0);
      const result = runCli(directory, [file]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    },
  );

  it.each(["string.ts", "array.ts"] as const)(
    "exits with Node's code and stderr where %s, which loops over a long input, throws",
    (file) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, file), getLongInputs(1)[file]);
      const result = runCli(directory, [file]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, file)));
      expect(result.status).toBe(1);
    },
  );

  it("checks a TypeScript file without writing the TLA+ spec and config it compiles to", () => {
    const directory = copyFixtures("passing");
    const files = readdirSync(directory);
    const result = runCli(directory, ["counter.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`Parsing file ${join(realpathSync(directory), "counter.ts")}`);
    expect(result.stdout).toContain("Model checking completed. No error has been found.");
    expect(result.stdout).toContain("4 distinct states found");
    expect(readdirSync(directory)).toEqual(files);
  });

  // Skipped until ESCore runs JSX: its compile stops at a namespace's declaration.
  it.skip("checks a file of JSX", () => {
    const directory = copyFixtures("passing");
    cpSync(join(FIXTURES, "../jsx/likes.tsx"), join(directory, "likes.tsx"));
    const result = runCli(directory, ["likes.tsx"]);
    expect(result.status).toBe(12);
    expect(result.stdout).toContain(`Parsing file ${join(realpathSync(directory), "likes.tsx")}`);
    expect(result.stdout).toContain("Invariant showsNoNegativeCount is violated.");
  });

  it("prints a line for each exported function that it calls nowhere, and checks the rest", () => {
    const result = runCli(copyFixtures("passing"), ["library.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      "tla-ts calls no apply: its parameter transform takes values it can't list",
    );
    expect(result.stdout).toContain("Model checking completed. No error has been found.");
  });

  // Skipped until ESCore prints what Node prints for an error that nothing catches, whose stack V8
  // writes, as the wrong variant throws one.
  it.skip("checks a script", () => {
    const directory = copyFixtures("passing");
    const result = runCli(directory, ["script.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Model checking completed. No error has been found.");
    writeFileSync(
      join(directory, "wrong.ts"),
      readFileSync(join(directory, "script.ts"), "utf8").replace("!== 6", "!== 7"),
    );
    const wrong = runCli(directory, ["wrong.ts"]);
    expect(getExit(wrong)).toEqual(getExit(runNode(directory, "wrong.ts")));
    expect(wrong.status).toBe(1);
  });

  // Node exits with 0 once the jobs run out, though a promise is still pending.
  it("succeeds where a script runs to its end with a promise pending, as Node does", () => {
    const directory = copyFixtures("passing");
    const script =
      "const box = { count: 0 };\nconst pending = new Promise<void>(() => {});\npending.then(() => {\n  box.count = 1;\n});\nbox.count = 2;\n";
    writeFileSync(join(directory, "pending.ts"), script);
    const result = runCli(directory, ["pending.ts"]);
    expect([result.status, result.stderr]).toEqual([0, ""]);
    expect(result.stdout).toContain("Model checking completed. No error has been found.");
    writeFileSync(join(directory, "awaited.ts"), `${script}await pending;\n`);
    expect(runCli(directory, ["awaited.ts"]).status).toBe(13);
  });

  it("exits with Node's warning where a script's top-level await never settles", () => {
    const directory = copyFixtures("passing");
    const script =
      "let count = 0;\nif (count === 0) {\n  await new Promise(() => {});\n  count = 1;\n}\n";
    writeFileSync(join(directory, "stuck.ts"), script);
    const result = runCli(directory, ["stuck.ts"]);
    expect([result.status, result.stderr]).toEqual([
      13,
      `Warning: Detected unsettled top-level await at ${pathToFileURL(join(realpathSync(directory), "stuck.ts")).href}:3\n  await new Promise(() => {});\n  ^\n\n\n\n`,
    ]);
    writeFileSync(
      join(directory, "settled.ts"),
      script.replace("new Promise(() => {})", "Promise.resolve()"),
    );
    const settled = runCli(directory, ["settled.ts"]);
    expect([settled.status, settled.stderr]).toEqual([0, ""]);
  });

  // Each script has a variant that catches what it throws, which exits as a script that finishes.
  it.each([
    ["a primitive", "throw 42;\n", "try {\n  throw 42;\n} catch {}\n"],
    [
      "a primitive in a function",
      'const fail = () => {\n  throw "in";\n};\nfail();\n',
      'const fail = () => {\n  throw "in";\n};\ntry {\n  fail();\n} catch {}\n',
    ],
    [
      "a primitive in an ES module",
      'await Promise.resolve();\nthrow "after";\n',
      'await Promise.resolve();\ntry {\n  throw "after";\n} catch {}\n',
    ],
    [
      "a rejection with a string",
      'Promise.reject("no");\n',
      'Promise.reject("no").catch(() => {});\n',
    ],
    [
      "a rejection with undefined",
      "Promise.reject(undefined);\n",
      "Promise.reject(undefined).catch(() => {});\n",
    ],
    [
      "an error of a subclass that names itself",
      'class Oops extends Error {}\nclass Named extends Oops {\n  name = "Custom";\n}\nthrow new Named("named");\n',
      'class Oops extends Error {}\nclass Named extends Oops {\n  name = "Custom";\n}\ntry {\n  throw new Named("named");\n} catch {}\n',
    ],
    [
      "an error that a function makes and a script throws",
      'const make = (n: number) => new TypeError("made " + n);\nlet n = 2;\n\tif (n > 1) throw make(n);\n',
      'const make = (n: number) => new TypeError("made " + n);\nlet n = 2;\nif (n > 2) throw make(n);\n',
    ],
    [
      "an error that a promise rejects with",
      'const fail = async () => {\n  throw new Error("in");\n};\nfail();\n',
      'const fail = async () => {\n  throw new Error("in");\n};\nfail().catch(() => {});\n',
    ],
    [
      "an error in a module whose exported functions it calls none of",
      'export const apply = (f: () => number) => f();\nconst total = [1].length;\nif (total !== 2) throw new RangeError("total " + total);\n',
      'export const apply = (f: () => number) => f();\nconst total = [1].length;\nif (total !== 1) throw new RangeError("total " + total);\n',
    ],
    [
      "a throw in an async function",
      "const fail = async () => {\n  throw 1;\n};\nfail();\n",
      "const fail = async () => {\n  throw 1;\n};\nfail().catch(() => {});\n",
    ],
  ])("exits with Node's code and stderr where a script leaves %s uncaught", (_, script, caught) => {
    const directory = copyFixtures("passing");
    writeFileSync(join(directory, "uncaught.ts"), script);
    const result = runCli(directory, ["uncaught.ts"]);
    expect(getExit(result)).toEqual(getExit(runNode(directory, "uncaught.ts")));
    expect(result.status).toBe(1);
    writeFileSync(join(directory, "caught.ts"), caught);
    expect(getExit(runCli(directory, ["caught.ts"]))).toEqual([0, ""]);
  });

  // Skipped until ESCore prints what Node prints for an error that nothing catches, whose stack V8
  // writes: the CLI stops instead.
  it.skip.each([
    [
      "an error",
      'const total = [1].length;\nif (total !== 2) throw new RangeError("total " + total);\n',
      'const total = [1].length;\nif (total !== 1) throw new RangeError("total " + total);\n',
    ],
    [
      "an error without a message",
      "throw new Error();\n",
      "try {\n  throw new Error();\n} catch {}\n",
    ],
    [
      "an error of a subclass",
      'class Oops extends Error {}\nthrow new Oops("oops");\n',
      'class Oops extends Error {}\ntry {\n  throw new Oops("oops");\n} catch {}\n',
    ],
    [
      "an error in a function",
      'const fail = () => {\n  throw new TypeError("in");\n};\nfail();\n',
      'const fail = () => {\n  throw new TypeError("in");\n};\ntry {\n  fail();\n} catch {}\n',
    ],
    [
      "an error in an ES module",
      'await Promise.resolve();\nthrow new Error("after");\n',
      'await Promise.resolve();\ntry {\n  throw new Error("after");\n} catch {}\n',
    ],
  ])("exits with Node's code and stderr where a script leaves %s uncaught", (_, script, caught) => {
    const directory = copyFixtures("passing");
    writeFileSync(join(directory, "uncaught.ts"), script);
    const result = runCli(directory, ["uncaught.ts"]);
    expect(getExit(result)).toEqual(getExit(runNode(directory, "uncaught.ts")));
    expect(result.status).toBe(1);
    writeFileSync(join(directory, "caught.ts"), caught);
    expect(getExit(runCli(directory, ["caught.ts"]))).toEqual([0, ""]);
  });

  it("exits with TLC's code where an action throws what nothing catches", () => {
    const directory = copyFixtures("passing");
    writeFileSync(
      join(directory, "action.ts"),
      'let count = 0;\n\nexport const step = () => {\n  if (count === 1) throw new Error("one");\n  count = 1;\n};\n',
    );
    const result = runCli(directory, ["action.ts"]);
    expect([result.status, result.stderr]).toEqual([14, ""]);
    expect(result.stdout).toContain('the second argument was:\n"one"');
  });

  // Skipped until ESCore checks a model that imports files: its compile stops as it compiles the
  // model as a script.
  it.skip("reads names that a module re-exports", () => {
    const result = runCli(copyFixtures("project"), ["relay.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4 distinct states found");
  });

  // Skipped until ESCore prints what Node prints for an error that nothing catches, as above.
  it.skip("reads a file that a project's model imports without an extension, as Node reads it with one", () => {
    const getModel = (total: number, specifier: string) =>
      `import { STEP } from "${specifier}";\n\nif (4 + STEP !== ${total}) throw new Error("total");\n`;
    const directory = copyFixtures("project");
    const nodeDirectory = copyFixtures("project");
    [directory, nodeDirectory].forEach((innerDirectory) =>
      writeFileSync(join(innerDirectory, "step.ts"), "export const STEP = 3;\n"),
    );
    writeFileSync(join(directory, "model.ts"), getModel(7, "./step"));
    writeFileSync(join(directory, "wrong.ts"), getModel(8, "./step"));
    writeFileSync(join(nodeDirectory, "model.ts"), getModel(7, "./step.ts"));
    writeFileSync(join(nodeDirectory, "wrong.ts"), getModel(8, "./step.ts"));
    expect(runNode(nodeDirectory, "model.ts").status).toBe(0);
    expect(runCli(directory, ["model.ts"]).status).toBe(0);
    expect(runNode(nodeDirectory, "wrong.ts").status).toBe(1);
    expect(runCli(directory, ["wrong.ts"]).status).toBe(1);
  });

  it("checks the module that re-exports names", () => {
    expect(runCli(copyFixtures("project"), ["barrel.ts"]).status).toBe(0);
  });

  // Skipped until ESCore checks a model that imports files, as above.
  it.skip("checks a file of a project with the project's tsconfig.json", () => {
    const result = runCli(copyFixtures("project"), ["counter.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4 distinct states found");
  });

  // Skipped until ESCore checks a model that imports files, as above.
  it.skip("checks a project whose declaration files import Node's built-in modules", () => {
    const directory = copyFixtures("project");
    const types = join(directory, "types/host");
    mkdirSync(types, { recursive: true });
    writeFileSync(
      join(types, "events.d.ts"),
      'declare module "node:events" {\n  export class EventEmitter {}\n}\n',
    );
    writeFileSync(
      join(types, "index.d.ts"),
      '/// <reference path="./events.d.ts" />\nimport type { EventEmitter } from "node:events";\n\nexport type HostEmitter = EventEmitter;\n',
    );
    writeFileSync(
      join(directory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          lib: ["esnext"],
          types: ["host"],
          typeRoots: ["./types"],
          paths: { "@limits/*": ["./limits/*"] },
        },
        include: ["*.ts", "limits/*.ts"],
      }),
    );
    const result = runCli(directory, ["counter.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4 distinct states found");
  });

  // Skipped until ESCore stops at a name that only a declaration file gives: it runs the read, whose
  // ReferenceError's message V8 writes, and stops there.
  it.skip("stops where a model reads a name that only a declaration file gives", () => {
    const directory = copyFixtures("project");
    writeFileSync(join(directory, "host.d.ts"), "declare const hostLimit: number;\n");
    writeFileSync(
      join(directory, "host.ts"),
      '/// <reference path="./host.d.ts" />\nlet count = 0;\n\nexport const tick = () => {\n  count = hostLimit;\n};\n',
    );
    const result = runCli(directory, ["host.ts"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "host.ts:5:11 tla-ts can't run hostLimit, which only a declaration gives",
    );
  });

  // Skipped until ESCore stops at a name that only a declaration file gives, as above.
  it.skip("stops where a model reads a global that the rest of its project declares", () => {
    const directory = copyFixtures("project");
    writeFileSync(join(directory, "environment.d.ts"), "declare const hostLimit: number;\n");
    writeFileSync(
      join(directory, "host.ts"),
      "let count = 0;\n\nexport const tick = () => {\n  count = hostLimit;\n};\n",
    );
    const result = runCli(directory, ["host.ts"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "host.ts:4:11 tla-ts can't run hostLimit, which only a declaration gives",
    );
  });

  // Skipped until ESCore checks a model that imports files, as above.
  it.skip("checks a file of a project where a file it doesn't import has type errors", () => {
    const directory = copyFixtures("project");
    writeFileSync(join(directory, "broken.ts"), 'export const limit: number = "three";\n');
    const result = runCli(directory, ["counter.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4 distinct states found");
  });

  it("prints a counterexample as TLC does and exits with TLC's code", () => {
    const result = runCli(copyFixtures("failing"), ["overdraft.ts"]);
    expect(result.status).toBe(12);
    expect(result.stdout).toContain("Error: Invariant noOverdraft is violated.");
    expect(result.stdout).toContain("balances = [alice |-> 6, bob |-> -2]");
  });

  it("checks TypeScript and TLA+ files together", () => {
    const directory = copyFixtures("failing");
    cpSync(join(FIXTURES, "../examples/hour-clock"), directory, { recursive: true });
    const result = runCli(directory, ["HourClock.tla", "overdraft.ts"]);
    expect(result.status).toBe(12);
    expect(result.stdout).toContain("Checking HourClock.tla with HourClock.cfg");
    expect(result.stdout).toContain("Checking overdraft.ts");
  });

  it("reports a file that doesn't compile and checks the rest", () => {
    const directory = copyFixtures("failing");
    writeFileSync(join(directory, "evaluated.ts"), 'const total = eval("1 + 1");\n');
    const result = runCli(directory, ["evaluated.ts", "overdraft.ts"]);
    expect(result.stdout).toContain("Checking evaluated.ts\n");
    expect(result.stderr).toContain("TlaTypeScriptError: evaluated.js:1:15 tla-ts can't run eval");
    expect(result.stdout).toContain("Error: Invariant noOverdraft is violated.");
    expect(result.status).not.toBe(0);
  });

  it("checks a TypeScript file with the config -config names", () => {
    const directory = copyFixtures("passing");
    writeFileSync(join(directory, "small.cfg"), "INIT Init\nNEXT Next\nINVARIANT IsSmall\n");
    const result = runCli(directory, ["counter.ts", "-config", "small.cfg"]);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(
      "Error: The invariant IsSmall specified in the configuration file",
    );
  });

  it("checks a TypeScript file beside a spec of its module's name", () => {
    const directory = copyFixtures("passing");
    writeFileSync(join(directory, "Counter.tla"), "---- MODULE Counter ----\n====\n");
    writeFileSync(join(directory, "Counter.cfg"), "INIT Missing\n");
    const result = runCli(directory, ["counter.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4 distinct states found");
    expect(readFileSync(join(directory, "Counter.tla"), "utf8")).toBe(
      "---- MODULE Counter ----\n====\n",
    );
  });

  // Skipped until ESCore prints what Node prints for an error that nothing catches, as above.
  it.skip("checks a helper that calls itself with the function that it takes", () => {
    const directory = copyFixtures("passing");
    const getSource = (expected: number) =>
      `function sumBy(xs: number[], f: (x: number) => number, i: number): number {\n  return i < xs.length ? f(xs[i]) + sumBy(xs, f, i + 1) : 0;\n}\nconst seen = sumBy([1, 2, 3], (x) => x * x, 0);\nif (seen !== ${expected}) throw new Error("seen " + seen);\n`;
    writeFileSync(join(directory, "sum.ts"), getSource(14));
    const result = runCli(directory, ["sum.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Model checking completed. No error has been found.");
    writeFileSync(join(directory, "wrong.ts"), getSource(15));
    const wrong = runCli(directory, ["wrong.ts"]);
    expect(wrong.status).toBe(1);
    expect(wrong.stderr).toContain("Error: seen 14");
  });

  // Node runs each kind of file: .mts and .mjs as ES modules, .cts and .cjs as CommonJS, and .ts
  // and .js, in a package that names no type, by their syntax.
  it.each(["ts", "mts", "cts", "js", "mjs", "cjs"])(
    "exits with Node's code and stderr where a .%s file leaves an error uncaught",
    (extension) => {
      const directory = copyFixtures("passing");
      const annotation = extension.endsWith("ts") ? ": number" : "";
      const getScript = (limit: number) =>
        `const total${annotation} = [1].length;\nif (total !== ${limit}) throw new RangeError("total " + total);\n`;
      writeFileSync(join(directory, `uncaught.${extension}`), getScript(2));
      const result = runCli(directory, [`uncaught.${extension}`]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, `uncaught.${extension}`)));
      expect(result.status).toBe(1);
      writeFileSync(join(directory, `caught.${extension}`), getScript(1));
      expect(getExit(runCli(directory, [`caught.${extension}`]))).toEqual([0, ""]);
    },
  );

  // Node's type stripping rejects syntax that it can't strip, which it runs in JavaScript.
  it.each([
    ["a with statement", "const o = { a: 1 };\nlet x = 2;\n  with (o) { a; }\nx++;\n"],
    ["a function that an if declares", "let x = 1;\nif (x) function f() {}\n"],
  ])("exits with Node's code and stderr where TypeScript holds %s", (_, code) => {
    const directory = copyFixtures("passing");
    writeFileSync(join(directory, "rejected.ts"), code);
    const result = runCli(directory, ["rejected.ts"]);
    expect(getExit(result)).toEqual(getExit(runNode(directory, "rejected.ts")));
    expect(result.status).toBe(1);
    writeFileSync(join(directory, "accepted.js"), code);
    expect(getExit(runCli(directory, ["accepted.js"]))).toEqual([0, ""]);
  });

  // Node runs no JSX, which compiles as TypeScript emits it, by the project's settings, or by
  // React's automatic runtime without a project, here by the factory its pragma names.
  it("checks a .jsx file as TypeScript emits it", () => {
    const directory = copyFixtures("passing");
    const getScript = (expected: string) =>
      `/** @jsxRuntime classic */\n/** @jsx h */\nconst h = (type, props, ...children) => type + "(" + children.join(",") + ")";\nconst view = <p>{1}<b>x</b></p>;\nif (view !== "${expected}") throw new Error(view);\n`;
    writeFileSync(join(directory, "view.jsx"), getScript("p(1,b(x))"));
    expect(getExit(runCli(directory, ["view.jsx"]))).toEqual([0, ""]);
    writeFileSync(join(directory, "wrong.jsx"), getScript("p(b(x))"));
    const wrong = runCli(directory, ["wrong.jsx"]);
    expect(wrong.status).toBe(1);
    expect(wrong.stderr).toContain("Error: p(1,b(x))");
  });

  it("exits with Node's warning where a module's top-level await never settles", () => {
    const directory = copyFixtures("passing");
    const script =
      "let count = 0;\nif (count === 0) {\n  await new Promise(() => {});\n  count = 1;\n}\n";
    writeFileSync(join(directory, "stuck.ts"), script);
    const result = runCli(directory, ["stuck.ts"]);
    expect(getExit(result)).toEqual(getExit(runNode(directory, "stuck.ts")));
    expect(result.status).toBe(13);
    writeFileSync(
      join(directory, "settled.ts"),
      script.replace("new Promise(() => {})", "Promise.resolve()"),
    );
    expect(getExit(runCli(directory, ["settled.ts"]))).toEqual([0, ""]);
  });

  it("tells a program whose check overflows its stack, though Node runs it", () => {
    const directory = copyFixtures("passing");
    writeFileSync(
      join(directory, "deep.ts"),
      'const depth = (n: number): number => (n === 0 ? 0 : 1 + depth(n - 1));\nif (depth(1000) !== 1000) throw new Error("wrong depth");\n',
    );
    expect(getExit(runNode(directory, "deep.ts"))).toEqual([0, ""]);
    expect(getExit(runCli(directory, ["deep.ts"]))).toEqual([
      255,
      "TlaStackLimitError: tla-ts can't check this program within the stack: its check overflowed its 8 MB stack at depth 0\n",
    ]);
  });

  it("stops where a script leaves an error uncaught whose properties Node prints", () => {
    const directory = copyFixtures("passing");
    writeFileSync(join(directory, "error.ts"), 'throw new RangeError("total", { cause: 1 });\n');
    const result = runCli(directory, ["error.ts"]);
    expect(result.status).not.toBe(1);
    expect(result.stdout).toContain(
      "tla-ts can't print what Node prints for this uncaught exception",
    );
  });

  // Under Bun, a Node on the path parses each file for its early errors, as V8 does, and TypeScript's
  // checker never runs, whose inference of a long chain of JSDoc types, as a large program's code
  // makes, runs out of stack.
  describe("parses a file under Bun as Node does", () => {
    const getScript = (expected: number) =>
      `${Array.from({ length: 3000 }, (_, index) => `/** @typedef {Kind${index + 1} | ${index}} Kind${index} */`).join("\n")}\n/** @typedef {3000} Kind3000 */\n/** @type {Kind0} */\nconst kind = [0].length - 1;\nif (kind !== ${expected}) throw new RangeError("kind " + kind);\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "kinds.js"), getScript(0));
      const result = runCli(directory, ["kinds.js"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "kinds.js"), getScript(1));
      const result = runCli(directory, ["kinds.js"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "kinds.js")));
      expect(result.status).toBe(1);
    });

    // Where no Node is on the path, as in a browser, TypeScript's checks find the early errors.
    const runWithoutNode = (directory: string, source: string) => {
      writeFileSync(join(directory, "kinds.js"), source);
      const bun = spawnSync("bun", ["-e", "console.log(process.execPath)"], { encoding: "utf8" });
      const empty = mkdtempSync(join(tmpdir(), "tla-ts-path-"));
      copies.push(empty);
      return spawnSync(bun.stdout.trim(), [CLI, "kinds.js"], {
        cwd: directory,
        encoding: "utf8",
        env: { ...process.env, PATH: empty },
      });
    };
    const getSmallScript = (expected: number) =>
      `const kind = [0].length - 1;\nif (kind !== ${expected}) throw new RangeError("kind " + kind);\n`;

    it("agrees with Node where no Node is on the path", () => {
      const result = runWithoutNode(copyFixtures("passing"), getSmallScript(0));
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result where no Node is on the path", () => {
      const directory = copyFixtures("passing");
      const result = runWithoutNode(directory, getSmallScript(1));
      expect(getExit(result)).toEqual(getExit(runNode(directory, "kinds.js")));
      expect(result.status).toBe(1);
    });

    it("stops where TypeScript's checks run out of stack and no Node is on the path", () => {
      const result = runWithoutNode(copyFixtures("passing"), getScript(0));
      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).toContain(
        "tla-ts can't tell whether Node rejects a file's syntax without a Node to parse it",
      );
    });
  });

  // The CLI runs an entry as Node loads the path it's given: a .cjs file, or a .js file that no
  // package types, in Node's CommonJS wrapper, a .js file with module syntax as a module, as Node
  // 26 detects it, and a .js file in a package of "type": "module" as a module.
  describe.each([
    [
      "a CommonJS entry that requires a file",
      "main.cjs",
      (expected: number) =>
        `const helper = require("./helper.cjs");\nif (helper.two !== ${expected} || typeof __filename !== "string" || typeof __dirname !== "string" || module.exports !== exports) throw new Error("helper " + helper.two);\n`,
    ],
    [
      "a .js entry whose syntax makes it a module",
      "main.js",
      (expected: number) =>
        `export const two = await Promise.resolve(2);\nif (two !== ${expected}) throw new Error("two " + two);\n`,
    ],
    [
      "a .js entry in a package of modules",
      "typed/main.js",
      (expected: number) =>
        `const two = typeof import.meta.url === "string" ? 2 : 0;\nif (two !== ${expected}) throw new Error("two " + two);\n`,
    ],
  ])("runs %s as Node does", (_, file, getScript) => {
    const write = (expected: number) => {
      const directory = copyFixtures("passing");
      mkdirSync(join(directory, "typed"));
      writeFileSync(join(directory, "typed/package.json"), '{ "type": "module" }\n');
      writeFileSync(join(directory, "helper.cjs"), "module.exports = { two: 2 };\n");
      writeFileSync(join(directory, file), getScript(expected));
      return directory;
    };

    it("agrees with Node", () => {
      const directory = write(2);
      expect(runNode(directory, file).status).toBe(0);
      expect(getExit(runCli(directory, [file]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = write(3);
      const result = runCli(directory, [file]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, file)));
      expect(result.status).toBe(1);
    });
  });

  // A file in a folder below its package's, given by a relative path, runs in its package's type,
  // as Node finds the package from the file's own folder up to the working one.
  it("exits with Node's code and stderr for a module below its package, given by a relative path", () => {
    const directory = copyFixtures("passing");
    mkdirSync(join(directory, "lib"));
    writeFileSync(join(directory, "package.json"), '{ "type": "module" }\n');
    const getScript = (limit: number) =>
      `const total = [1].length;\nif (total !== ${limit}) throw new RangeError("total " + total);\n`;
    writeFileSync(join(directory, "lib/main.js"), getScript(1));
    expect(getExit(runCli(directory, ["lib/main.js"]))).toEqual([0, ""]);
    writeFileSync(join(directory, "lib/main.js"), getScript(2));
    const result = runCli(directory, ["lib/main.js"]);
    expect(getExit(result)).toEqual(getExit(runNode(directory, "lib/main.js")));
    expect(result.status).toBe(1);
  });
});
