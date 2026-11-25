import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
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
  rmSync(directory, { recursive: true });
  const lines = result.stdout.split("\n");
  return {
    status: result.status,
    lines: lines.slice(
      lines.findIndex((line) => line.startsWith("Finished computing initial")) + 1,
      lines.findIndex((line) => line.startsWith("Finished in")),
    ),
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
});
