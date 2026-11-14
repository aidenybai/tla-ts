import { spawnSync } from "node:child_process";
import {
  cpSync,
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

  it("checks a script with the JavaScript module that the compiler gives it", () => {
    const directory = copyFixtures("passing");
    const result = runCli(directory, ["script.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Parsing file \S+JavaScript\.tla\n/);
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
    ["a primitive", "throw 42;\n", "try {\n  throw 42;\n} catch {}\n"],
    [
      "an error in an ES module",
      'await Promise.resolve();\nthrow new Error("after");\n',
      'await Promise.resolve();\ntry {\n  throw new Error("after");\n} catch {}\n',
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

  it("reads names that a module re-exports", () => {
    const result = runCli(copyFixtures("project"), ["relay.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4 distinct states found");
  });

  it("checks the module that re-exports names", () => {
    expect(runCli(copyFixtures("project"), ["barrel.ts"]).status).toBe(0);
  });

  it("type checks a file of a project with the project's tsconfig.json", () => {
    const result = runCli(copyFixtures("project"), ["counter.ts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4 distinct states found");
  });

  it("stops where a model reads a name that only a declaration file gives", () => {
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
    const result = runCli(copyFixtures("failing"), ["division.ts", "overdraft.ts"]);
    expect(result.stderr).toContain(
      "TlaTypeScriptError: division.ts:4:11 Write division as Math.floor(a / b) or Math.trunc(a / b)",
    );
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
});
