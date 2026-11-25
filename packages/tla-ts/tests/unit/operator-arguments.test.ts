import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { checkFixture, FIXTURES } from "./check-harness";
import { DIST_CLI } from "./cli-harness";

const DIRECTORY = "operator-arguments";

const runSpec = (
  args: string[],
  module = "OperatorArguments",
  files: [string, string | Uint8Array][] = [],
) => {
  const directory = mkdtempSync(join(tmpdir(), "operator-arguments-"));
  cpSync(join(FIXTURES, DIRECTORY), directory, { recursive: true });
  files.forEach((file) => writeFileSync(join(directory, file[0]), file[1]));
  const result = spawnSync(process.execPath, [DIST_CLI, `${module}.tla`, "-fp", "0", ...args], {
    cwd: directory,
    encoding: "utf8",
  });
  const graphPath = join(directory, "OperatorArguments_actions.dot");
  const graph = existsSync(graphPath) ? readFileSync(graphPath, "utf8") : undefined;
  const traceFile = readdirSync(directory).find((file) => file.endsWith(".bin"));
  const trace = traceFile === undefined ? undefined : readFileSync(join(directory, traceFile));
  rmSync(directory, { recursive: true });
  return { status: result.status, lines: result.stdout.split("\n"), graph, trace };
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
    const run = runSpec(["-noGenerateSpecTE"]);
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
    const run = runSpec([
      "-noGenerateSpecTE",
      "-deadlock",
      "-coverage",
      "1",
      "-config",
      "Graph.cfg",
    ]);
    const module = "of module OperatorArguments";
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
        `<Init line 6, col 1 to line 6, col 4 ${module}>: 1:1`,
        `  line 6, col 9 to line 6, col 13 ${module}: 1`,
        `<Step line 4, col 1 to line 4, col 10 ${module}>: 4:6`,
        `  line 4, col 15 to line 4, col 19 ${module}: 6`,
        `  |line 4, col 15 to line 4, col 15 ${module}: 10`,
        `  line 4, col 24 to line 4, col 32 ${module}: 6`,
        `<Step line 4, col 1 to line 4, col 10 ${module} (7 48 7 77)>: 0:3`,
        `  line 4, col 15 to line 4, col 19 ${module}: 3`,
        `  |line 4, col 15 to line 4, col 15 ${module}: 5`,
        `  line 4, col 24 to line 4, col 32 ${module}: 3`,
        `  line 7, col 64 to line 7, col 76 ${module}: 3`,
      ],
    ]);
  });

  it("draws the actions it splits from one body as one vertex of -simulate's action graph", () => {
    const run = runSpec([
      "-noGenerateSpecTE",
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
      "-noGenerateSpecTE",
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
      ["-noGenerateSpecTE", "-deadlock", "-coverage", "1", "-config", "OperatorCoverage.cfg"],
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
    const run = runSpec(
      ["-noGenerateSpecTE", "-simulate", "num=1", "-depth", "4", "-seed", "2"],
      "Outer",
    );
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

const BEHAVIOR = "Error: The behavior up to this point is:";

const simulateInvariant = (module: string, invariant: string) =>
  runSpec(["-noGenerateSpecTE", "-simulate", "num=1", "-depth", "4", "-seed", "1"], module, [
    [`${module}.cfg`, `INIT Init\nNEXT Next\nINVARIANT ${invariant}\n`],
  ]);

const getFailure = (invariant: string, lines: string[]) =>
  lines.slice(
    lines.findIndex((line) => line === `Error: Evaluating invariant ${invariant} failed.`) + 1,
    lines.indexOf(BEHAVIOR),
  );

const getPrinted = (lines: string[]) =>
  lines.slice(
    lines.findIndex((line) => line.startsWith("Finished computing initial")) + 1,
    lines.indexOf(BEHAVIOR) + 1,
  );

describe('an operator TLCGet("action") binds is a value only as TLC\'s OpLambdaValue is', () => {
  it.each([
    [
      "EqualsNumber",
      76,
      ["Attempted to check equality of operator <Operator Inc> with value:", "1"],
    ],
    [
      "EqualsItself",
      76,
      ["Attempted to check equality of operator <Operator Inc> with value:", "<Operator Inc>"],
    ],
    [
      "Compares",
      76,
      ["Attempted to compare operator <Operator Inc> with value:", "<Operator Inc>"],
    ],
    [
      "HasMember",
      76,
      ["Attempted to check if the value:", "1", "is an element of operator <Operator Inc>"],
    ],
    [
      "Applies",
      76,
      [
        "A non-function (an operator) was applied as a function.",
        "line 14, col 21 to line 14, col 25 of module OperatorValues",
      ],
    ],
    [
      "HasDomain",
      76,
      [
        "Attempted to apply the operator DOMAIN to a non-function",
        "(an operator)",
        "line 15, col 23 to line 15, col 31 of module OperatorValues",
      ],
    ],
    [
      "IsFinite",
      76,
      [
        "Attempted to apply the operator overridden by the Java method",
        "public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),",
        "but it produced the following error:",
        "Attempted to check if the operator <Operator Inc> is a finite set.",
      ],
    ],
    ["Counts", 76, ["Attempted to compute cardinality of the value", "<Operator Inc>"]],
    [
      "Subsets",
      76,
      ["Attempted to compute the number of elements in the operator <Operator Inc>."],
    ],
  ])("fails %s in -simulate with TLC's message", (invariant, status, message) => {
    const run = simulateInvariant("OperatorValues", invariant);
    expect([run.status, getFailure(invariant, run.lines)]).toEqual([status, message]);
  });

  it.each([
    ["Prints", ["<Operator Inc>", "<Operator Inc>", "<Operator Inc>"]],
    ["Shows", []],
  ])("prints the operator in %s as TLC does", (invariant, printed) => {
    const run = simulateInvariant("OperatorValues", invariant);
    expect([run.status, getPrinted(run.lines)]).toEqual([
      11,
      [...printed, "Error: Deadlock reached.", BEHAVIOR],
    ]);
  });
});

const LEN_METHOD =
  "<Java Method: public static tlc2.value.impl.IntValue tlc2.module.Sequences.Len(tlc2.value.impl.Value)>";

const LEN_STEP = `<Step(${LEN_METHOD}) line 4, col 15 to line 4, col 40 of module OperatorJava>`;

describe("an action with a Java override for an argument binds it as TLC's MethodValue", () => {
  it("labels a step by the Java method its action binds", () => {
    const run = runSpec(["-noGenerateSpecTE"], "OperatorJava", [
      ["OperatorJava.cfg", "INIT Init\nNEXT Next\nINVARIANT Inv\n"],
    ]);
    expect([run.status, run.lines.filter((line) => line.startsWith("State "))]).toEqual([
      12,
      ["State 1: <Initial predicate>", `State 2: ${LEN_STEP}`, `State 3: ${LEN_STEP}`],
    ]);
  });

  it("fails to apply the Java method as a function with TLC's message", () => {
    const run = simulateInvariant("OperatorJava", "Applies");
    expect([run.status, getFailure("Applies", run.lines)]).toEqual([
      76,
      [
        "A non-function (a java method) was applied as a function.",
        "line 13, col 21 to line 13, col 25 of module OperatorJava",
      ],
    ]);
  });

  it("prints the Java method as TLC does", () => {
    const run = simulateInvariant("OperatorJava", "Prints");
    expect([run.status, getPrinted(run.lines)]).toEqual([
      11,
      [LEN_METHOD, LEN_METHOD, LEN_METHOD, "Error: Deadlock reached.", BEHAVIOR],
    ]);
  });

  it.each([
    ["EqualsNumber", [`Attempted to check equality of operator ${LEN_METHOD} with value:`, "1"]],
    ["Compares", [`Attempted to compare operator ${LEN_METHOD} with value:`, LEN_METHOD]],
    [
      "HasMember",
      ["Attempted to check if the value:", "1", `is an element of operator ${LEN_METHOD}`],
    ],
  ])(
    "fails %s with the whole message, which a string precedence bug in TLC's MethodValue cuts short",
    (invariant, message) => {
      const run = simulateInvariant("OperatorJava", invariant);
      expect([run.status, getFailure(invariant, run.lines)]).toEqual([76, message]);
    },
  );
});

const SERIALIZE_ERROR = [
  "Error: Evaluating postcondition _TLCTraceSilent at line 28, col 5 to line 28, col 21 of module _TLCTrace failed.",
  "Attempted to apply the operator overridden by the Java method",
  "public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException,",
  "but it produced the following error:",
  "TLC has found a state in which the value of a variable contains <Operator Inc>",
];

const isPostconditionError = (line: string) => line.startsWith("Error: Evaluating postcondition");

describe("a trace file leaves out the operators a split action binds", () => {
  it.each([[[]], [["-noGenerateSpecTE", "-dumpTrace", "tlc", "dump.bin"]]])(
    "writes a trace with %j that TLC's -loadTrace tlc replays",
    (args) => {
      const written = runSpec(args);
      const replayed = runSpec(
        ["-noGenerateSpecTE", "-loadTrace", "tlc", "trace.bin"],
        "OperatorArguments",
        [["trace.bin", written.trace ?? ""]],
      );
      const start = replayed.lines.indexOf("Error: Invariant Inv is violated.");
      const end = replayed.lines.findIndex((line) => line.endsWith("states left on queue."));
      expect([
        written.status,
        written.lines.filter(isPostconditionError),
        replayed.status,
        replayed.lines.slice(start, end + 1),
      ]).toEqual([
        12,
        [],
        12,
        [
          "Error: Invariant Inv is violated.",
          BEHAVIOR,
          "State 1: <Initial predicate>",
          "x = 0",
          "",
          `State 2: <Step(<Operator Inc>) ${STEP}>`,
          "x = 1",
          "",
          `State 3: <Step(<Operator LAMBDA>) ${STEP}>`,
          "x = 3",
          "",
          "6 states generated, 3 distinct states found, 0 states left on queue.",
        ],
      ]);
    },
  );

  it("keeps the operators in the CounterExample a POSTCONDITION reads", () => {
    const run = runSpec(["-config", "OperatorTrace.cfg"], "OperatorTrace");
    const action = (operator: string) =>
      `[name |-> "Step", ${SPLIT_LOCATION}, context |-> [F |-> <Operator ${operator}>], parameters |-> <<"F">>]`;
    expect([
      run.status,
      run.lines.filter((line) => line.startsWith("{") || isPostconditionError(line)),
    ]).toEqual([
      12,
      [
        `{<<<<1, [x |-> 0]>>, ${action("Inc")}, <<2, [x |-> 1]>>>>, <<<<2, [x |-> 1]>>, ${action("LAMBDA")}, <<3, [x |-> 3]>>>>}`,
      ],
    ]);
  });

  it("fails to write a state that holds an operator with TLC's _TLCTrace#ioSerialize error", () => {
    const run = runSpec(
      ["-simulate", "num=1", "-depth", "4", "-seed", "1", "-config", "OperatorState.cfg"],
      "OperatorState",
    );
    const start = run.lines.findIndex(isPostconditionError);
    expect(run.lines.slice(start, start + SERIALIZE_ERROR.length)).toEqual(SERIALIZE_ERROR);
  });
});
