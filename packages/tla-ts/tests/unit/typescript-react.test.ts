import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { DIST_CLI } from "./cli-harness";
import { runStepsInNode } from "./node-steps";

const FIXTURES = join(import.meta.dirname, "../fixtures/typescript/react");

// What the CLI finds of a fixture's model in an environment whose NODE_ENV picks React's build: its
// verdict, and the number of states of the trace of a violation.
const checkInTlaTs = (file: string, nodeEnv: string) => {
  const run = spawnSync(process.execPath, [DIST_CLI, join(FIXTURES, file)], {
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: nodeEnv },
  });
  const output = run.stdout + run.stderr;
  return {
    verdict:
      /^(Model checking completed\. No error has been found\.|Error: Invariant \w+ is violated\.)$/m.exec(
        output,
      )?.[1],
    states: [...output.matchAll(/^State \d+:/gm)].length,
  };
};

// Real React renders a counter through its own reconciler, with a renderer of plain objects. A step
// clicks the counter, whose setState React's scheduler renders in an immediate, after a microtask,
// and whose effect it runs after the commit, so the step's tasks run before the check, as Node's
// loop runs them before a driver's next beforeExit. The program gives React its clock first.
describe.each(["production", "development"])(
  "checks real React's %s build as Node runs it",
  (nodeEnv) => {
    it("agrees with Node", () => {
      expect(
        runStepsInNode(join(FIXTURES, "counter.mjs"), ["click", "click", "click"], {
          NODE_ENV: nodeEnv,
        }),
      ).toEqual(Array.from({ length: 4 }, () => ({ showsPresses: true })));
      expect(checkInTlaTs("counter.mjs", nodeEnv)).toEqual({
        verdict: "Model checking completed. No error has been found.",
        states: 0,
      });
    }, 300_000);

    // An effect that lists no dependencies records the count of the first render only, which the
    // check after the first click finds, in Node and in tla-ts.
    it("rejects a counter whose effect is stale", () => {
      expect(
        runStepsInNode(join(FIXTURES, "stale-effect.mjs"), ["click"], { NODE_ENV: nodeEnv }),
      ).toEqual([{ showsPresses: true }, { showsPresses: false }]);
      expect(checkInTlaTs("stale-effect.mjs", nodeEnv)).toEqual({
        verdict: "Error: Invariant showsPresses is violated.",
        states: 2,
      });
    }, 300_000);
  },
);
