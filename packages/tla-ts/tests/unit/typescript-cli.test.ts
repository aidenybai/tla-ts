import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { parseModule } from "../../src/parser";
import { DIST_CLI } from "./cli-harness";

const FIXTURES = join(import.meta.dirname, "../fixtures/typescript/cli");

const SOURCE_CLI = join(import.meta.dirname, "../../src/cli.ts");

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
  spawnSync(process.execPath, [DIST_CLI, ...args], { cwd: directory, encoding: "utf8" });

// The code and stderr of a run, without the stack frames that Node prints and tla-ts doesn't, or
// the version of Node.
const getExit = (result: ReturnType<typeof runCli>) => [
  result.status,
  result.stderr
    .replace(/(?:\n {4}at [^\n]*?)+( \{)?(?=\n)/g, "$1")
    .replace(/\nNode\.js v[\d.]+\n$/, "\nNode.js\n"),
];

const runNode = (directory: string, file: string) =>
  spawnSync(process.execPath, [file], { cwd: directory, encoding: "utf8" });

// Node runs no JSX, so a program of JSX runs as Node runs the JavaScript that TypeScript writes for
// each file of JSX, by its project's tsconfig.json, or with React's automatic runtime without one,
// in the format of a .js file: its package's type, or else its syntax.
const JSX_HOOKS = `import { createRequire, registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(join(import.meta.dirname, "../../package.json"))})("@typescript/typescript6");
const getType = (directory) => existsSync(join(directory, "package.json"))
  ? JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).type
  : dirname(directory) === directory ? undefined : getType(dirname(directory));
registerHooks({
  load: (url, context, next) => {
    if (!/\\.[jt]sx$/.test(url)) return next(url, context);
    const path = fileURLToPath(url);
    const config = ts.findConfigFile(dirname(path), ts.sys.fileExists);
    const project = config && ts.getParsedCommandLineOfConfigFile(config, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
    const options = project?.fileNames.includes(path) ? project.options : { jsx: ts.JsxEmit.ReactJSX };
    const source = ts.transpileModule(readFileSync(path, "utf8"), { fileName: path, compilerOptions: { ...options, noEmit: false } }).outputText;
    const type = getType(dirname(path));
    const isModule = type === undefined ? ts.isExternalModule(ts.createSourceFile(path, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS)) : type === "module";
    return { format: isModule ? "module" : "commonjs", source, shortCircuit: true };
  },
});`;

const runNodeOnJsx = (directory: string, file: string) =>
  spawnSync(
    process.execPath,
    ["--import", `data:text/javascript,${encodeURIComponent(JSX_HOOKS)}`, file],
    { cwd: directory, encoding: "utf8" },
  );

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

  it("lists globalThis's names in the order of Node's main thread, not of the CLI's worker", () => {
    const directory = copyFixtures("passing");
    writeFileSync(
      join(directory, "order.mts"),
      'const names = Object.getOwnPropertyNames(globalThis);\nif (names.indexOf("WebAssembly") < names.indexOf("process")) throw new Error("order");\n',
    );
    expect(runNode(directory, "order.mts").status).toBe(0);
    const result = runCli(directory, ["order.mts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Model checking completed. No error has been found.");
  });

  // The input stays as long as the one that overflowed the stack, whose throw string.ts checks in
  // about 24 s.
  it.each(["string.ts", "array.ts"] as const)(
    "exits with Node's code and stderr where %s, which loops over a long input, throws",
    (file) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, file), getLongInputs(1)[file]);
      const result = runCli(directory, [file]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, file)));
      expect(result.status).toBe(1);
    },
    120_000,
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

  // apply's transform, a callback of a number to a number, is any of 7 ** 7 = 823,543 tables, more
  // than a call with values in place of a type makes on any rung, as a number's values don't shrink.
  it("prints a line for each exported function that it calls nowhere, and checks the rest", () => {
    const result = runCli(copyFixtures("passing"), ["library.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      "tla-ts calls no apply: its parameters make 823,543 argument lists with callbacks as tables of their first argument, more than the 10,000 it calls with values in place of a type",
    );
    expect(result.stdout).toContain("Model checking completed. No error has been found.");
  });

  // A model whose top level throws stops at the check that its module runs, with the message that
  // Node throws, before any call of its functions.
  // A call's argument lists are every combination of its parameters' values, which the model lists
  // only where they're at most as many as TLC puts in a set, as -maxSetSize sets it. Under a bound
  // of 100, pair's 10 by 10 values are called, and triple's 5 by 5 by 5 aren't, though each of its
  // parameters has fewer values than the bound, so a bound on each parameter alone calls triple,
  // which throws.
  describe("calls an export only where its argument lists fit in a set", () => {
    const getModel = (last: number) =>
      `type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;\ntype Small = 0 | 1 | 2 | 3 | 4;\nexport const pair = (a: Digit, b: Digit) => {\n  if (a === 9 && b === ${last}) throw new Error("pair " + a + b);\n  return a + b;\n};\nexport const triple = (a: Small, b: Small, c: Small) => {\n  throw new Error("triple " + a + b + c);\n};\n`;
    const NOTE =
      "tla-ts calls no triple: its parameters make 125 argument lists, more than the 100 it lists";

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "bound.ts"), getModel(10));
      expect(runNode(directory, "bound.ts").status).toBe(0);
      const result = runCli(directory, ["-maxSetSize", "100", "bound.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(NOTE);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "bound.ts"), getModel(9));
      const node = spawnSync(
        process.execPath,
        ["--input-type=module", "--eval", 'import { pair } from "./bound.ts"; pair(9, 9);'],
        { cwd: directory, encoding: "utf8" },
      );
      expect(node.stderr).toContain("Error: pair 99");
      const result = runCli(directory, ["-maxSetSize", "100", "bound.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain(NOTE);
      expect(result.stdout).toContain('the second argument was:\n"pair 99"');
    });
  });

  // An export named as a constant of the runtime's modules, as ESCore's Empty, None, and Absent,
  // takes a name of its own in TLA+, as one named as a definition of theirs does.
  describe("names an export that a constant of the runtime's modules takes", () => {
    const getModel = (last: number) =>
      `export const Empty = (code: 0 | 1 | 2) => {\n  if (code === ${last}) throw new Error("Empty " + code);\n  return code + 1;\n};\nexport const None = (flag: boolean) => !flag;\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "empty.ts"), getModel(3));
      expect(runNode(directory, "empty.ts").status).toBe(0);
      const result = runCli(directory, ["empty.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "empty.ts"), getModel(2));
      const node = spawnSync(
        process.execPath,
        ["--input-type=module", "--eval", 'import { Empty } from "./empty.ts"; Empty(2);'],
        { cwd: directory, encoding: "utf8" },
      );
      expect(node.stderr).toContain("Error: Empty 2");
      const result = runCli(directory, ["empty.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('the second argument was:\n"Empty 2"');
    });
  });

  // A model without state checks a boolean export as an ASSUME, which reports what stops its check,
  // where an INVARIANT that TLC evaluates as it starts would leave the stop unevaluated and a spec
  // without an initial state to check it in.
  describe("stops where a check of a model without state stops", () => {
    const getModel = (binding: string) =>
      `const g = ${binding};\nexport const isSet = (): boolean => g !== null;\n`;

    it("agrees with Node where the check runs", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "held.ts"), getModel("[1, 2]"));
      expect(runNode(directory, "held.ts").status).toBe(0);
      const result = runCli(directory, ["held.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("stops, rather than failing its config, where the check stops", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "held.ts"), getModel("globalThis as unknown as object"));
      expect(runNode(directory, "held.ts").status).toBe(0);
      const result = runCli(directory, ["held.ts"]);
      expect(result.stdout).toContain(
        "tla-ts can't keep an object other than one of data properties",
      );
      expect(result.stdout).not.toContain("did not specify the initial state predicate");
    });
  });

  // A record of optional fields is the union of a record for each set of them that it holds: past
  // the bound of values TLC lists, which their product with one more for each field passes, its
  // 2^n records aren't written out, and the export is noted rather than its spec running past the
  // length of a string.
  describe("calls no export whose record of optional fields has more values than TLC lists", () => {
    const getModel = (count: number, throws: string) =>
      `export const pick = (options: { ${Array.from({ length: count }, (_, index) => `f${index}?: boolean`).join("; ")} }) => {\n  if (${throws}) throw new Error("pick " + Object.keys(options).join());\n  return Object.keys(options).length;\n};\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "options.ts"),
        getModel(24, "options.f0 === true && options.f1 === false"),
      );
      expect(runNode(directory, "options.ts").status).toBe(0);
      const result = runCli(directory, ["options.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(
        /tla-ts calls no pick: its parameter options takes values it can't list: .* isn't finite: it has more than 1000000 values, which TLC lists at most/,
      );
    });

    // Within the bound, the 2^12 sets of fields of a long literal or undefined, 3^12 records, each
    // writing most of the fields, are TLA+ past a million characters, which the model writes
    // beside each check.
    it("notes an export whose records' TLA+ is too long to write", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "flags.ts"),
        `export const count = (flags: { ${Array.from({ length: 12 }, (_, index) => `f${index}?: "${"x".repeat(32)}"`).join("; ")} }) => Object.keys(flags).length;\n`,
      );
      expect(runNode(directory, "flags.ts").status).toBe(0);
      const result = runCli(directory, ["flags.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("records' TLA+ would run past 1,000,000 characters");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "options.ts"),
        getModel(2, "options.f0 === true && options.f1 === false"),
      );
      const result = runCli(directory, ["options.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('the second argument was:\n"pick f0,f1"');
    });
  });

  // Each call that an ASSUME checks gives what it throws as a value, so every export that throws is
  // printed with its message, rather than the first that throws stopping the checks of the rest,
  // and the last ASSUME fails with the first one's message, as TLC fails at the first false one.
  describe("reports each export that throws, with its own message", () => {
    const getModel = (secondThrows: string) =>
      `export const first = (n: 0 | 1 | 2) => {\n  if (n === 1) throw new Error("first " + n);\n  return n;\n};\nexport const second = (flag: boolean) => {\n  if (${secondThrows}) throw new RangeError("second " + flag);\n  return flag;\n};\nexport const third = (n: 0 | 1) => n + 1;\n`;
    const runInNode = (directory: string, call: string) =>
      spawnSync(
        process.execPath,
        ["--input-type=module", "--eval", `import * as m from "./three.ts"; ${call};`],
        { cwd: directory, encoding: "utf8" },
      );

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "three.ts"), getModel("!flag"));
      expect(runInNode(directory, "m.first(1)").stderr).toContain("Error: first 1");
      expect(runInNode(directory, "m.second(false)").stderr).toContain("RangeError: second false");
      expect(runInNode(directory, "m.third(0); m.third(1)").status).toBe(0);
      const result = runCli(directory, ["three.ts"]);
      expect(result.status).toBe(10);
      expect(result.stdout).toContain('"first throws: first 1"\n"second throws: second false"\n');
      expect(result.stdout).not.toContain("third throws");
      expect(result.stdout).toContain('the second argument was:\n"first 1"');
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "three.ts"), getModel("false"));
      expect(runInNode(directory, "m.second(false); m.second(true)").status).toBe(0);
      const result = runCli(directory, ["three.ts"]);
      expect(result.status).toBe(10);
      expect(result.stdout).toContain('"first throws: first 1"');
      expect(result.stdout).not.toContain("second throws");
    });
  });

  // A const whose type has call signatures, as a dual function's overloads and a named function
  // type give it, runs as one function, which the model calls by one signature: a dual's
  // data-first one, which dual dispatches to by its arity, and a named type's own.
  describe("calls a dual or a named function type's const by the signature it notes", () => {
    const getModel = (last: number) =>
      `type Bit = 0 | 1;\ninterface Compare<A> {\n  (self: A, that: A): -1 | 0 | 1;\n}\nconst dual = <F>(arity: number, body: (self: Bit, that: Bit) => number): F =>\n  ((...args: Bit[]) => (args.length >= arity ? body(args[0], args[1]) : (self: Bit) => body(self, args[0]))) as F;\nexport const add: {\n  (that: Bit): (self: Bit) => number;\n  (self: Bit, that: Bit): number;\n} = dual(2, (self: Bit, that: Bit) => {\n  if (self === 1 && that === ${last}) throw new Error("add " + self + that);\n  return self + that;\n});\nconst compare = (self: Bit, that: Bit): -1 | 0 | 1 => (self < that ? -1 : self > that ? 1 : 0);\nexport const Order: Compare<Bit> = compare;\n`;
    const NOTES = [
      "tla-ts calls add by its data-first signature (self: Bit, that: Bit): number, which dual dispatches to by its arity, 2",
      "tla-ts calls Order by its type's signature (self: Bit, that: Bit): 0 | 1 | -1",
    ];

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "dual.ts"), getModel(2));
      expect(runNode(directory, "dual.ts").status).toBe(0);
      const result = runCli(directory, ["dual.ts"]);
      expect(result.status).toBe(0);
      NOTES.forEach((note) => expect(result.stdout).toContain(note));
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "dual.ts"), getModel(1));
      const node = spawnSync(
        process.execPath,
        ["--input-type=module", "--eval", 'import { add } from "./dual.ts"; add(1, 1);'],
        { cwd: directory, encoding: "utf8" },
      );
      expect(node.stderr).toContain("Error: add 11");
      const result = runCli(directory, ["dual.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain(NOTES[0]);
      expect(result.stdout).toContain('the second argument was:\n"add 11"');
    });
  });

  // A step's LET binds e1 to the first argument it converts, which TLA+ rejects after an export
  // named e1, so the compile stops where a name that the spec defines is bound again, rather than
  // the spec failing to parse. An export named otherwise is checked as Node runs it.
  describe("stops where the spec binds an export's name again after it defines it", () => {
    const getModel = (name: string) =>
      `export const ${name} = (flag: boolean) => {\n  if (flag) throw new Error("${name} " + flag);\n  return 1;\n};\nexport const two = (flag: boolean) => {\n  if (flag) throw new Error("two " + flag);\n  return 2;\n};\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "pair.ts"), getModel("e1"));
      expect(runNode(directory, "pair.ts").status).toBe(0);
      const result = runCli(directory, ["pair.ts"]);
      expect(result.status).toBe(255);
      expect(result.stderr).toBe(
        "TlaTypeScriptError: tla-ts can't name e1 in TLA+, which the program's spec binds again after it defines it\n",
      );
      expect(result.stdout).not.toContain("Semantic errors");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "pair.ts"), getModel("one"));
      const node = spawnSync(
        process.execPath,
        ["--input-type=module", "--eval", 'import { one } from "./pair.ts"; one(true);'],
        { cwd: directory, encoding: "utf8" },
      );
      expect(node.stderr).toContain("Error: one true");
      const result = runCli(directory, ["pair.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('"one throws: one true"');
    });
  });

  // A type parameter without a constraint takes 0, 1, and 2, an iterable each array of its
  // elements up to 3 long, and a callback each table from its first argument's values to its
  // result's, as the note says. Node, calling count with each of those, finds no throw where the
  // count never reaches 4, and finds count 3 where it does reach 3.
  describe("calls a generic export with an iterable and a callback by the values its note states", () => {
    const getModel = (limit: number) =>
      `export const count = <A>(self: Iterable<A>, predicate: (a: A) => boolean): number => {\n  let found = 0;\n  for (const a of self) if (predicate(a)) found += 1;\n  if (found === ${limit}) throw new Error("count " + found);\n  return found;\n};\n`;
    const NOTE =
      "tla-ts calls count with A := {0, 1, 2}; iterables as arrays up to length 3; callbacks as tables of their first argument";
    // Every message that count throws in Node over those values, in order.
    const getThrown = (directory: string) =>
      spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          `import { count } from "./count.ts";
          const values = [0, 1, 2];
          const arrays = [0, 1, 2, 3].flatMap((length) => Array.from({ length: 3 ** length }, (_, code) => Array.from({ length }, (_, index) => Math.floor(code / 3 ** index) % 3)));
          const tables = Array.from({ length: 8 }, (_, code) => values.map((value) => Math.floor(code / 2 ** value) % 2 === 1));
          const thrown = new Set();
          for (const array of arrays) for (const table of tables) {
            try { count(array, (key) => table[values.indexOf(key)]); } catch (error) { thrown.add(error.message); }
          }
          console.log(JSON.stringify([...thrown]));`,
        ],
        { cwd: directory, encoding: "utf8" },
      ).stdout.trim();

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "count.ts"), getModel(4));
      expect(getThrown(directory)).toBe("[]");
      const result = runCli(directory, ["count.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(NOTE);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "count.ts"), getModel(3));
      expect(getThrown(directory)).toBe('["count 3"]');
      const result = runCli(directory, ["count.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain(NOTE);
      expect(result.stdout).toContain('"count throws: count 3"');
    });
  });

  // A callback of no argument is each table of undefined, the argument it's called with: here a
  // function that returns each of 0, 1, and 2, which orElse returns where its value is undefined,
  // as the note says. Node, calling orElse with each, finds no throw where it throws on 3, and
  // finds fallback 2 where it throws on 2.
  describe("calls an export with a callback of no argument by each value it returns", () => {
    const getModel = (limit: number) =>
      `export const orElse = (value: 0 | 1 | undefined, fallback: () => 0 | 1 | 2): number => {\n  const result = value === undefined ? fallback() : value;\n  if (result === ${limit}) throw new Error("fallback " + result);\n  return result;\n};\n`;
    const NOTE = "tla-ts calls orElse with callbacks as tables of no argument";
    // Every message that orElse throws in Node over those values.
    const getThrown = (directory: string) =>
      spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          `import { orElse } from "./lazy.ts";
          const thrown = new Set();
          for (const value of [0, 1, undefined]) for (const result of [0, 1, 2]) {
            try { orElse(value, () => result); } catch (error) { thrown.add(error.message); }
          }
          console.log(JSON.stringify([...thrown]));`,
        ],
        { cwd: directory, encoding: "utf8" },
      ).stdout.trim();

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "lazy.ts"), getModel(3));
      expect(getThrown(directory)).toBe("[]");
      const result = runCli(directory, ["lazy.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`${NOTE}\n`);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "lazy.ts"), getModel(2));
      expect(getThrown(directory)).toBe('["fallback 2"]');
      const result = runCli(directory, ["lazy.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain(`${NOTE}\n`);
      expect(result.stdout).toContain('"orElse throws: fallback 2"');
    });
  });

  // With 0, 1, and 2 and arrays up to 3 long, pair's parameters make 40 * 40 * 27 = 43,200
  // argument lists, more than the 10,000 that a call with values in place of its types makes, so
  // it takes 0 and 1 and arrays up to 2 long: 7 * 7 * 4 = 196 lists, as its note says. Node,
  // calling pair with each of those, finds no throw where the count never reaches 5, and finds
  // pair 4 where it does reach 4.
  describe("calls a generic export with smaller values where its argument lists are too many", () => {
    const getModel = (limit: number) =>
      `export const pair = <A, B>(xs: Iterable<A>, ys: Iterable<B>, f: (a: A) => B): number => {\n  let found = 0;\n  for (const x of xs) for (const y of ys) if (f(x) === y) found += 1;\n  if (found === ${limit}) throw new Error("pair " + found);\n  return found;\n};\n`;
    const NOTE =
      "tla-ts calls pair with A := {0, 1}; B := {0, 1}; iterables as arrays up to length 2; callbacks as tables of their first argument";
    // Every message that pair throws in Node over those values.
    const getThrown = (directory: string) =>
      spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          `import { pair } from "./pair.ts";
          const values = [0, 1];
          const arrays = [[], [0], [1], [0, 0], [0, 1], [1, 0], [1, 1]];
          const tables = [[0, 0], [0, 1], [1, 0], [1, 1]];
          const thrown = new Set();
          for (const xs of arrays) for (const ys of arrays) for (const table of tables) {
            try { pair(xs, ys, (key) => table[values.indexOf(key)]); } catch (error) { thrown.add(error.message); }
          }
          console.log(JSON.stringify([...thrown]));`,
        ],
        { cwd: directory, encoding: "utf8" },
      ).stdout.trim();

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "pair.ts"), getModel(5));
      expect(getThrown(directory)).toBe("[]");
      const result = runCli(directory, ["pair.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(NOTE);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "pair.ts"), getModel(4));
      expect(getThrown(directory)).toBe('["pair 4"]');
      const result = runCli(directory, ["pair.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain(NOTE);
      expect(result.stdout).toContain('"pair throws: pair 4"');
    });
  });

  // A parameter of a data type that the module declares and lists no values of takes each value
  // that the module's constructors of it make, as the note says: make of each number and fromBig of
  // each BigInt from -3 to 3, but those whose call throws, which make none. TLC compares the two
  // constructors' values, whose arguments it can't compare, by their names first. Node, calling
  // half with each of those, finds no throw where half throws above 3, and finds odd 3 where it
  // throws above 1.
  describe("calls an export with a value that the module's constructor makes", () => {
    const getModel = (limit: number) =>
      `export interface Cents {\n  readonly amount: number;\n  pipe(): unknown;\n}\nexport const make = (amount: number): Cents => {\n  if (amount < 0) throw new RangeError("negative " + amount);\n  return { amount, pipe: () => amount };\n};\nexport const fromBig = (amount: bigint): Cents => make(Number(amount));\nexport const half = (self: Cents): number => {\n  if (self.amount % 2 === 1 && self.amount > ${limit}) throw new Error("odd " + self.amount);\n  return self.amount / 2;\n};\n`;
    const NOTE = "tla-ts calls half with Cents := make(amount), fromBig(amount)";
    // Every message that half throws in Node over those values, in order.
    const getThrown = (directory: string) =>
      spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          `import { make, fromBig, half } from "./cents.ts";
          const values = [-3, -2, -1, 0, 1, 2, 3].flatMap((amount) => [() => make(amount), () => fromBig(BigInt(amount))]).flatMap((construct) => { try { return [construct()]; } catch { return []; } });
          const thrown = new Set();
          for (const value of values) { try { half(value); } catch (error) { thrown.add(error.message); } }
          console.log(JSON.stringify([values.length, ...thrown]));`,
        ],
        { cwd: directory, encoding: "utf8" },
      ).stdout.trim();

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "cents.ts"), getModel(3));
      expect(getThrown(directory)).toBe("[8]");
      const result = runCli(directory, ["cents.ts"]);
      expect(result.stdout).toContain(NOTE);
      expect(result.stdout).toContain('"make throws: negative -3"');
      expect(result.stdout).not.toContain("half throws");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "cents.ts"), getModel(1));
      expect(getThrown(directory)).toBe('[8,"odd 3"]');
      const result = runCli(directory, ["cents.ts"]);
      expect(result.stdout).toContain(NOTE);
      expect(result.stdout).toContain('"half throws: odd 3"');
    });
  });

  // A state variable whose name TLA+ can't spell, as $ and _, takes a name of its own in TLA+, and
  // the trace shows it by its binding's name, in the order of TLC's ranks of the names, as TLC
  // shows a function. Real TLC, on the program's modules under its root, shows $, b, then _.
  // The model deadlocks where bump changes nothing, after $ reaches 2.
  describe("checks state variables whose names TLA+ can't spell, as $ and _", () => {
    const getModel = (check: string) =>
      `let b = 0;\nlet $ = 0;\nlet _ = 10;\nexport const bump = () => {\n  if ($ >= 2) return;\n  $ += 1;\n  _ -= 1;\n};\nexport const isKept = () => ${check};\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "names.ts"), getModel("$ + _ === 10 && b === 0"));
      expect(runNode(directory, "names.ts").status).toBe(0);
      const result = runCli(directory, ["names.ts"]);
      expect(result.status).toBe(11);
      expect(result.stdout).toContain("Error: Deadlock reached.");
      expect(result.stdout).toContain("/\\ $ = 2\n/\\ b = 0\n/\\ _ = 8");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "names.ts"), getModel("$ < 2"));
      const result = runCli(directory, ["names.ts"]);
      expect(result.status).toBe(12);
      expect(result.stdout).toContain("Invariant isKept is violated.");
      expect(result.stdout).toContain("/\\ $ = 2\n/\\ b = 0\n/\\ _ = 8");
    });
  });

  // An exception that a file the entry loads leaves uncaught, which Node says it threw where the
  // file's throw statement is, in a CommonJS file, or where its error was made, in an ES module,
  // with the file's path or URL, its line, and a caret.
  describe.each([
    ["main.cjs", "lib.cjs", 'const lib = require("./lib.cjs");\nconsole.log(lib);\n'],
    ["main.mjs", "lib.mjs", 'import { value } from "./lib.mjs";\nconsole.log(value);\n'],
  ])("exits with Node's code and stderr where %s loads a file that throws", (entry, lib, main) => {
    const getLib = (padding: string) =>
      lib.endsWith(".cjs")
        ? `const value = 1;\n${padding}if (value === 1) {\n  throw new RangeError("from lib");\n}\nmodule.exports = value;\n`
        : `export const value = 1;\n${padding}throw new TypeError("from module");\n`;
    const getRun = (padding: string) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, entry), main);
      writeFileSync(join(directory, lib), getLib(padding));
      return [getExit(runNode(directory, entry)), getExit(runCli(directory, [entry]))];
    };

    it("agrees with Node", () => {
      const [node, cli] = getRun("");
      expect(node[0]).toBe(1);
      expect(cli).toEqual(node);
    });

    it("rejects another result", () => {
      const [node, cli] = getRun("\n\n");
      expect(cli).toEqual(node);
      expect(cli).not.toEqual(getRun("")[1]);
    });
  });

  // A check runs on a thread whose heap is the one Node gives the process, here 300 MB of old
  // space, and stops where it runs out of it, though Node runs the script in less, as a script of
  // 20,000 numbers does, where one of 10 checks.
  describe("stops a check that runs out of the heap that Node gives it", () => {
    const getScript = (count: number) =>
      `const values = [${Array.from({ length: count }, (_, index) => `${index}.5`).join(", ")}];\nif (values.length !== ${count}) throw new RangeError("length " + values.length);\n`;
    const runLimited = (directory: string, file: string) =>
      spawnSync(process.execPath, ["--max-old-space-size=300", DIST_CLI, file], {
        cwd: directory,
        encoding: "utf8",
      });

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "values.mjs"), getScript(10));
      expect(runNode(directory, "values.mjs").status).toBe(0);
      expect(getExit(runLimited(directory, "values.mjs"))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "values.mjs"), getScript(20_000));
      expect(runNode(directory, "values.mjs").status).toBe(0);
      const result = runLimited(directory, "values.mjs");
      expect(result.status).toBe(255);
      expect(result.stderr).toMatch(
        /^TlaHeapLimitError: tla-ts can't check this program within Node's default heap of \d+ MB\n$/,
      );
    });
  });

  // Intl's timeZone option reads the zone that a model's string names, as the frame lists strings:
  // "", "a", and "b", none of which Node has, so Node's Intl rejects each as it does, from the zones
  // the host's table records, as Effect's DateTime.zoneMakeNamedUnsafe asks.
  describe("rejects the time zones a model's strings name as Node's Intl does", () => {
    const getModel = (rejected: string) =>
      `export const isZone = (name: string) => {\n  if (name === "") return false;\n  try {\n    new Intl.DateTimeFormat("en-US", { timeZone: name });\n    return true;\n  } catch (error) {\n    ${rejected};\n  }\n};\n`;
    const isRejected = (name: string) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: name });
        return false;
      } catch {
        return true;
      }
    };

    it("agrees with Node", () => {
      expect(["a", "b"].every(isRejected)).toBe(true);
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "zone.ts"), getModel("return false"));
      const result = runCli(directory, ["zone.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "zone.ts"),
        getModel('throw new Error("rejected " + (error instanceof RangeError))'),
      );
      const result = runCli(directory, ["zone.ts"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('the second argument was:\n"rejected true"');
    });
  });

  describe("checks a model whose top level throws as Node throws", () => {
    const getModel = (statement: string) =>
      `export const twice = (n: 0 | 1) => n * 2;\n${statement}\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "throws.ts"), getModel('throw new RangeError("boom");'));
      const node = runNode(directory, "throws.ts");
      expect(node.status).toBe(1);
      expect(node.stderr).toContain("RangeError: boom");
      const result = runCli(directory, ["throws.ts"]);
      expect(result.status).toBe(10);
      expect(result.stdout).toContain(
        'The first argument of Assert evaluated to FALSE; the second argument was:\n"boom"',
      );
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "throws.ts"), getModel("const isThrown = false;"));
      expect(runNode(directory, "throws.ts").status).toBe(0);
      const result = runCli(directory, ["throws.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).not.toContain('"boom"');
    });
  });

  // The frame calls a CommonJS file's functions by the bindings that its exports name, and stops at
  // a function that it exports without one, which it would otherwise leave unchecked.
  describe("checks a CommonJS model by the bindings that its exports name", () => {
    const getModel = (limit: number, exported: string) =>
      `let count = 0;\nconst tick = () => {\n  count = count === 3 ? 0 : count + 1;\n};\nconst isBounded = () => count < ${limit};\n${exported}\n`;
    // Whether Node, ticking the model's module up to three times, finds isBounded false.
    const isViolatedInNode = (directory: string) =>
      spawnSync(
        process.execPath,
        [
          "-e",
          'const model = require("./model.cjs");\nconsole.log([1, 2, 3].some(() => (model.tick(), !model.isBounded())));',
        ],
        { cwd: directory, encoding: "utf8" },
      ).stdout.trim() === "true";

    it.each([
      ["exports.tick = tick;\nexports.isBounded = isBounded;"],
      ["module.exports = { tick, isBounded };"],
      ["module.exports = { tick: tick, isBounded: isBounded };"],
    ])("agrees with Node where %s", (exported) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "model.cjs"), getModel(3, exported));
      expect(isViolatedInNode(directory)).toBe(true);
      expect(runCli(directory, ["model.cjs"]).stdout).toContain(
        "Error: Invariant isBounded is violated.",
      );
      writeFileSync(join(directory, "model.cjs"), getModel(4, exported));
      expect(isViolatedInNode(directory)).toBe(false);
      expect(runCli(directory, ["model.cjs"]).stdout).toContain("No error has been found");
    });

    it.each([
      ["exports.tick", "exports.tick = () => tick();\nexports.isBounded = isBounded;"],
      ["module.exports", "module.exports = { tick() {\n  tick();\n}, isBounded };"],
    ])("stops where %s sets a function that no binding names", (target, exported) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "model.cjs"), getModel(3, exported));
      expect(isViolatedInNode(directory)).toBe(true);
      const result = runCli(directory, ["model.cjs"]);
      expect(result.stdout).not.toContain("No error has been found");
      expect(result.stderr).toContain(
        `tla-ts can't check a function that ${target} sets without a binding that names it`,
      );
    });
  });

  // A model's state may live in a module it imports, which a call of an export changes though the
  // model's own code writes no binding of it: an export that returns nothing is a step, and one
  // that returns a value is a check, which stops where its call changes the state.
  describe("checks a model whose exports change the state of a module it imports", () => {
    const STORE =
      "let count: number = 0;\nexports.bump = () => {\n  count = (count + 1) % 4;\n  return count;\n};\nexports.get = () => count;\n";
    const getModel = (tick: string) =>
      `import { bump, get } from "./store.cts";\nexport const tick = ${tick};\nexport const isLow = () => get() < 3;\n`;
    // Whether Node, ticking the model's module three times, finds isLow false.
    const isViolatedInNode = (directory: string) =>
      spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `const model = await import(${JSON.stringify(pathToFileURL(join(directory, "model.ts")).href)});\n[1, 2, 3].forEach(() => model.tick());\nconsole.log(model.isLow());`,
        ],
        { cwd: directory, encoding: "utf8" },
      ).stdout.trim() === "false";

    it.each([
      ["returns nothing", "() => {\n  bump();\n}"],
      ["returns a value", "() => bump()"],
    ])("never passes where Node violates an invariant and an export %s", (_, tick) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "store.cts"), STORE);
      writeFileSync(join(directory, "model.ts"), getModel(tick));
      expect(isViolatedInNode(directory)).toBe(true);
      const result = runCli(directory, ["model.ts"]);
      expect(result.stdout).not.toContain("No error has been found");
      expect(result.stdout).toContain(
        tick.includes("{")
          ? "Error: Invariant isLow is violated."
          : "tla-ts can't check tick as a function that changes nothing: its call changes the program's state",
      );
    });

    it("checks an export that returns a value and changes nothing", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "store.cts"), STORE);
      writeFileSync(join(directory, "model.ts"), getModel("() => get() + 1"));
      expect(isViolatedInNode(directory)).toBe(false);
      const result = runCli(directory, ["model.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("No error has been found");
    });
  });

  // A match writes RegExp's legacy static properties, which a model's state leaves out, so a check
  // that matches changes nothing that the model reads, and a model stops where its code reads them.
  describe("checks a model whose checks match a RegExp", () => {
    // Whether Node, renaming to "bb" after each check, finds isShort false.
    const isViolatedInNode = (directory: string) =>
      spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `const model = await import(${JSON.stringify(pathToFileURL(join(directory, "model.ts")).href)});\nconsole.log([model.isShort(), (model.rename("bb"), model.isShort())].includes(false));`,
        ],
        { cwd: directory, encoding: "utf8" },
      ).stdout.trim() === "true";

    it.each([
      ["/^.$/", "Error: Invariant isShort is violated."],
      ["/^.{1,2}$/", "No error has been found"],
    ])("agrees with Node where isShort matches %s", (pattern, outcome) => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "model.ts"),
        `let name = "a";\nexport const rename = (next: "a" | "bb") => {\n  name = next;\n};\nexport const isShort = () => ${pattern}.test(name);\n`,
      );
      expect(isViolatedInNode(directory)).toBe(outcome.startsWith("Error"));
      expect(runCli(directory, ["model.ts"]).stdout).toContain(outcome);
    });

    // A step reads what the check's match wrote in Node, which the model's state leaves out.
    it.each([
      ["RegExp.$1"],
      ['RegExp["$" + 1]'],
      ['Object.getOwnPropertyDescriptor(RegExp, "lastMatch")?.get?.call(RegExp)'],
    ])("stops where a step reads %s that a check's match wrote", (read) => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "model.ts"),
        `let name = "a";\nexport const rename = (next: "a" | "bb") => {\n  name = String(${read}) + next;\n};\nexport const isShort = () => /(a)/.test("a") && name.length < 3;\n`,
      );
      expect(isViolatedInNode(directory)).toBe(true);
      const result = runCli(directory, ["model.ts"]);
      expect(result.stdout).not.toContain("No error has been found");
      expect(result.stdout).toContain(
        "tla-ts can't read or set a legacy static property of RegExp in a model",
      );
    });
  });

  // A note names the kind of a parameter's type that keeps tla-ts from calling an export, or the
  // kinds of a union's values that TLC can't compare, beside the check of the exports that it calls.
  describe("names the kind of each parameter that it can't list the values of", () => {
    const getModel = (check: string) =>
      `class Box {\n  size = 1;\n}\ninterface Shape {\n  name: string;\n  area(): number;\n}\ninterface Store {\n  name: string;\n  load(): unknown;\n}\nconst count = [1, 2].length;\nexport const isSmall = () => ${check};\nexport const identity = <T,>(value: T) => value;\nexport const apply = (transform: (value: number) => number) => transform(count);\nexport const measure = (shape: Shape) => shape.area();\nexport const fetch = (store: Store) => store.load();\nexport const open = (box: Box) => box.size;\nexport const name = (store: Store | undefined) => store?.name;\nexport const echo = (value: unknown) => value;\nexport const loose = (value: any) => value;\nexport const either = (value: string | number) => value;\nexport const mixed = (value: bigint | number) => value;\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "kinds.ts"), getModel("count <= 2"));
      expect(runNode(directory, "kinds.ts").status).toBe(0);
      const result = runCli(directory, ["kinds.ts"]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Model checking completed. No error has been found.");
      [
        "fetch: its parameter store is an object with methods",
        "open: its parameter box is an instance of a class",
        "name: its parameter store is a union with an object with methods",
        "echo: its parameter value is unknown",
        "loose: its parameter value is any, as an untyped parameter is",
      ].forEach((note) =>
        expect(result.stdout).toContain(`tla-ts calls no ${note}, whose values tla-ts can't list`),
      );
      // A type parameter takes 0, 1, and 2, a method that takes nothing and returns a number is a
      // table of undefined, and a callback of a number to a number has more tables than any rung
      // calls.
      expect(result.stdout).toContain("tla-ts calls identity with T := {0, 1, 2}\n");
      expect(result.stdout).toContain(
        "tla-ts calls measure with methods as tables of no argument\n",
      );
      expect(result.stdout).toContain(
        "tla-ts calls no apply: its parameters make 823,543 argument lists with callbacks as tables of their first argument",
      );
      expect(result.stdout).toContain(
        "tla-ts calls no either: its parameter value is a union of string and number, whose values TLC can't compare",
      );
      expect(result.stdout).toContain(
        "tla-ts calls no mixed: its parameter value is a union of number and bigint, whose values TLC can't compare",
      );
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "kinds.ts"), getModel("count < 2"));
      const result = runCli(directory, ["kinds.ts"]);
      expect(result.status).not.toBe(0);
      // A model without state checks a boolean export as an ASSUME, as TLC recommends for a
      // constant-level invariant, rather than as an INVARIANT.
      expect(result.stdout).toMatch(
        /Error: Assumption line \d+, col \d+ to line \d+, col \d+ of module ProgramCode is false/,
      );
      expect(result.stdout).not.toContain("The invariant of isSmall is equal to FALSE");
    });
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
      'export const apply = (f: (value: unknown) => number) => f(0);\nconst total = [1].length;\nif (total !== 2) throw new RangeError("total " + total);\n',
      'export const apply = (f: (value: unknown) => number) => f(0);\nconst total = [1].length;\nif (total !== 1) throw new RangeError("total " + total);\n',
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

  // The project's barrel re-exports from "./limits/maximum", which Node doesn't find without its
  // extension, so the compile stops rather than load the file that TypeScript resolves it to.
  it("stops at a module that re-exports from a file that Node doesn't find", () => {
    const directory = copyFixtures("project");
    expect(runNode(directory, "barrel.ts").stderr).toContain("ERR_MODULE_NOT_FOUND");
    const result = runCli(directory, ["barrel.ts"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("tla-ts can't load the module ./limits/maximum");
  });

  // Each import and require loads the file that Node resolves it to: require's resolution, or
  // Node's ESM resolution, with a package's exports and their conditions. Where Node finds no
  // file, or TypeScript would read the types of another, the compile stops.
  describe("loads the file that Node resolves a specifier to", () => {
    const PACKAGES = {
      "node_modules/conditions/package.json":
        '{ "name": "conditions", "exports": { "node": { "import": "./node-import.mjs", "require": "./node-require.cjs" }, "default": "./default.js" } }\n',
      "node_modules/conditions/node-import.mjs": 'export const where = "node-import";\n',
      "node_modules/conditions/node-require.cjs": 'exports.where = "node-require";\n',
      "node_modules/conditions/default.js": 'export const where = "default";\n',
      "node_modules/sync/package.json":
        '{ "name": "sync", "exports": { "module-sync": "./sync.js", "node": { "import": "./node-import.mjs" }, "default": "./default.js" } }\n',
      "node_modules/sync/sync.js": 'export const where = "sync";\n',
      "node_modules/sync/node-import.mjs": 'export const where = "node-import";\n',
      "node_modules/sync/default.js": 'export const where = "default";\n',
      "dep.ts": "module.exports = 2;\n",
      "two.ts": "export const two = 2;\n",
      "other.js": "export const two = 2;\n",
      "dir/index.js": "export const two = 2;\n",
      "bundler/tsconfig.json":
        '{ "compilerOptions": { "module": "preserve", "moduleResolution": "bundler", "allowImportingTsExtensions": true, "noEmit": true } }\n',
      "bundler/other.js": "export const two = 2;\n",
      "bundler/dir/index.js": "export const two = 2;\n",
    };
    // The files above with a program's, in a copy of the passing fixture, and the directory of the
    // program's file, where Node and the CLI run it.
    const write = (file: string, source: string) => {
      const directory = copyFixtures("passing");
      Object.entries({ ...PACKAGES, [file]: source }).forEach((entry) => {
        mkdirSync(dirname(join(directory, entry[0])), { recursive: true });
        writeFileSync(join(directory, entry[0]), entry[1]);
      });
      return dirname(join(directory, file));
    };

    describe.each([
      [
        "a package's exports by the node and import conditions",
        "main.mjs",
        (where: string) =>
          `import { where } from "conditions";\nif (where !== "${where}") throw new Error(where);\n`,
        "node-import",
      ],
      [
        "a package's exports by the node and require conditions",
        "main.cjs",
        (where: string) =>
          `const { where } = require("conditions");\nif (where !== "${where}") throw new Error(where);\n`,
        "node-require",
      ],
      [
        "a require of a TypeScript file by its name",
        "main.cjs",
        (two: string) =>
          `const two = require("./dep.ts");\nif (two !== ${two}) throw new Error("two");\n`,
        "2",
      ],
      [
        "an import of a directory's index by its name",
        "main.mjs",
        (two: string) =>
          `import { two } from "./dir/index.js";\nif (two !== ${two}) throw new Error("two");\n`,
        "2",
      ],
    ])("loads %s", (_, file, getScript, expected) => {
      it("agrees with Node", () => {
        const directory = write(file, getScript(expected));
        expect(runNode(directory, file).status).toBe(0);
        expect(getExit(runCli(directory, [file]))).toEqual([0, ""]);
      });

      it("rejects another result", () => {
        const directory = write(file, getScript("3"));
        const result = runCli(directory, [file]);
        expect(getExit(result)).toEqual(getExit(runNode(directory, file)));
        expect(result.status).toBe(1);
      });
    });

    // Each of these ran the file that TypeScript resolves the specifier to, where Node finds none or
    // another, but for the extensionless import outside a project, which stopped already.
    it.each([
      [
        "a require of a TypeScript file without its extension",
        "main.cjs",
        'const two = require("./dep");\nif (two !== 2) throw new Error("two");\n',
        1,
        "main.cjs:1:21 tla-ts can't load the module ./dep",
      ],
      [
        "a require of a file that isn't there",
        "main.cjs",
        'const missing = require("./missing.cjs");\n',
        1,
        "main.cjs:1:25 tla-ts can't load the module ./missing.cjs",
      ],
      [
        "a function's require of a file that isn't there, which it runs",
        "main.cjs",
        'const load = () => require("./missing.cjs");\nload();\n',
        1,
        "tla-ts can't load the module ./missing.cjs",
      ],
      [
        "an extensionless import",
        "main.mjs",
        'import { two } from "./other";\nif (two !== 2) throw new Error("two");\n',
        1,
        "tla-ts can't load the module ./other",
      ],
      [
        "an extensionless import under a bundler tsconfig",
        "bundler/main.ts",
        'import { two } from "./other";\nif (two !== 2) throw new Error("two");\n',
        1,
        "tla-ts can't load the module ./other",
      ],
      [
        "an import of a .js file that only its TypeScript has",
        "main.mjs",
        'import { two } from "./two.js";\nif (two !== 2) throw new Error("two");\n',
        1,
        "tla-ts can't load the module ./two.js",
      ],
      [
        "an import of a directory under a bundler tsconfig",
        "bundler/main.ts",
        'import { two } from "./dir";\nif (two !== 2) throw new Error("two");\n',
        1,
        "tla-ts can't load the module ./dir",
      ],
      [
        "a package's exports by a condition that TypeScript doesn't take",
        "main.mjs",
        'import { where } from "sync";\nif (where !== "sync") throw new Error(where);\n',
        0,
        "tla-ts can't read the types of a module that Node loads from another file than TypeScript reads",
      ],
    ])("stops at %s", (_, file, source, nodeStatus, stop) => {
      const directory = write(file, source);
      const name = basename(file);
      expect(runNode(directory, name).status).toBe(nodeStatus);
      const result = runCli(directory, [name]);
      expect([0, 1]).not.toContain(result.status);
      expect(result.stdout + result.stderr).toContain(stop);
    });

    // A require runs only where its function or its branch does, as Node loads nothing for it before.
    it.each([
      ["a function, which never runs,", 'const load = () => require("./missing.cjs");\n'],
      [
        "a branch, which it doesn't take,",
        'const mode = typeof window === "object" ? require("./missing.cjs") : "node";\n',
      ],
      [
        "a try, which catches nothing,",
        'try {\n  if (typeof window === "object") require("./missing.cjs");\n} catch {}\n',
      ],
    ])("runs a module where %s requires a file that isn't there", (_, source) => {
      const directory = write("main.cjs", source);
      expect(runNode(directory, "main.cjs").status).toBe(0);
      expect(getExit(runCli(directory, ["main.cjs"]))).toEqual([0, ""]);
    });
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

  // The frame that -frame prints: its spec, whose Next calls the model's one step, over the values
  // of its parameters, and the check that its config names.
  const getFrame = (stdout: string) => {
    const found = /^(---- MODULE Frame ----\n[\s\S]*?\n====)\n([\s\S]*?)\nTLC2 Version/m.exec(
      stdout,
    );
    if (found === null) throw new Error("no frame");
    const next = parseModule(found[1]).definitions.find((definition) => definition.name === "Next");
    const body = next?.kind === "Operator" ? next.body : undefined;
    const call = body?.kind === "Exists" ? body.body : body;
    const values = (body?.kind === "Exists" ? body.bounds : []).map((bound) =>
      bound.set.kind === "SetEnumeration"
        ? bound.set.elements.map((element) => (element.kind === "String" ? element.value : null))
        : [],
    );
    return {
      step: call?.kind === "Apply" ? call.operator : call?.kind === "Identifier" ? call.name : "",
      values,
      check: found[2].trim().split(/\s+/).at(-1) ?? "",
    };
  };

  // Whether Node, calling the frame's step with each of its parameters' values, in each order of at
  // most depth calls from the module's start, finds a state where the frame's check gives false.
  const isViolatedInNode = (directory: string, file: string, depth: number, stdout: string) => {
    const frame = getFrame(stdout);
    const script = `
      const frame = ${JSON.stringify(frame)};
      const url = ${JSON.stringify(pathToFileURL(join(directory, file)).href)};
      const argumentLists = frame.values.reduce(
        (lists, values) => lists.flatMap((list) => values.map((value) => [...list, value])),
        [[]],
      );
      let fresh = 0;
      const isViolated = async (calls) => {
        const module = await import(url + "?" + fresh++);
        calls.forEach((list) => module[frame.step](...list));
        return module[frame.check]() === false;
      };
      const search = async (calls) =>
        (await isViolated(calls)) ||
        (calls.length < ${depth} &&
          (await argumentLists.reduce(
            async (found, list) => (await found) || search([...calls, list]),
            Promise.resolve(false),
          )));
      console.log(await search([]));`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: directory,
      encoding: "utf8",
    });
    return result.stdout.trim();
  };

  it("prints a model's frame with -frame, whose calls Node replays without a violation", () => {
    const directory = copyFixtures("passing");
    expect(runCli(directory, ["counter.ts"]).stdout).not.toContain("MODULE Frame");
    const result = runCli(directory, ["-frame", "counter.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("No error has been found.");
    expect(getFrame(result.stdout)).toEqual({ step: "tick", values: [], check: "isBounded" });
    expect(isViolatedInNode(directory, "counter.ts", 5, result.stdout)).toBe("false");
  });

  it("prints the frame of a model whose check fails, whose calls Node replays to the violation", () => {
    const directory = copyFixtures("failing");
    const result = runCli(directory, ["-frame", "overdraft.ts"]);
    expect(result.status).toBe(12);
    expect(result.stdout).toContain("Error: Invariant noOverdraft is violated.");
    expect(getFrame(result.stdout).values).toEqual([
      ["alice", "bob"],
      ["alice", "bob"],
    ]);
    expect(isViolatedInNode(directory, "overdraft.ts", 1, result.stdout)).toBe("false");
    expect(isViolatedInNode(directory, "overdraft.ts", 2, result.stdout)).toBe("true");
  });

  it("checks TypeScript and TLA+ files together", () => {
    const directory = copyFixtures("failing");
    cpSync(join(FIXTURES, "../examples/hour-clock"), directory, { recursive: true });
    const result = runCli(directory, ["HourClock.tla", "overdraft.ts"]);
    expect(result.status).toBe(12);
    expect(result.stdout).toContain("Checking HourClock.tla with HourClock.cfg");
    expect(result.stdout).toContain("Checking overdraft.ts");
  });

  // A check's output but for what differs between runs: its seed, its process, and its times.
  const getStableOutput = (stdout: string) =>
    stdout
      .split("\n")
      .filter((line) => !/seed|^Starting|^Finished|\d{4}-\d\d-\d\d \d\d:/.test(line))
      .join("\n");

  it("checks files that import the same module, in one run, as it checks each alone", () => {
    const directory = copyFixtures("passing");
    writeFileSync(
      join(directory, "shared.ts"),
      "export const limits = { low: 0, high: 3 };\nexport const clamp = (value: number) => Math.min(Math.max(value, limits.low), limits.high);\n",
    );
    writeFileSync(
      join(directory, "rising.ts"),
      'import { clamp, limits } from "./shared.ts";\nlet level = 0;\nexport const rise = () => {\n  level = clamp(level + 1);\n};\nexport const isWithin = () => level <= limits.high;\n',
    );
    writeFileSync(
      join(directory, "falling.ts"),
      'import { clamp, limits } from "./shared.ts";\nlet level = 3;\nexport const fall = () => {\n  level = clamp(level - 2);\n};\nexport const isAbove = () => level > limits.low;\n',
    );
    const options = ["-noGenerateSpecTE", "-fp", "0"];
    const together = runCli(directory, [...options, "rising.ts", "falling.ts"]);
    const rising = runCli(directory, [...options, "rising.ts"]);
    const falling = runCli(directory, [...options, "falling.ts"]);
    expect(rising.status).toBe(0);
    expect(falling.status).toBe(12);
    expect(together.status).toBe(12);
    expect(getStableOutput(together.stdout)).toBe(
      getStableOutput(
        `Checking rising.ts\n${rising.stdout}\nChecking falling.ts\n${falling.stdout}`,
      ),
    );
  });

  it("reports a file that doesn't compile and checks the rest", () => {
    const directory = copyFixtures("failing");
    writeFileSync(join(directory, "evaluated.ts"), 'const total = eval("1 + 1");\n');
    const result = runCli(directory, ["evaluated.ts", "overdraft.ts"]);
    expect(result.stdout).toContain("Checking evaluated.ts\n");
    expect(result.stderr).toContain("TlaTypeScriptError: evaluated.ts:1:15 tla-ts can't run eval");
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

  // A syntax error stops tla-ts at the place in the file that Node's caret points at.
  it.each(["ts", "mts", "cts", "js", "mjs", "cjs"])(
    "places a syntax error in a .%s file where Node places it",
    (extension) => {
      const directory = copyFixtures("passing");
      const file = `syntax.${extension}`;
      writeFileSync(join(directory, file), "const a = 1;\nconst b = ;\n");
      const node = runNode(directory, file);
      expect(node.stderr).toMatch(
        new RegExp(`${file}:2\\n(?:const a = 1;\\n)?const b = ;\\n {10}\\^\\n`),
      );
      expect(getExit(runCli(directory, [file]))).toEqual([
        255,
        `TlaTypeScriptError: ${file}:2:11 Expression expected.\n`,
      ]);
      writeFileSync(join(directory, file), "const a = 1;\nconst b = a;\n");
      expect(runNode(directory, file).status).toBe(0);
      expect(getExit(runCli(directory, [file]))).toEqual([0, ""]);
    },
  );

  // Node compiles a CommonJS file's code as a function's body, where no wrapper's text comes
  // before its first line, which V8 names alone where it rejects it.
  it("places an import on the first line of a CommonJS file where Node places it", () => {
    const directory = copyFixtures("passing");
    writeFileSync(join(directory, "package.json"), '{ "type": "commonjs" }\n');
    writeFileSync(join(directory, "dep.cjs"), "exports.v = 1;\n");
    writeFileSync(join(directory, "first.js"), 'import { v } from "./dep.cjs";\nconsole.log(v);\n');
    expect(runNode(directory, "first.js").stderr).toContain(
      `${join(realpathSync(directory), "first.js")}:1\nimport { v } from "./dep.cjs";\n^^^^^^\n\nSyntaxError: Cannot use import statement outside a module`,
    );
    expect(getExit(runCli(directory, ["first.js"]))).toEqual([
      255,
      "TlaTypeScriptError: first.js:1:1 SyntaxError: Cannot use import statement outside a module\n",
    ]);
  });

  // tla-ts parses a TypeScript file's code as JavaScript, and names the file by its own name where
  // it stops in the code: the entry as it's given, as Node names it, and an import by its path.
  it("names an entry of TypeScript by its own name where its code has a syntax error", () => {
    const directory = copyFixtures("passing");
    const getCode = (statement: string) => `const total: number = 1;\n${statement} = total;\n`;
    writeFileSync(join(directory, "a.cts"), getCode("export const value"));
    expect(runNode(directory, "a.cts").stderr).toContain(
      `${join(realpathSync(directory), "a.cts")}:2\n`,
    );
    expect(getExit(runCli(directory, ["a.cts"]))).toEqual([
      255,
      "TlaTypeScriptError: a.cts:2:1 SyntaxError: Unexpected token 'export'\n",
    ]);
    writeFileSync(join(directory, "a.cts"), getCode("exports.value"));
    expect(runNode(directory, "a.cts").status).toBe(0);
    expect(getExit(runCli(directory, ["a.cts"]))).toEqual([0, ""]);
  });

  it("names an import of TypeScript by its own path where it stops in its code", () => {
    const directory = copyFixtures("passing");
    writeFileSync(
      join(directory, "a.ts"),
      'import { total } from "./dep.mts";\nif (total !== 2) throw new Error("total");\n',
    );
    writeFileSync(
      join(directory, "dep.mts"),
      'const code: string = "1 + 1";\nexport const total = eval(code);\n',
    );
    expect(runNode(directory, "a.ts").status).toBe(0);
    expect(runCli(directory, ["a.ts"]).stderr).toBe(
      `TlaTypeScriptError: ${join(realpathSync(directory), "dep.mts")}:2:22 tla-ts can't run eval\n`,
    );
  });

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

  // A require of an ES module gives its namespace, and a file of JSX is one by the syntax of the
  // code TypeScript writes for it, not by the JSX that its own text holds.
  it("requires a .tsx file as the ES module that TypeScript writes", () => {
    const directory = copyFixtures("passing");
    writeFileSync(
      join(directory, "view.tsx"),
      `/** @jsxRuntime classic */\n/** @jsx h */\nconst h = (type: string, props: unknown, ...children: string[]) => type + "(" + children.join(",") + ")";\nexport const view = <p>{"x"}</p>;\n`,
    );
    const getScript = (expected: string) =>
      `const loaded = require("./view.tsx");\nif (loaded.view !== "${expected}") throw new Error(loaded.view);\n`;
    writeFileSync(join(directory, "main.cjs"), getScript("p(x)"));
    expect(getExit(runNodeOnJsx(directory, "main.cjs"))).toEqual([0, ""]);
    expect(getExit(runCli(directory, ["main.cjs"]))).toEqual([0, ""]);
    writeFileSync(join(directory, "main.cjs"), getScript("p()"));
    // Node's ESM loader, which runs the hooks, puts its caret elsewhere than its CommonJS loader.
    const node = runNodeOnJsx(directory, "main.cjs");
    const wrong = runCli(directory, ["main.cjs"]);
    expect([wrong.status, node.status]).toEqual([1, 1]);
    expect([wrong.stderr, node.stderr]).toEqual([
      expect.stringContaining("\n\nError: p(x)\n"),
      expect.stringContaining("\n\nError: p(x)\n"),
    ]);
  });

  // TypeScript writes a file of JSX as an ES module, with its calls on lines of their own and its
  // types gone, whose code Node shows where it throws.
  describe("runs a file of JSX as the code that TypeScript writes for it", () => {
    const REACT = join(import.meta.dirname, "../../../website/node_modules/react");
    const getScript = (extension: string, expected: string) =>
      `${extension === "tsx" ? "type Item = { n: number };\n" : ""}const Item = (props${extension === "tsx" ? ": Item" : ""}) =>\n  <li>\n    {props.n * 2}\n  </li>;\nconst list = <ul id="u">{[1, 2].map((n) => <Item key={n} n={n} />)}<>x</></ul>;\nconst seen = [typeof module, list.props.children.length, String(list.props.children[0][1].key), Item({ n: 3 }).props.children].join(" ");\nif (seen !== "${expected}") throw new Error(seen);\n`;

    it.each(["tsx", "jsx"])(
      "agrees with Node on a .%s file of React's automatic runtime",
      (extension) => {
        const directory = copyFixtures("passing");
        mkdirSync(join(directory, "node_modules"));
        symlinkSync(REACT, join(directory, "node_modules/react"));
        const file = `view.${extension}`;
        writeFileSync(join(directory, file), getScript(extension, "undefined 2 2 6"));
        expect(getExit(runNodeOnJsx(directory, file))).toEqual([0, ""]);
        expect(getExit(runCli(directory, [file]))).toEqual([0, ""]);
        writeFileSync(join(directory, file), getScript(extension, "object 2 2 6"));
        const wrong = runCli(directory, [file]);
        expect(getExit(wrong)).toEqual(getExit(runNodeOnJsx(directory, file)));
        expect(wrong.status).toBe(1);
      },
      // Both checks load React's development build, 15 s together at a load of 40, and more above it.
      120_000,
    );

    // TypeScript writes a file of JSX as an ES module under React's runtime, though a pragma names a
    // factory of the file's own and the file imports nothing.
    it("runs a file of a classic pragma's JSX as the ES module that TypeScript writes", () => {
      const directory = copyFixtures("passing");
      const getPragmaScript = (expected: string) =>
        `/** @jsxRuntime classic */\n/** @jsx h */\nconst h = (type, props, ...children) => type + "(" + children.join(",") + ")";\nconst seen = [typeof module, String(this), <p>{1}</p>].join(" ");\nif (seen !== "${expected}") throw new Error(seen);\n`;
      writeFileSync(join(directory, "view.jsx"), getPragmaScript("undefined undefined p(1)"));
      expect(getExit(runNodeOnJsx(directory, "view.jsx"))).toEqual([0, ""]);
      expect(getExit(runCli(directory, ["view.jsx"]))).toEqual([0, ""]);
      writeFileSync(join(directory, "view.jsx"), getPragmaScript("object [object Object] p(1)"));
      const wrong = runCli(directory, ["view.jsx"]);
      expect(getExit(wrong)).toEqual(getExit(runNodeOnJsx(directory, "view.jsx")));
      expect(wrong.status).toBe(1);
    });

    // Node names a CommonJS file of JavaScript, as TypeScript writes one under a project of CommonJS,
    // by its path, and an ES module by its URL. Node's ESM loader, which runs the hooks, puts the
    // caret of a CommonJS file elsewhere than its CommonJS loader, so the lines after it differ.
    it("names a file of JSX that TypeScript writes as CommonJS by its path", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: { jsx: "react", jsxFactory: "h", module: "commonjs", strict: true },
          include: ["*"],
        }),
      );
      writeFileSync(
        join(directory, "view.tsx"),
        'const h = (type: string, props: unknown, ...children: unknown[]) => `${type}(${children.join(",")})`;\nconst view: string = <p>{1}</p>;\nexport const shown = view;\nif (view !== "p(2)") throw new Error(view);\n',
      );
      const node = runNodeOnJsx(directory, "view.tsx");
      const result = runCli(directory, ["view.tsx"]);
      expect([result.status, node.status]).toEqual([1, 1]);
      expect(result.stderr).toMatch(/^\/[^\n]*\/view\.tsx:\d+\n/);
      expect(node.stderr.split("\n").slice(0, 2)).toEqual(result.stderr.split("\n").slice(0, 2));
    });

    // TypeScript's emit keeps JSX that a project's tsconfig.json preserves, which Node can't run.
    it.each([
      ["preserve", "react"],
      ["react-native", "react"],
    ])("stops at a project whose jsx is %s, and runs one whose jsx is %s", (kept, compiled) => {
      const directory = copyFixtures("passing");
      const getConfig = (jsx: string) =>
        JSON.stringify({ compilerOptions: { jsx, jsxFactory: "h", strict: true }, include: ["*"] });
      writeFileSync(
        join(directory, "view.tsx"),
        'const h = (type: string, props: unknown, ...children: unknown[]) => `${type}(${children.join(",")})`;\nconst view = <p>{1}</p>;\nif (view !== "p(1)") throw new Error(view);\n',
      );
      writeFileSync(join(directory, "tsconfig.json"), getConfig(kept));
      expect(runNodeOnJsx(directory, "view.tsx").stderr).toContain("SyntaxError");
      expect(getExit(runCli(directory, ["view.tsx"]))).toEqual([
        255,
        "TlaTypeScriptError: tla-ts can't run view.tsx, whose tsconfig.json leaves its JSX for another tool to compile\n",
      ]);
      writeFileSync(join(directory, "tsconfig.json"), getConfig(compiled));
      expect(getExit(runNodeOnJsx(directory, "view.tsx"))).toEqual([0, ""]);
      expect(getExit(runCli(directory, ["view.tsx"]))).toEqual([0, ""]);
    });
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

  // Node writes a throw's line, a caret under its place, and the error, as UTF-8 of any character
  // of the file's code: the caret's padding is as long as the line's code units before it, with a
  // tab where the line's UTF-8 has one.
  describe.each([
    ["script", "cjs"],
    ["module", "mjs"],
  ])("prints an uncaught error on a line of é, €, and 😀 in a %s as Node does", (_, extension) => {
    const getScripts = (length: number) => ({
      [`plain.${extension}`]: `const word = "é€😀";\nif (word.length !== ${length}) throw new Error("é€😀 " + word.length);\n`,
      [`tabs.${extension}`]: `const word = "😀\\té";\tif (word.length !== ${length}) throw new Error(word + " €");\n`,
    });

    it.each(Object.keys(getScripts(4)))("agrees with Node on %s", (file) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, file), getScripts(4)[file]);
      expect(runNode(directory, file).status).toBe(0);
      expect(getExit(runCli(directory, [file]))).toEqual([0, ""]);
    });

    it.each(Object.keys(getScripts(5)))("rejects another result on %s", (file) => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, file), getScripts(5)[file]);
      const result = runCli(directory, [file]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, file)));
      expect(result.status).toBe(1);
    });
  });

  // A TLA+ string holds no surrogate without its pair, which Node writes as U+FFFD, and tla-ts
  // writes no control character but a tab or a line feed, nor one that the file's code lacks.
  it.each([
    ["a lone surrogate", 'throw new Error("\\ud800");\n'],
    ["a control character", 'throw new Error("a\\u0001b");\n'],
    ["a character that the code lacks", "throw new Error(String.fromCharCode(233));\n"],
  ])("stops where an uncaught error's message holds %s", (_, source) => {
    const directory = copyFixtures("passing");
    writeFileSync(join(directory, "text.cjs"), source);
    expect(runNode(directory, "text.cjs").status).toBe(1);
    const result = runCli(directory, ["text.cjs"]);
    expect(result.status).not.toBe(1);
    expect(result.stdout).toContain(
      "tla-ts can't print what Node prints for this uncaught exception",
    );
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

  // Node parses each file for its early errors, as V8 does, and TypeScript's checker never runs,
  // whose inference of a long chain of JSDoc types, as a large program's code makes, runs out of
  // stack.
  describe("parses a file of a long chain of JSDoc types as Node does", () => {
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
  });

  // Under Bun, which gives itself Node's version, the CLI stops rather than record Bun's globals as
  // Node's, such as a process that Bun gives as a data property and Node as an accessor.
  it("stops under Bun, whose globals aren't Node's", () => {
    const directory = copyFixtures("passing");
    writeFileSync(
      join(directory, "global.mjs"),
      'if (typeof Object.getOwnPropertyDescriptor(globalThis, "process").get !== "function") throw new Error("data");\n',
    );
    expect(runNode(directory, "global.mjs").status).toBe(0);
    const result = spawnSync("bun", [SOURCE_CLI, "global.mjs"], {
      cwd: directory,
      encoding: "utf8",
    });
    expect(result.status).not.toBe(1);
    expect(result.stderr).toMatch(/tla-ts can't record the host on Bun \d/);
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

  // An ES module imports Node's async_hooks, as Solid's web storage does: a name of it, which is the
  // property of the one object that process.getBuiltinModule gives, and that object as the default.
  // An import of a name that tla-ts doesn't model stops, though Node runs it.
  describe("imports Node's async_hooks as Node does", () => {
    const getModule = (operator: string) =>
      `import { AsyncLocalStorage, AsyncResource as Resource } from "node:async_hooks";\nimport hooks from "async_hooks";\nconst isSame = hooks === process.getBuiltinModule("async_hooks") && hooks.AsyncLocalStorage === AsyncLocalStorage && hooks.AsyncResource === Resource;\nif ((isSame && typeof AsyncLocalStorage === "function") ${operator} true) throw new Error("hooks");\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "hooks.mjs"), getModule("!=="));
      expect(runNode(directory, "hooks.mjs").status).toBe(0);
      expect(getExit(runCli(directory, ["hooks.mjs"]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "hooks.mjs"), getModule("==="));
      const result = runCli(directory, ["hooks.mjs"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "hooks.mjs")));
      expect(result.status).toBe(1);
    });

    it("stops at an import of a name that it doesn't model", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "hooks.mjs"),
        'import { createHook } from "node:async_hooks";\nconsole.log(typeof createHook);\n',
      );
      expect(runNode(directory, "hooks.mjs").status).toBe(0);
      const result = runCli(directory, ["hooks.mjs"]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "tla-ts can't import createHook of node:async_hooks, of which it models AsyncLocalStorage and AsyncResource",
      );
    });
  });

  // A CommonJS module requires Node's async_hooks, as Solid's web storage does, and gets the one
  // object that process.getBuiltinModule gives too.
  describe("requires Node's async_hooks as Node does", () => {
    const getScript = (operator: string) =>
      `const first = require("node:async_hooks");\nconst second = process.getBuiltinModule("async_hooks");\nif ((first === second && first === require("async_hooks")) ${operator} true) throw new Error("hooks");\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "hooks.cjs"), getScript("!=="));
      expect(runNode(directory, "hooks.cjs").status).toBe(0);
      expect(getExit(runCli(directory, ["hooks.cjs"]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "hooks.cjs"), getScript("==="));
      const result = runCli(directory, ["hooks.cjs"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "hooks.cjs")));
      expect(result.status).toBe(1);
    });
  });

  // A CommonJS module requires Node's util for its TextEncoder, as React's server builds do, the
  // global's own.
  describe("requires Node's util as Node does", () => {
    const getScript = (length: number) =>
      `const util = require("util");\nif (util !== require("node:util") || util.TextEncoder !== TextEncoder) throw new Error("util");\nif (new util.TextEncoder().encode("ab").length !== ${length}) throw new Error("length");\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "util.cjs"), getScript(2));
      expect(runNode(directory, "util.cjs").status).toBe(0);
      expect(getExit(runCli(directory, ["util.cjs"]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "util.cjs"), getScript(3));
      const result = runCli(directory, ["util.cjs"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "util.cjs")));
      expect(result.status).toBe(1);
    });
  });

  // A CommonJS module requires Node's crypto and stream, as React's server builds do, and gets the
  // same object of each again.
  describe("requires Node's crypto and stream as Node does", () => {
    const getScript = (type: string) =>
      `const crypto = require("crypto");\nconst stream = require("stream");\nif (crypto !== require("node:crypto") || stream !== require("node:stream")) throw new Error("same");\nif (typeof crypto !== "object" || typeof stream !== "${type}") throw new Error("type");\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "streams.cjs"), getScript("function"));
      expect(runNode(directory, "streams.cjs").status).toBe(0);
      expect(getExit(runCli(directory, ["streams.cjs"]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "streams.cjs"), getScript("object"));
      const result = runCli(directory, ["streams.cjs"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "streams.cjs")));
      expect(result.status).toBe(1);
    });
  });

  // A CommonJS module makes an AsyncLocalStorage of no arguments as it loads, as React's server
  // builds do.
  describe("makes an AsyncLocalStorage as Node does", () => {
    const getScript = (type: string) =>
      `const Storage = require("async_hooks").AsyncLocalStorage;\nconst storage = new Storage();\nif (typeof Storage !== "function" || typeof storage !== "${type}") throw new Error("type");\nif (storage === new Storage()) throw new Error("same");\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "storage.cjs"), getScript("object"));
      expect(runNode(directory, "storage.cjs").status).toBe(0);
      expect(getExit(runCli(directory, ["storage.cjs"]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "storage.cjs"), getScript("function"));
      const result = runCli(directory, ["storage.cjs"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "storage.cjs")));
      expect(result.status).toBe(1);
    });
  });

  // A program makes an AsyncResource and runs a function in its scope, and stops where it uses the
  // constructor otherwise, as an instanceof that Node answers false, whose throw a catch would see.
  describe("uses AsyncResource as Node does", () => {
    const getScript = (expected: number) =>
      `const { AsyncResource } = require("async_hooks");\nif (new AsyncResource("t").runInAsyncScope(() => 2) !== ${expected}) throw new Error("ran");\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "resource.cjs"), getScript(2));
      expect(runNode(directory, "resource.cjs").status).toBe(0);
      expect(getExit(runCli(directory, ["resource.cjs"]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "resource.cjs"), getScript(3));
      const result = runCli(directory, ["resource.cjs"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "resource.cjs")));
      expect(result.status).toBe(1);
    });

    it("stops at an instanceof, whose answer a catch would change", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "resource.cjs"),
        'const { AsyncResource } = require("async_hooks");\nconst getAnswer = () => {\n  try {\n    return ({}) instanceof AsyncResource;\n  } catch {\n    return "threw";\n  }\n};\nif (getAnswer() !== false) throw new Error("answer");\n',
      );
      expect(runNode(directory, "resource.cjs").status).toBe(0);
      const result = runCli(directory, ["resource.cjs"]);
      expect(result.status).not.toBe(1);
      expect(result.stdout).toContain("tla-ts can't run the host's AsyncResource");
    });
  });

  // A program reads the source text of a function of the host, which Node gives as its code has
  // it, where a proxy's would be a native function's.
  it("stops at the source text of a function of the host, which a program may compare", () => {
    const directory = copyFixtures("passing");
    writeFileSync(
      join(directory, "text.mjs"),
      'const text = Function.prototype.toString.call(structuredClone);\nif (!text.startsWith("function structuredClone(")) throw new Error("text");\n',
    );
    expect(runNode(directory, "text.mjs").status).toBe(0);
    const result = runCli(directory, ["text.mjs"]);
    expect(result.status).not.toBe(1);
    expect(result.stdout).toContain("tla-ts can't give the source text of the host's function");
  });

  // A program whose TLA+ code passes the most that a check parses within Node's default heap stops
  // before the check reads it, as one of 230,000 numbers does.
  describe("checks a program within the TLA+ code that Node's default heap holds", () => {
    const getScript = (count: number, expected: number) =>
      `const values = [${Array.from({ length: count }, (_, index) => `${index}.5`).join(", ")}];\nif (values.length !== ${expected}) throw new RangeError("length " + values.length);\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "values.mjs"), getScript(10, 10));
      expect(runNode(directory, "values.mjs").status).toBe(0);
      expect(getExit(runCli(directory, ["values.mjs"]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "values.mjs"), getScript(10, 11));
      const result = runCli(directory, ["values.mjs"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "values.mjs")));
      expect(result.status).toBe(1);
    });

    it("stops at a program whose TLA+ code passes the bound", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "values.mjs"), getScript(230_000, 230_000));
      expect(runNode(directory, "values.mjs").status).toBe(0);
      const result = runCli(directory, ["values.mjs"]);
      expect([0, 1]).not.toContain(result.status);
      expect(result.stderr).toContain(
        "tla-ts can't check a program whose TLA+ spec has more than 55000000 characters",
      );
    });
  });

  // A module reads Node's performance, as React's server builds do, whose now gives the time,
  // which each run reads anew, so the check stops where a program reads the time it gives.
  describe("reads Node's performance as Node does", () => {
    const getScript = (kind: string) =>
      `const isClock = typeof performance === "object" && typeof performance.now === "${kind}";\nif (!isClock) throw new Error("clock");\nconst start = performance.now();\nif (typeof start !== "number") throw new Error("start");\n`;

    it("agrees with Node", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "clock.cjs"), getScript("function"));
      expect(runNode(directory, "clock.cjs").status).toBe(0);
      expect(getExit(runCli(directory, ["clock.cjs"]))).toEqual([0, ""]);
    });

    it("rejects another result", () => {
      const directory = copyFixtures("passing");
      writeFileSync(join(directory, "clock.cjs"), getScript("object"));
      const result = runCli(directory, ["clock.cjs"]);
      expect(getExit(result)).toEqual(getExit(runNode(directory, "clock.cjs")));
      expect(result.status).toBe(1);
    });

    it("stops where the program calls now on another object, whose TypeError a catch would see", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "clock.cjs"),
        'const getAnswer = () => {\n  try {\n    return typeof performance.now.call({});\n  } catch (error) {\n    return error.name;\n  }\n};\nif (getAnswer() !== "TypeError") throw new Error("answer");\n',
      );
      expect(runNode(directory, "clock.cjs").status).toBe(0);
      const result = runCli(directory, ["clock.cjs"]);
      expect(result.status).not.toBe(1);
      expect(result.stdout).toContain("tla-ts can't run the host's performance.now");
    });

    it("stops where the program reads the time that now gives", () => {
      const directory = copyFixtures("passing");
      writeFileSync(
        join(directory, "clock.cjs"),
        'if (performance.now() < 0) throw new Error("before");\n',
      );
      expect(runCli(directory, ["clock.cjs"]).stdout).toContain(
        "tla-ts can't read the host's clock, whose time each run reads anew",
      );
    });
  });

  // With -shared, the files' modules run once, as an entry that imports them in their order does,
  // and each file's model starts from the state that leaves, where the second module to bump the
  // counter both import sees 2, as Node sees it once it imports both.
  describe("checks each file's model from the state that importing the files in order leaves", () => {
    const writeModules = (directory: string) => {
      writeFileSync(join(directory, "package.json"), '{"type":"module"}');
      writeFileSync(
        join(directory, "counter.ts"),
        "export const state = { count: 0 };\nexport const bump = () => {\n  state.count += 1;\n  return state.count;\n};\n",
      );
      writeFileSync(
        join(directory, "first.ts"),
        'import { bump } from "./counter.ts";\nconst seen = bump();\nexport const isFirst = () => seen === 1;\n',
      );
      writeFileSync(
        join(directory, "second.ts"),
        'import { bump } from "./counter.ts";\nconst seen = bump();\nexport const isSecond = () => seen === 2;\n',
      );
      writeFileSync(
        join(directory, "replay.mjs"),
        'await import("./first.ts");\nconst second = await import("./second.ts");\nif (!second.isSecond()) throw new Error("isSecond");\n',
      );
      writeFileSync(
        join(directory, "alone.mjs"),
        'const second = await import("./second.ts");\nif (second.isSecond()) throw new Error("isSecond");\n',
      );
      return directory;
    };
    const getChecks = (output: string) =>
      output
        .split(/^Checking /m)
        .slice(1)
        .map((check) =>
          check.includes("Model checking completed. No error has been found.")
            ? "pass"
            : (/^Error: .*$/m.exec(check)?.[0] ?? check),
        );

    it("agrees with Node", () => {
      const directory = writeModules(copyFixtures("passing"));
      expect(runNode(directory, "replay.mjs").status).toBe(0);
      const result = runCli(directory, ["-shared", "first.ts", "second.ts"]);
      expect(getChecks(result.stdout)).toEqual(["pass", "pass"]);
      expect(result.status).toBe(0);
    }, 120_000);

    // A module whose functions the model calls none of checks that the shared program runs, and
    // where the program throws as it loads, as third.ts does where it bumps the counter third, each
    // file checks alone, as Node runs it.
    it.each([
      ["runs", "", ["pass", "pass", "pass"]],
      ["throws", 'if (seen === 3) throw new Error("shared");\n', ["pass", "fail", "pass"]],
    ])(
      "checks a module without calls where the shared program %s",
      (_kind, line, expected) => {
        const directory = writeModules(copyFixtures("passing"));
        writeFileSync(
          join(directory, "third.ts"),
          `import { bump } from "./counter.ts";\nconst seen = bump();\n${line}export const apply = (f: (n: number) => number) => f(seen);\n`,
        );
        const result = runCli(directory, ["-shared", "first.ts", "second.ts", "third.ts"]);
        expect(
          getChecks(result.stdout).map((check) => (check === "pass" ? check : "fail")),
        ).toEqual(expected);
      },
      120_000,
    );

    // Each group checks in a worker of its own, whose heap is the one a run of a file alone has.
    it("shows each file's check with the heap of a run of one file", () => {
      const directory = writeModules(copyFixtures("passing"));
      const getHeaps = (output: string) =>
        [...output.matchAll(/ with (\d+)MB heap /g)].map((match) => match[1]);
      const heap = getHeaps(runCli(directory, ["first.ts"]).stdout)[0];
      expect(heap).toBeDefined();
      expect(getHeaps(runCli(directory, ["-shared", "first.ts", "second.ts"]).stdout)).toEqual([
        heap,
        heap,
      ]);
    }, 120_000);

    it("checks each file alone without it, as Node runs it alone", () => {
      const directory = writeModules(copyFixtures("passing"));
      expect(runNode(directory, "alone.mjs").status).toBe(0);
      const result = runCli(directory, ["first.ts", "second.ts"]);
      // second.ts has no state, so its check reads isSecond as an ASSUME.
      expect(getChecks(result.stdout)).toEqual([
        "pass",
        expect.stringMatching(
          /^Error: Assumption line \d+, col \d+ to line \d+, col \d+ of module ProgramCode is false\.$/,
        ),
      ]);
    }, 120_000);
  });

  // A run's files read their types in one program of their project, but a file whose types a
  // global that another file of the run augments could change reads them in a program of its own,
  // as a run of it alone does. a.ts picks a key of Kinds, which holds only a where a.ts runs alone.
  describe("reads each file's types in its run's program", () => {
    const getKinds = (kind: string) =>
      `declare global {\n  interface Kinds {\n    ${kind}: true;\n  }\n}\n`;
    const writeModules = (directory: string) => {
      writeFileSync(join(directory, "package.json"), '{"type":"module"}');
      writeFileSync(
        join(directory, "a.ts"),
        `${getKinds("a")}let last: keyof Kinds | undefined = undefined;\nexport const pick = (kind: keyof Kinds) => {\n  last = kind;\n};\nexport const isA = () => last === undefined || last === "a";\n`,
      );
      writeFileSync(join(directory, "b.ts"), `${getKinds("b")}export const isB = () => true;\n`);
      writeFileSync(
        join(directory, "c.ts"),
        `import { isA } from "./a.ts";\n${getKinds("c")}export const isC = () => isA();\n`,
      );
      return directory;
    };
    const getChecks = (output: string) =>
      output
        .split(/^Checking /m)
        .slice(1)
        .map((check) =>
          check.includes("Model checking completed. No error has been found.")
            ? "pass"
            : (/^Error: .*$/m.exec(check)?.[0] ?? check),
        );
    // The files that read their types in a program of their own.
    const getAugmented = (output: string) =>
      [
        ...output.matchAll(
          /^tla-ts reads the types of (\S+) in a program of its own \[augmented\]/gm,
        ),
      ].map((match) => match[1]);

    it.each([[[]], [["-shared"]]])(
      "checks a file that another file augments as a run of it alone does, with %j",
      (flags) => {
        const directory = writeModules(copyFixtures("passing"));
        expect(runNode(directory, "a.ts").status).toBe(0);
        expect(runCli(directory, ["a.ts"]).stdout).toContain(
          "Model checking completed. No error has been found.",
        );
        const result = runCli(directory, [...flags, "a.ts", "b.ts"]);
        expect(getChecks(result.stdout)).toEqual(["pass", "pass"]);
        expect(getAugmented(result.stdout)).toEqual(["a.ts", "b.ts"]);
      },
      120_000,
    );

    // A file that imports a.ts reads its augmentation as a run of it alone does, so it reads the
    // run's program, where a.ts reads its own.
    it("reads the run's program for a file whose imports reach the augmentation", () => {
      const directory = writeModules(copyFixtures("passing"));
      const result = runCli(directory, ["a.ts", "c.ts"]);
      expect(getChecks(result.stdout)).toEqual(["pass", "pass"]);
      expect(getAugmented(result.stdout)).toEqual(["a.ts"]);
    }, 120_000);

    // Where a.ts imports b.ts, Kinds holds b too, which a.ts picks, so isA fails.
    it("rejects a file whose own imports augment what it reads", () => {
      const directory = writeModules(copyFixtures("passing"));
      writeFileSync(
        join(directory, "a.ts"),
        `import "./b.ts";\n${readFileSync(join(directory, "a.ts"), "utf8")}`,
      );
      expect(runNode(directory, "a.ts").status).toBe(0);
      const result = runCli(directory, ["a.ts", "b.ts"]);
      expect(getChecks(result.stdout)).toEqual(["Error: Invariant isA is violated.", "pass"]);
      expect(getAugmented(result.stdout)).toEqual(["b.ts"]);
    }, 120_000);
  });

  // A run's program numbers its types in the order that its files read them, and TypeScript orders
  // a union's members by those numbers, so b.ts, which reads "y" first, would turn a.ts's "x" | "y"
  // around. a.ts's frame and notes read the same alone and after b.ts.
  describe("frames a file as a run of it alone does, whatever file reads its types first", () => {
    const writeModules = (directory: string, check: string) => {
      writeFileSync(join(directory, "package.json"), '{"type":"module"}');
      writeFileSync(
        join(directory, "a.ts"),
        `type Key = "x" | "y";\nlet last: Key | undefined = undefined;\nexport const pick = (key: Key) => {\n  last = key;\n};\nexport const label = (entry: { key: "x" | "y"; [name: string]: unknown }) => {\n  last = entry.key;\n};\nexport const isPicked = () => last === undefined || ${check};\n`,
      );
      writeFileSync(
        join(directory, "b.ts"),
        'let seen: "y" | undefined = undefined;\nexport const see = (key: "y") => {\n  seen = key;\n};\nexport const isSeen = () => seen === undefined || seen === "y";\n',
      );
      return directory;
    };
    // a.ts's output, without the process and the times that each run prints anew.
    const getOutput = (stdout: string) =>
      (stdout.split("Checking a.ts\n").at(-1) ?? "")
        .replace(/\[pid: \d+\]/g, "")
        .replace(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d/g, "")
        .replace(/Finished in \S+/g, "");
    const options = ["-noGenerateSpecTE", "-seed", "1", "-fp", "1", "-frame"];

    it.each([
      [
        'last === "x" || last === "y"',
        "Model checking completed. No error has been found.",
        "false",
      ],
      ['last === "x"', "Error: Invariant isPicked is violated.", "true"],
    ])(
      "prints a.ts where it checks %s",
      (check, verdict, isViolated) => {
        const directory = writeModules(copyFixtures("passing"), check);
        const alone = runCli(directory, [...options, "a.ts"]);
        expect(alone.stdout).toContain('Next == \\E key \\in ({"x", "y"}) : pick(key)');
        expect(alone.stdout).toContain(
          'tla-ts calls no label: its parameter entry takes values it can\'t list: { [name: string]: unknown; key: "x" | "y"; } isn\'t finite',
        );
        expect(alone.stdout).toContain(verdict);
        expect(isViolatedInNode(directory, "a.ts", 1, alone.stdout)).toBe(isViolated);
        const after = runCli(directory, [...options, "b.ts", "a.ts"]);
        expect(after.stdout).toContain("Checking a.ts\n");
        expect(getOutput(after.stdout)).toBe(getOutput(alone.stdout));
      },
      120_000,
    );

    // A mapped type's fields come in the order of its keys' union, which their ids give, so they
    // follow the union as a.ts writes it, which here is by their names.
    it("prints the fields of a record of a mapped type by their names", () => {
      const directory = writeModules(copyFixtures("passing"), 'last === "x"');
      writeFileSync(
        join(directory, "a.ts"),
        'type Key = "x" | "y";\nlet last: Record<Key, boolean> | undefined = undefined;\nexport const set = (flags: Record<Key, boolean>) => {\n  last = flags;\n};\nexport const isSet = () => last === undefined || typeof last.x === "boolean";\n',
      );
      const alone = runCli(directory, [...options, "a.ts"]);
      expect(alone.stdout).toContain(
        "Next == \\E flags \\in [x : (BOOLEAN), y : (BOOLEAN)] : set(flags)",
      );
      expect(alone.stdout).toContain("Model checking completed. No error has been found.");
      const after = runCli(directory, [...options, "b.ts", "a.ts"]);
      expect(getOutput(after.stdout)).toBe(getOutput(alone.stdout));
    }, 120_000);

    // TLC enumerates a \cup operand by operand and stops at the first state that violates an
    // invariant, so the frame lists a union's members in the order that a.ts writes them, rather
    // than by their text, and the check reports the first that a.ts writes.
    it.each([
      ['{ fruit: "pear" } | { fruit: "apple" }', '"pear"', '"apple"'],
      ['{ fruit: "apple" } | { fruit: "pear" }', '"apple"', '"pear"'],
    ])(
      "enumerates the union %s in the order that a.ts writes it",
      (union, first, second) => {
        const directory = writeModules(copyFixtures("passing"), 'last === "x"');
        writeFileSync(
          join(directory, "a.ts"),
          `type Order = ${union};\nlet last: Order | undefined = undefined;\nexport const order = (next: Order) => {\n  last = next;\n};\nexport const isUnset = () => last === undefined;\n`,
        );
        const alone = runCli(directory, [...options, "a.ts"]);
        expect(alone.stdout).toContain(
          `Next == \\E next \\in ([fruit : ({${first}})]) \\cup ([fruit : ({${second}})]) : order(next)`,
        );
        expect(alone.stdout).toContain("Error: Invariant isUnset is violated.");
        expect(alone.stdout).toContain(`State 2: <order([fruit |-> ${first}])`);
        const after = runCli(directory, [...options, "b.ts", "a.ts"]);
        expect(getOutput(after.stdout)).toBe(getOutput(alone.stdout));
      },
      120_000,
    );
  });

  // A file of thousands of function declarations, as react-dom's client build has, instantiates
  // them in a loop, in their order, rather than in a chain of states that overflows the stack. A
  // check of it takes 8 to 11 s on an idle machine, and up to 46 s on a loaded one.
  describe.each(["cjs", "mjs"])(
    "runs a .%s file of thousands of function declarations as Node does",
    (extension) => {
      const getScript = (expected: number) =>
        `${Array.from({ length: 3000 }, (_, index) => `function f${index}() {\n  return ${index};\n}`).join("\n")}\nconst total = f0() + f1499() + f2999();\nif (total !== ${expected}) throw new RangeError("total " + total);\n`;

      it("agrees with Node", () => {
        const directory = copyFixtures("passing");
        writeFileSync(join(directory, `many.${extension}`), getScript(4498));
        expect(runNode(directory, `many.${extension}`).status).toBe(0);
        expect(getExit(runCli(directory, [`many.${extension}`]))).toEqual([0, ""]);
      }, 120_000);

      it("rejects another result", () => {
        const directory = copyFixtures("passing");
        writeFileSync(join(directory, `many.${extension}`), getScript(4499));
        const result = runCli(directory, [`many.${extension}`]);
        expect(getExit(result)).toEqual(getExit(runNode(directory, `many.${extension}`)));
        expect(result.status).toBe(1);
      }, 120_000);
    },
  );
});
