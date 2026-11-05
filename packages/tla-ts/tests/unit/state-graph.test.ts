import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue, type CheckOptions, type GraphState, type GraphStep } from "../../src";

const FIXTURES = join(import.meta.dirname, "../fixtures");

// TLC 1.8.0 -dump output for each model, and TLC 1.7.4's for the files whose names end in 174,
// recorded with -fp 0 so that its fingerprints match, and with -seed 4 for RandomElementXandY.
const readTlcDump = (name: string) => readFileSync(join(FIXTURES, "state-graph", name), "utf8");

const dumpFixture = async (
  directory: string,
  name: string,
  dump: NonNullable<CheckOptions["dump"]>,
  options: Partial<CheckOptions> = {},
) => {
  const written = new Map<string, string>();
  const result = await check({
    source: readFileSync(join(FIXTURES, directory, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, directory, `${name}.cfg`), "utf8"),
    loadModule: (module) => {
      const path = join(FIXTURES, directory, `${module}.tla`);
      return existsSync(path) ? readFileSync(path, "utf8") : undefined;
    },
    onPrint: () => {},
    writeFile: (path, content) => written.set(path, content),
    dump,
    ...options,
  });
  return { result, written };
};

describe("check dumps the state graph like TLC's -dump", () => {
  it("writes a deadlocked counter like -dump dot,actionlabels", async () => {
    const dump = await dumpFixture("counter", "Counter", {
      path: "Counter.dot",
      dot: true,
      actionLabels: true,
    });
    expect(dump.result.status).toBe("deadlock");
    expect(dump.written.get("Counter.dot")).toBe(readTlcDump("Counter.dot"));
  });

  it("colors every edge, self loops included, up to an invariant violation", async () => {
    const dump = await dumpFixture("water-jugs", "WaterJugs", {
      path: "WaterJugs.dot",
      dot: true,
      colorize: true,
      actionLabels: true,
    });
    expect(dump.result.status).toBe("invariant-violation");
    expect(dump.written.get("WaterJugs.dot")).toBe(readTlcDump("WaterJugs.dot"));
  });

  it("labels an edge with the values of the action's parameters", async () => {
    const dump = await dumpFixture("mutex", "Mutex", {
      path: "Mutex.dot",
      dot: true,
      colorize: true,
      actionLabels: true,
    });
    expect(dump.result.status).toBe("success");
    expect(dump.written.get("Mutex.dot")).toBe(readTlcDump("Mutex.dot"));
  });

  it("labels a state by its alias and escapes quotes and backslashes", async () => {
    const dump = await dumpFixture("state-graph", "Labels", {
      path: "Labels.dot",
      dot: true,
      colorize: true,
      actionLabels: true,
    });
    expect(dump.written.get("Labels.dot")).toBe(readTlcDump("Labels.dot"));
  });

  it("lists the reachable states without dot", async () => {
    const dump = await dumpFixture("counter", "Counter", { path: "Counter.dump" });
    expect(dump.written.get("Counter.dump")).toBe(readTlcDump("Counter.dump"));
  });

  it("writes the stuttering steps of a liveness check like TLC 1.7.4, and plain edge labels", async () => {
    const options = { version: "1.7.4" } as const;
    const dot = await dumpFixture(
      "state-graph",
      "Picks",
      { path: "Picks174.dot", dot: true, actionLabels: true },
      options,
    );
    expect(dot.written.get("Picks174.dot")).toBe(readTlcDump("Picks174.dot"));
    const plain = await dumpFixture("state-graph", "Picks", { path: "Picks174.dump" }, options);
    expect(plain.written.get("Picks174.dump")).toBe(readTlcDump("Picks174.dump"));
  });

  it("writes the graph of a single TLC worker when several are asked for", async () => {
    const dump = await dumpFixture(
      "mutex",
      "Mutex",
      { path: "Mutex.dot", dot: true, colorize: true, actionLabels: true },
      { workers: 2 },
    );
    expect(dump.written.get("Mutex.dot")).toBe(readTlcDump("Mutex.dot"));
  });

  it("names edges without changing the states RandomElement chooses", async () => {
    const dump = await dumpFixture(
      "randomization",
      "RandomElementXandY",
      { path: "RandomElementXandY.dot", dot: true, colorize: true, actionLabels: true },
      { seed: 4n },
    );
    expect(dump.written.get("RandomElementXandY.dot")).toBe(readTlcDump("RandomElementXandY.dot"));
  });

  it("writes the successors again when TLC replays the state an invariant fails to evaluate in", async () => {
    const dump = await dumpFixture("state-graph", "FailedInvariant", {
      path: "FailedInvariant.dot",
      dot: true,
      actionLabels: true,
    });
    expect(dump.result.status).toBe("error");
    expect(dump.written.get("FailedInvariant.dot")).toBe(readTlcDump("FailedInvariant.dot"));
  });

  it("leaves a snapshot that matches the finished graph", async () => {
    const dump = await dumpFixture("water-jugs", "WaterJugs", {
      path: "WaterJugs.dot",
      dot: true,
      colorize: true,
      actionLabels: true,
      snapshot: true,
    });
    expect(dump.written.get("WaterJugs_snapshot.dot")).toBe(readTlcDump("WaterJugs.dot"));
  });
});

const readGraph = async (
  directory: string,
  name: string,
  dump: NonNullable<CheckOptions["dump"]>,
  options: Partial<CheckOptions> = {},
) => {
  const states: GraphState[] = [];
  const steps: GraphStep[] = [];
  const dumped = await dumpFixture(directory, name, dump, {
    onState: (state) => states.push(state),
    onStep: (step) => steps.push(step),
    ...options,
  });
  return { ...dumped, states, steps };
};

describe("check reports the state graph -dump writes", () => {
  it("reports each state with the step that first reached it", async () => {
    const graph = await readGraph("counter", "Counter", {
      path: "Counter.dot",
      dot: true,
      actionLabels: true,
    });
    expect(graph.result.status).toBe("deadlock");
    expect(graph.states).toEqual([
      { state: { count: 0 }, parent: undefined, action: undefined },
      { state: { count: 1 }, parent: 0, action: "Increment" },
      { state: { count: 2 }, parent: 1, action: "Increment" },
      { state: { count: 3 }, parent: 2, action: "Increment" },
    ]);
    expect(graph.steps).toEqual([
      { from: 0, to: 1, action: "Increment" },
      { from: 1, to: 2, action: "Increment" },
      { from: 2, to: 3, action: "Increment" },
    ]);
    expect(graph.written.get("Counter.dot")).toBe(readTlcDump("Counter.dot"));
  });

  it("reports the alias of each state and every step, back edges included", async () => {
    const graph = await readGraph("state-graph", "Labels", {
      path: "Labels.dot",
      dot: true,
      colorize: true,
      actionLabels: true,
    });
    expect(graph.written.get("Labels.dot")).toBe(readTlcDump("Labels.dot"));
    expect(graph.states).toHaveLength(21);
    expect(graph.steps).toHaveLength(50);
    expect(
      graph.states.slice(0, 3).map((state) => ({ ...state, state: formatValue(state.state.seq) })),
    ).toEqual([
      { state: "<<>>", parent: undefined, action: undefined },
      { state: "<<>>", parent: 0, action: "Next" },
      { state: '<<"a\\"b">>', parent: 0, action: "Push" },
    ]);
    expect(graph.states.slice(0, 3).map((state) => [state.state.vee, state.state.len])).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
    expect(graph.steps.filter((step) => step.to === 0).map((step) => step.from)).toEqual([
      2, 3, 7, 8, 9, 10,
    ]);
  });

  it("reports the graph of a single worker without a dump", async () => {
    const states: GraphState[] = [];
    const steps: GraphStep[] = [];
    await check({
      source: readFileSync(join(FIXTURES, "state-graph", "Labels.tla"), "utf8"),
      config: readFileSync(join(FIXTURES, "state-graph", "Labels.cfg"), "utf8"),
      loadModule: (module) => readFileSync(join(FIXTURES, "state-graph", `${module}.tla`), "utf8"),
      onPrint: () => {},
      onState: (state) => states.push(state),
      onStep: (step) => steps.push(step),
      workers: 2,
    });
    const dumped = await readGraph("state-graph", "Labels", {
      path: "Labels.dot",
      dot: true,
      actionLabels: true,
    });
    expect(states).toEqual(dumped.states);
    expect(steps).toEqual(dumped.steps);
  });

  it("reports the stuttering steps of TLC 1.7.4 without an action", async () => {
    const graph = await readGraph(
      "state-graph",
      "Picks",
      { path: "Picks174.dot", dot: true, actionLabels: true },
      { version: "1.7.4" },
    );
    expect(graph.written.get("Picks174.dot")).toBe(readTlcDump("Picks174.dot"));
    expect(graph.states.map((state) => state.parent)).toEqual([undefined, 0]);
    expect(graph.steps).toEqual([
      { from: 0, to: 1, action: "Pick" },
      { from: 0, to: 1, action: "Pick" },
      { from: 0, to: 0, action: undefined },
      { from: 1, to: 1, action: undefined },
    ]);
  });

  it("reports the steps TLC writes again as it replays a state an invariant fails in", async () => {
    const graph = await readGraph("state-graph", "FailedInvariant", {
      path: "FailedInvariant.dot",
      dot: true,
      actionLabels: true,
    });
    expect(graph.result.status).toBe("error");
    expect(graph.written.get("FailedInvariant.dot")).toBe(readTlcDump("FailedInvariant.dot"));
    expect(graph.states).toEqual([
      { state: { x: 0 }, parent: undefined, action: undefined },
      { state: { x: 1 }, parent: 0, action: "A" },
      { state: { x: 2 }, parent: 0, action: "B" },
      { state: { x: 3 }, parent: 1, action: "B" },
    ]);
    expect(graph.steps.slice(-2)).toEqual([
      { from: 1, to: 2, action: "A" },
      { from: 1, to: 3, action: "B" },
    ]);
  });
});

const runCli = (args: string[]) =>
  spawnSync("bun", [join(import.meta.dirname, "../../src/cli.ts"), "Counter.tla", ...args], {
    cwd: join(FIXTURES, "counter"),
    encoding: "utf8",
  });

describe("the CLI takes TLC's -dump flag", () => {
  it("adds the extension of the format to the file name", () => {
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-dump-"));
    runCli(["-dump", "dot,actionlabels", join(directory, "Counter")]);
    runCli(["-dump", join(directory, "Counter")]);
    expect(readFileSync(join(directory, "Counter.dot"), "utf8")).toBe(readTlcDump("Counter.dot"));
    expect(readFileSync(join(directory, "Counter.dump"), "utf8")).toBe(readTlcDump("Counter.dump"));
  });

  it("asks for a file name", () => {
    const result = runCli(["-dump"]);
    expect(result.status).toBe(1);
    expect(result.stdout.split("\n").slice(1)).toEqual([
      "Error: Error: A file name for dumping states required.",
      "Usage: java tlc2.TLC [-help] [-option] inputfile",
      "",
    ]);
  });

  it("rejects a format it cannot write like TLC", () => {
    const result = runCli(["-dump", "dot,strict", "Counter"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("Error: tla-ts does not support the -dump format strict.\n");
  });
});
