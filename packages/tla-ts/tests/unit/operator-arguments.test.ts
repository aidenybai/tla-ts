import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { checkFixture, FIXTURES } from "./check-harness";
import { DIST_CLI } from "./cli-harness";

const DIRECTORY = "operator-arguments";

const runSpec = (args: string[], module = "OperatorArguments") => {
  const directory = mkdtempSync(join(tmpdir(), "operator-arguments-"));
  cpSync(join(FIXTURES, DIRECTORY), directory, { recursive: true });
  const result = spawnSync(
    process.execPath,
    [DIST_CLI, `${module}.tla`, "-noGenerateSpecTE", "-fp", "0", ...args],
    { cwd: directory, encoding: "utf8" },
  );
  const graphPath = join(directory, "OperatorArguments_actions.dot");
  const graph = existsSync(graphPath) ? readFileSync(graphPath, "utf8") : undefined;
  rmSync(directory, { recursive: true });
  return { status: result.status, lines: result.stdout.split("\n"), graph };
};

const getBehavior = (lines: string[]) =>
  lines.slice(
    lines.findIndex((line) => line.startsWith("State 1:")),
    lines.findIndex((line) => line.startsWith("The number of states generated")),
  );

const STEP = "line 4, col 15 to line 4, col 32 of module OperatorArguments";

const SPLIT_LOCATION =
  'location |-> [beginLine |-> 4, beginColumn |-> 15, endLine |-> 4, endColumn |-> 32, module |-> "OperatorArguments"]';

describe("an action with operators for arguments splits as TLC's Tool#getActionsAppl splits it", () => {
  it("labels a step by the operator its action binds", () => {
    const run = runSpec([]);
    expect([run.status, run.lines.filter((line) => line.startsWith("State "))]).toEqual([
      12,
      [
        "State 1: <Initial predicate>",
        `State 2: <Step(<Operator Inc>) ${STEP}>`,
        `State 3: <Step(<Operator LAMBDA>) ${STEP}>`,
      ],
    ]);
  });

  it.each([
    ["the typed tier", undefined],
    ["the interpreter", 1_000_000],
  ])("finds the violation TLC finds on %s", async (_tier, maxSetSize) => {
    const result = await checkFixture(DIRECTORY, "OperatorArguments", "OperatorArguments", {
      maxSetSize,
    });
    expect([
      result.generatedStates,
      result.distinctStates,
      result.violation?.trace.map((step) => step.label),
    ]).toEqual([
      6,
      4,
      [undefined, `Step(<Operator Inc>) ${STEP}`, `Step(<Operator LAMBDA>) ${STEP}`],
    ]);
  });

  it("counts the actions it splits from one body under one cost model, and splits no operator of a variable", () => {
    const run = runSpec(["-deadlock", "-coverage", "1", "-config", "Graph.cfg"]);
    expect([run.status, run.lines.filter((line) => line.startsWith("<"))]).toEqual([
      0,
      [
        "<x line 3, col 10 to line 3, col 10 of module OperatorArguments>: 4",
        "<Init line 6, col 1 to line 6, col 4 of module OperatorArguments>: 1:1",
        "<Step line 4, col 1 to line 4, col 10 of module OperatorArguments>: 4:6",
        "<Step line 4, col 1 to line 4, col 10 of module OperatorArguments (7 48 7 77)>: 0:3",
      ],
    ]);
  });

  it("draws the actions it splits from one body as one vertex of -simulate's action graph", () => {
    const run = runSpec([
      "-simulate",
      "num=4,stats=basic",
      "-depth",
      "5",
      "-seed",
      "2",
      "-config",
      "Graph.cfg",
    ]);
    expect([run.status, run.graph]).toEqual([
      11,
      readFileSync(join(FIXTURES, DIRECTORY, "OperatorArguments_actions_basic.dot"), "utf8"),
    ]);
  });

  it('binds the operator in the context of TLCGet("action") and counts the action by its name', () => {
    const run = runSpec([
      "-simulate",
      "num=1",
      "-depth",
      "4",
      "-seed",
      "2",
      "-config",
      "Alias.cfg",
    ]);
    expect([run.status, getBehavior(run.lines)]).toEqual([
      11,
      [
        "State 1: <Init line 6, col 9 to line 6, col 13 of module OperatorArguments>",
        "/\\ x = 0",
        '/\\ action = [ name |-> "Init",',
        "  location |->",
        "      [ beginLine |-> 6,",
        "        beginColumn |-> 9,",
        "        endLine |-> 6,",
        "        endColumn |-> 13,",
        '        module |-> "OperatorArguments" ] ]',
        "/\\ counts = []",
        "",
        `State 2: <Step(<Operator Inc>) ${STEP}>`,
        "/\\ x = 1",
        `/\\ action = [name |-> "Step", ${SPLIT_LOCATION}, context |-> [F |-> <Operator Inc>], parameters |-> <<"F">>]`,
        "/\\ counts = [Step |-> 1]",
        "",
        `State 3: <Step(<Operator Inc>) ${STEP}>`,
        "/\\ x = 2",
        `/\\ action = [name |-> "Step", ${SPLIT_LOCATION}, context |-> [F |-> <Operator Inc>], parameters |-> <<"F">>]`,
        "/\\ counts = [Step |-> 2]",
        "",
        "State 4: <Step line 7, col 48 to line 7, col 77 of module OperatorArguments>",
        "/\\ x = 3",
        '/\\ action = [ name |-> "Step",',
        "  location |->",
        "      [ beginLine |-> 7,",
        "        beginColumn |-> 48,",
        "        endLine |-> 7,",
        "        endColumn |-> 77,",
        '        module |-> "OperatorArguments" ] ]',
        "/\\ counts = [Step |-> 3]",
        "",
      ],
    ]);
  });

  it("records no coverage in the body of an operator it calls as a value, as TLC's OpLambdaValue#eval does", () => {
    const run = runSpec(
      ["-deadlock", "-coverage", "1", "-config", "OperatorCoverage.cfg"],
      "OperatorCoverage",
    );
    const module = "of module OperatorCoverage";
    expect([
      run.status,
      run.lines.slice(
        run.lines.findIndex((line) => line.startsWith("<x ")),
        run.lines.indexOf("End of statistics."),
      ),
    ]).toEqual([
      0,
      [
        `<x line 3, col 10 to line 3, col 10 ${module}>: 4`,
        `<Init line 7, col 1 to line 7, col 4 ${module}>: 1:1`,
        `  line 7, col 9 to line 7, col 13 ${module}: 1`,
        `<Step line 6, col 1 to line 6, col 10 ${module}>: 1:3`,
        `  line 6, col 15 to line 6, col 19 ${module}: 3`,
        `  |line 6, col 15 to line 6, col 15 ${module}: 5`,
        `  line 6, col 24 to line 6, col 32 ${module}: 3`,
        `<Next line 8, col 1 to line 8, col 4 ${module} (8 23 8 72)>: 3:3`,
        `  line 8, col 23 to line 8, col 27 ${module}: 3`,
        `  |line 8, col 23 to line 8, col 23 ${module}: 5`,
        `  line 8, col 32 to line 8, col 72 ${module}: 3`,
        `<Inv line 9, col 1 to line 9, col 3 ${module}>`,
        `  line 9, col 8 to line 9, col 27 ${module}: 5`,
        `  |line 9, col 8 to line 9, col 13 ${module}: 5`,
        `  |line 9, col 18 to line 9, col 27 ${module}: 2`,
      ],
    ]);
  });

  it("splits an instanced action by its operator arguments", () => {
    const run = runSpec(["-simulate", "num=1", "-depth", "4", "-seed", "2"], "Outer");
    const step = "line 4, col 1 to line 4, col 31 of module Outer";
    const action = `/\\ action = [name |-> "I!Step", location |-> [beginLine |-> 4, beginColumn |-> 1, endLine |-> 4, endColumn |-> 31, module |-> "Outer"], context |-> [F |-> <Operator Inc>], parameters |-> <<"F">>]`;
    expect([
      run.status,
      run.lines.filter((line) => line.startsWith("State ") || line.startsWith("/\\ action")),
    ]).toEqual([
      11,
      [
        "State 1: <Init line 6, col 9 to line 6, col 13 of module Outer>",
        '/\\ action = [ name |-> "Init",',
        `State 2: <I!Step(<Operator Inc>) ${step}>`,
        action,
        `State 3: <I!Step(<Operator Inc>) ${step}>`,
        action,
        "State 4: <I!Step line 7, col 52 to line 7, col 83 of module Outer>",
        '/\\ action = [ name |-> "I!Step",',
      ],
    ]);
  });
});
