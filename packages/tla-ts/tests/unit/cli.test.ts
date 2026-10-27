import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const FIXTURES = join(import.meta.dirname, "../fixtures");

const runCli = (directory: string, name: string) =>
  spawnSync(
    process.execPath,
    ["--import", "tsx", join(import.meta.dirname, "../../src/cli.ts"), `${name}.tla`],
    { cwd: join(FIXTURES, directory), encoding: "utf8" },
  );

const getStateLines = (output: string) =>
  output.split("\n").filter((line) => line.includes(" = ") && !line.startsWith("State"));

describe("the CLI prints traces like TLC", () => {
  it("prints a state with one variable without a conjunction", () => {
    const result = runCli("counter", "Counter");
    expect(result.status).toBe(11);
    expect(getStateLines(result.stdout)).toEqual([
      "count = 0",
      "count = 1",
      "count = 2",
      "count = 3",
    ]);
  });

  it("prints a state with several variables as a conjunction", () => {
    const result = runCli("water-jugs", "WaterJugs");
    expect(result.status).toBe(12);
    expect(getStateLines(result.stdout).slice(0, 2)).toEqual(["/\\ large = 0", "/\\ small = 0"]);
  });
});

// TLC's output for the same models, without the lines that report versions, progress and time.
const TLC_REPORTS = [
  [
    "AssumptionFalse",
    10,
    ["Error: Assumption line 4, col 20 to line 4, col 24 of module AssumptionFalse is false."],
  ],
  ["InitialInvariant", 12, ["Error: Invariant Inv is violated by the initial state:", "x = 0", ""]],
  [
    "Lasso",
    13,
    [
      "Error: Temporal property Prop was violated.",
      "",
      "Error: The following behavior constitutes a counter-example:",
      "",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      "State 2: <Next line 5, col 9 to line 5, col 18 of module Lasso>",
      "x = 1",
      "",
      "Back to state 1: <Next line 5, col 9 to line 5, col 18 of module Lasso>",
      "",
      "3 states generated, 2 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 2.",
    ],
  ],
  [
    "FailedInvariant",
    76,
    [
      "Error: Evaluating invariant Inv failed.",
      "The second argument of \\div is 0.",
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      "State 2: <Next line 5, col 9 to line 5, col 27 of module FailedInvariant>",
      "x = 1",
      "",
      "State 3: <Next line 5, col 9 to line 5, col 27 of module FailedInvariant>",
      "x = 2",
      "",
      "3 states generated, 3 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 3.",
    ],
  ],
  ["NoNext", 75, ["Error: No next state actions defined to generate successor states from."]],
] as const;

describe("the CLI reports results like TLC", () => {
  it.each(TLC_REPORTS)("reports %s", (name, code, lines) => {
    const result = runCli("cli-output", name);
    expect(result.status).toBe(code);
    expect(result.stdout.split("\n").slice(1)).toEqual([...lines, ""]);
  });
});
