import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, type CheckOptions } from "../../src";

const FIXTURES = join(import.meta.dirname, "../fixtures");

// TLC 1.8.0 -dump output for each model, and TLC 1.7.4's for the files whose names end in 174,
// recorded with -fp 0 so that its fingerprints match, or -fp 130 for Counter130, and with -seed 4
// for RandomElementXandY.
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
    writeFile: (path, content) => written.set(path, String(content)),
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

  it("fingerprints the states with the polynomial that -fp picks", async () => {
    const dump = await dumpFixture(
      "counter",
      "Counter",
      { path: "Counter130.dot", dot: true, actionLabels: true },
      { fingerprintPolynomial: 130 },
    );
    expect(dump.written.get("Counter130.dot")).toBe(readTlcDump("Counter130.dot"));
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

  it("writes the stuttering steps and the successors the constraints exclude", async () => {
    const dump = await dumpFixture("state-graph", "Excluded", {
      path: "Excluded.dot",
      dot: true,
      colorize: true,
      actionLabels: true,
      constrained: true,
      stuttering: true,
    });
    expect(dump.written.get("Excluded.dot")).toBe(readTlcDump("Excluded.dot"));
  });

  it("writes an edge once with strict", async () => {
    const dump = await dumpFixture("state-graph", "Doubled", {
      path: "Doubled.dot",
      dot: true,
      strict: true,
    });
    expect(dump.written.get("Doubled.dot")).toBe(readTlcDump("Doubled.dot"));
  });

  // TLC keys an edge by the XOR of its fingerprints, so it writes one self loop in the graph.
  it("keeps every self loop with strict, unlike TLC", async () => {
    const options = { path: "Excluded.dot", dot: true };
    const strict = await dumpFixture("state-graph", "Excluded", { ...options, strict: true });
    const plain = await dumpFixture("state-graph", "Excluded", options);
    expect(strict.written.get("Excluded.dot")).toBe(plain.written.get("Excluded.dot"));
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

  it("takes the options of a dot format", () => {
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-dump-"));
    runCli(["-dump", "dot,actionlabels,strict,stuttering,constrained", join(directory, "Counter")]);
    expect(readFileSync(join(directory, "Counter.dot"), "utf8")).toBe(readTlcDump("Counter.dot"));
  });
});
