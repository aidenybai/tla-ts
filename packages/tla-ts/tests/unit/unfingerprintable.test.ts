import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { FIXTURES } from "./check-harness";
import { DIST_CLI } from "./cli-harness";

const runSpec = (module: string, args: string[]) => {
  const directory = mkdtempSync(join(tmpdir(), "unfingerprintable-"));
  cpSync(join(FIXTURES, "unfingerprintable"), directory, { recursive: true });
  const result = spawnSync(process.execPath, [DIST_CLI, `${module}.tla`, "-fp", "0", ...args], {
    cwd: directory,
    encoding: "utf8",
  });
  const traceFiles = readdirSync(directory).filter((file) => file.endsWith(".bin"));
  rmSync(directory, { recursive: true });
  const lines = result.stdout.split("\n");
  return {
    status: result.status,
    lines: lines.slice(
      lines.findIndex((line) => line.startsWith("Finished computing initial")) + 1,
      lines.findIndex((line) => line.startsWith("Finished in")),
    ),
    traceFiles,
  };
};

const SIMULATE = ["-simulate", "num=1", "-depth", "10", "-seed", "1"];

const STEP = "line 5, col 9 to line 5, col 60 of module StateNat";

const BEHAVIOR = [
  "Error: The behavior up to this point is:",
  "State 1: <Init line 4, col 9 to line 4, col 22 of module StateNat>",
  "/\\ x = 0",
  "/\\ y = 0",
  "",
  `State 2: <Next ${STEP}>`,
  "/\\ x = 1",
  "/\\ y = 0",
  "",
  `State 3: <Next ${STEP}>`,
  "/\\ x = 2",
  "/\\ y = Nat",
  "",
  `State 4: <Next ${STEP}>`,
  "/\\ x = 3",
  "/\\ y = 0",
  "",
  "The number of states generated: 4",
  "Simulation using seed 1 and aril 0",
];

const PROGRESS =
  "Progress: 4 states checked, 1 traces generated (trace length: mean=0, var(x)=0, sd=0)";

const SERIALIZE_ERROR = [
  "Error: Evaluating postcondition _TLCTraceSilent at line 28, col 5 to line 28, col 21 of module _TLCTrace failed.",
  "Attempted to apply the operator overridden by the Java method",
  "public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException,",
  "but it produced the following error:",
  "TLC has found a state in which the value of a variable contains Nat",
];

const NAT_EXCEPTION = ": TLC has found a state in which the value of a variable contains Nat";

describe("a simulated behavior through a state that TLC can't fingerprint", () => {
  it.each([
    ["Inv.cfg", "Error: Invariant Inv is violated.", 12],
    ["Dead.cfg", "Error: Deadlock reached.", 11],
  ])(
    "prints each state after %s, where TLC's StatePrinter fingerprints the state that holds Nat and crashes",
    (config, error, status) => {
      const run = runSpec("StateNat", ["-noGenerateSpecTE", ...SIMULATE, "-config", config]);
      expect([run.status, run.lines]).toEqual([status, [error, ...BEHAVIOR, PROGRESS]]);
    },
  );

  it("prints the whole behavior before the trace file fails on the state that holds Nat with TLC's message", () => {
    const run = runSpec("StateNat", [...SIMULATE, "-config", "Inv.cfg"]);
    expect([run.status, run.lines, run.traceFiles]).toEqual([
      12,
      ["Error: Invariant Inv is violated.", ...BEHAVIOR, ...SERIALIZE_ERROR, PROGRESS],
      [],
    ]);
  });

  it("prints each state under -difftrace, where TLC's Simulator#printBehavior fingerprints the state that holds Nat and crashes", () => {
    const run = runSpec("StateNat", [
      "-noGenerateSpecTE",
      "-difftrace",
      ...SIMULATE,
      "-config",
      "Inv.cfg",
    ]);
    expect([run.status, run.lines]).toEqual([
      12,
      [
        "Error: Invariant Inv is violated.",
        ...BEHAVIOR.slice(0, 7),
        ...BEHAVIOR.slice(8),
        PROGRESS,
      ],
    ]);
  });

  it.each([
    ["ViewX.cfg", "a VIEW without Nat, as TLC does"],
    ["ViewXY.cfg", "a VIEW of Nat, where TLC fingerprints the VIEW and crashes"],
  ])(
    "drops the steps under -difftrace whose VIEW repeats past a state that holds Nat, with %s, %s",
    (config) => {
      const run = runSpec("ToggleNat", [
        "-noGenerateSpecTE",
        "-difftrace",
        "-simulate",
        "num=1",
        "-depth",
        "12",
        "-seed",
        "4",
        "-config",
        config,
      ]);
      const step = "line 5, col 10 to line 5, col 78 of module ToggleNat";
      expect([run.status, run.lines]).toEqual([
        12,
        [
          "Error: Invariant Inv is violated.",
          "Error: The behavior up to this point is:",
          "State 1: <Init line 4, col 9 to line 4, col 31 of module ToggleNat>",
          "/\\ x = 0",
          "/\\ y = 0",
          "/\\ z = 0",
          "",
          `State 2: <Next ${step}>`,
          "/\\ x = 1",
          "",
          `State 3: <Next ${step}>`,
          "/\\ x = 2",
          "/\\ y = Nat",
          "",
          `State 6: <Next ${step}>`,
          "/\\ x = 3",
          "/\\ y = 0",
          "",
          "difftrace requested: Shortened behavior by omitting finite stuttering (2 states), which is an artifact of simulation mode.",
          "",
          "The number of states generated: 8",
          "Simulation using seed 4 and aril 0",
          "Progress: 8 states checked, 1 traces generated (trace length: mean=0, var(x)=0, sd=0)",
        ],
      ]);
    },
  );
});

it("fails -dfid on a state that holds Nat with TLC's message", () => {
  const run = runSpec("StateNat", ["-noGenerateSpecTE", "-dfid", "6", "-config", "Inv.cfg"]);
  expect([run.status, run.lines]).toEqual([
    255,
    [
      "Starting level 2: 1 states generated, 1 distinct states found.",
      "Starting level 3: 2 states generated, 2 distinct states found.",
      "Error: TLC threw an unexpected exception.",
      "This was probably caused by an error in the spec or model.",
      "The error occurred when TLC was computing the set of next states.",
      "The exception was a java.lang.RuntimeException",
      NAT_EXCEPTION,
      "Error: The behavior up to this point is:",
      "State 1:",
      "/\\ x = 0",
      "/\\ y = 0",
      "",
      "State 2:",
      "/\\ x = 1",
      "/\\ y = 0",
      "",
      "State 3:",
      "/\\ x = 2",
      "/\\ y = Nat",
      "",
      "Error: The error occurred when TLC was evaluating the nested",
      "expressions at the following positions:",
      "    The error call stack is empty.",
      "",
      "5 states generated, 2 distinct states found.",
    ],
  ]);
});

it("fails to write the trace file of an action that binds Nat with TLC's message, and writes no file where TLC leaves 20 bytes", () => {
  const run = runSpec("ContextNat", [...SIMULATE, "-config", "Inv.cfg"]);
  const step = "<Step(Nat) line 4, col 12 to line 4, col 30 of module ContextNat>";
  expect([run.status, run.lines, run.traceFiles]).toEqual([
    12,
    [
      "Error: Invariant Inv is violated.",
      "Error: The behavior up to this point is:",
      "State 1: <Init line 5, col 9 to line 5, col 13 of module ContextNat>",
      "x = 0",
      "",
      `State 2: ${step}`,
      "x = 1",
      "",
      `State 3: ${step}`,
      "x = 2",
      "",
      `State 4: ${step}`,
      "x = 3",
      "",
      "The number of states generated: 4",
      "Simulation using seed 1 and aril 0",
      ...SERIALIZE_ERROR,
      PROGRESS,
    ],
    [],
  ]);
});
