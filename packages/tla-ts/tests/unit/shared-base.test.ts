import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { compileSharedFiles, type CompiledInput } from "../../src/cli/typescript";
import type { CheckOptions } from "../../src/check";
import { TlaError } from "../../src/errors";
import { check } from "../../src/parallel";
import type { CheckBase, CliSettings } from "../../src/search";

const directories: string[] = [];

afterAll(() => directories.forEach((directory) => rmSync(directory, { recursive: true })));

// Modules that bump a counter they share as they load: second.ts sees 2 where first.ts loads
// before it, as Node sees once it imports both, and late.ts, which sees 3, asserts it sees 1. The
// state of counted.ts changes at each step, so its model has a variable, where the others have none.
const writeModules = () => {
  const directory = mkdtempSync(join(tmpdir(), "tla-ts-shared-"));
  directories.push(directory);
  const files = {
    "package.json": '{"type":"module"}',
    "counter.ts":
      "export const state = { count: 0 };\nexport const bump = () => {\n  state.count += 1;\n  return state.count;\n};\n",
    "first.ts":
      'import { bump } from "./counter.ts";\nconst seen = bump();\nexport const isFirst = () => seen === 1;\n',
    "second.ts":
      'import { bump } from "./counter.ts";\nconst seen = bump();\nexport const isSecond = () => seen === 2;\n',
    "late.ts":
      'import { bump } from "./counter.ts";\nconst seen = bump();\nexport const isFirst = () => seen === 1;\n',
    "counted.ts":
      'import { state } from "./counter.ts";\nexport const read = () => state.count;\nexport const reset = (count: 0 | 1) => {\n  state.count = count;\n};\n',
    "replay.mjs":
      'await import("./first.ts");\nconst second = await import("./second.ts");\nconst late = await import("./late.ts");\nconsole.log(second.isSecond(), late.isFirst());\n',
  };
  Object.entries(files).forEach((entry) => writeFileSync(join(directory, entry[0]), entry[1]));
  return directory;
};

// The result of a check of a file's spec, or the message of the error that stops it.
const checkInput = (input: CompiledInput, base?: CheckBase) => {
  const options: CheckOptions & CliSettings = {
    source: input.source,
    config: input.config,
    loadModule: input.loadModule,
    preparedModules: input.preparedModules,
    seed: 1n,
    base,
    rankedStrings: base && input.strings,
  };
  return check(options).catch((error: unknown) =>
    error instanceof TlaError ? error.message : Promise.reject(error),
  );
};

// What a group's base holds, which no check of a file of the group changes.
const getBaseState = (base: CheckBase) => {
  const environment = base.environment;
  return {
    definitions: [...environment.link.definitions.keys()],
    linkOrder: environment.link.linkOrder.map((linked) => linked.module.name),
    copyCount: environment.link.copyCount,
    rows: [...environment.facts.rows],
    effects: [...environment.facts.effects],
    ids: environment.facts.ids.size,
    startupValues: [...environment.startupValues],
    strings: [...base.strings],
    contexts: [...base.contexts].map((entry) => [entry[0], entry[1].inserted.length]),
  };
};

describe("checks of the files of a group from its base", () => {
  it("check each file as its spec checks without the base, as Node runs the files in order, and leave the base as it was", async () => {
    const directory = writeModules();
    expect(
      spawnSync(process.execPath, ["replay.mjs"], { cwd: directory, encoding: "utf8" }).stdout,
    ).toBe("true false\n");
    const inputs = await compileSharedFiles(
      ["first.ts", "second.ts", "late.ts", "counted.ts"].map((file) => join(directory, file)),
      {
        maxSetSize: undefined,
        seed: undefined,
        fingerprintPolynomial: undefined,
        version: "master",
      },
      Infinity,
    );
    if (typeof inputs === "number") throw new Error("the program is above the budget");
    const base = inputs[0]?.base;
    if (base === undefined) throw new Error("the files share no base");
    expect(inputs.map((input) => input?.base === base)).toEqual([true, true, true, true]);
    const before = getBaseState(base);
    const results = [];
    for (const input of inputs) {
      if (input === undefined) throw new Error("a file has no spec");
      const shared = await checkInput(input, base);
      expect(shared).toEqual(await checkInput(input));
      results.push(typeof shared === "string" ? shared : shared.status);
    }
    expect(results).toEqual([
      "success",
      "success",
      "The invariant of isFirst is equal to FALSE",
      "success",
    ]);
    expect(getBaseState(base)).toEqual(before);
  }, 300_000);
});
