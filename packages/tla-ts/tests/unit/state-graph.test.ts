import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { check, type CheckOptions } from "../../src";
import { checkFixture, FIXTURES, getModuleLoader } from "./check-harness";
import { runCliWith } from "./cli-harness";

const readTlcDump = (name: string) => readFileSync(join(FIXTURES, "state-graph", name), "utf8");

const dumpFixture = async (
  directory: string,
  name: string,
  dump: NonNullable<CheckOptions["dump"]>,
  options: Partial<CheckOptions> = {},
) => {
  const written = new Map<string, string>();
  const result = await checkFixture(directory, name, name, {
    loadModule: getModuleLoader(directory),
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

  it("labels a successor by what its alias changes with -difftrace", async () => {
    const dump = await dumpFixture("state-graph", "Changes", {
      path: "Changes.dot",
      dot: true,
      isDiffTrace: true,
    });
    expect(dump.written.get("Changes.dot")).toBe(readTlcDump("Changes.dot"));
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
    const plain = await dumpFixture("state-graph", "Picks", { path: "Picks.dump" }, options);
    expect(plain.written.get("Picks.dump")).toBe(readTlcDump("Picks.dump"));
  });

  it("writes each state again as the stuttering step of a liveness check without dot", async () => {
    const dump = await dumpFixture("state-graph", "Picks", { path: "Picks.dump" });
    expect(dump.written.get("Picks.dump")).toBe(readTlcDump("Picks.dump"));
  });

  it("writes the behavior graph of a liveness check with a tableau next to the state graph", async () => {
    const dump = await dumpFixture("state-graph", "LeadsTo", { path: "LeadsTo.dot", dot: true });
    expect(dump.written.get("LeadsTo_liveness.dot")).toBe(readTlcDump("LeadsTo_liveness.dot"));
  });

  it("writes the behavior graph of a liveness check without a tableau as a state graph", async () => {
    const dump = await dumpFixture("state-graph", "Cycle", { path: "Cycle.dot", dot: true });
    expect(dump.written.get("Cycle_liveness.dot")).toBe(readTlcDump("Cycle_liveness.dot"));
  });

  // Deviation from TLC: the writers of its branches overwrite one another in the file, which here leaves the last branch's graph alone.
  it("writes the behavior graph of every branch of a liveness check, unlike TLC", async () => {
    const dump = await dumpFixture("state-graph", "Branches", { path: "Branches.dot", dot: true });
    const graphs = dump.written.get("Branches_liveness.dot")?.split(/\n(?=digraph)/) ?? [];
    expect([graphs.length, graphs[2]]).toEqual([3, readTlcDump("Branches_liveness.dot")]);
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

  // Deviation from TLC: it keys an edge by the XOR of its fingerprints and writes one self loop.
  it("keeps every self loop with strict, unlike TLC", async () => {
    const options = { path: "Excluded.dot", dot: true };
    const strict = await dumpFixture("state-graph", "Excluded", { ...options, strict: true });
    const plain = await dumpFixture("state-graph", "Excluded", options);
    expect(strict.written.get("Excluded.dot")).toBe(plain.written.get("Excluded.dot"));
  });

  // Deviation from TLC: it returns without closing the writer after an initial state fails, which leaves the header alone in the file.
  it("writes the whole graph when an initial state violates an invariant, unlike TLC", async () => {
    const written = new Map<string, string>();
    const result = await check({
      source: "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = x\nInv == x # 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      dump: { path: "M.dot", dot: true },
      writeFile: (path, content) => written.set(path, String(content)),
    });
    expect([result.status, written.get("M.dot")]).toEqual([
      "invariant-violation",
      'strict digraph DiskGraph {\nnode [shape=box,style=rounded]\nnodesep=0.35;\nsubgraph cluster_graph {\ncolor="white";\n-3406341414084290173 [label="x = 0",style = filled]\n{rank = same; -3406341414084290173;}\n}\n}',
    ]);
  });

  // Deviation from TLC: it returns without closing the liveness writers after an initial state fails, which leaves their headers alone in the file.
  it("writes the initial states of the behavior graph when an initial state violates an invariant, unlike TLC", async () => {
    const written = new Map<string, string>();
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x \\in {0, 1}\nNext == x' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nInv == x # 1\nLive == (x = 1) ~> (x = 0)\n====",
      config: "SPECIFICATION Spec\nINVARIANT Inv\nPROPERTY Live",
      dump: { path: "M.dot", dot: true },
      writeFile: (path, content) => written.set(path, String(content)),
    });
    expect([result.status, written.get("M_liveness.dot")]).toEqual([
      "invariant-violation",
      'digraph DiskGraph {\nnode [shape=box,style=rounded]\nnodesep=0.35;\nsubgraph cluster_graph {\ncolor="white";\n"-3406341414084290173.1" [style = filled] [label="x = 0\n#-3406341414084290173.1#"]\n"-686636423115914061.0" [style = filled] [label="x = 1\n#-686636423115914061.0#"]\n"-686636423115914061.1" [style = filled] [label="x = 1\n#-686636423115914061.1#"]\n}\n}',
    ]);
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

const runCli = (args: string[]) => runCliWith("counter", ["Counter.tla", ...args]);

const directories: string[] = [];

afterAll(() =>
  directories.forEach((directory) => rmSync(directory, { recursive: true, force: true })),
);

const createDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), "tla-ts-dump-"));
  directories.push(directory);
  return directory;
};

describe("the CLI takes TLC's -dump flag", () => {
  it("adds the extension of the format to the file name", () => {
    const directory = createDirectory();
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

  it("leaves only the header TLC writes as it starts in the dot file of a simulation", () => {
    const directory = createDirectory();
    runCli([
      "-simulate",
      "num=1",
      "-depth",
      "3",
      "-dump",
      "dot,colorize",
      join(directory, "Counter"),
    ]);
    expect(readFileSync(join(directory, "Counter.dot"), "utf8")).toBe(
      'strict digraph DiskGraph {\nnode [shape=box,style=rounded]\nedge [colorscheme="paired12"]\nnodesep=0.35;\nsubgraph cluster_graph {\ncolor="white";\n',
    );
  });

  it("takes the options of a dot format", () => {
    const directory = createDirectory();
    runCli(["-dump", "dot,actionlabels,strict,stuttering,constrained", join(directory, "Counter")]);
    expect(readFileSync(join(directory, "Counter.dot"), "utf8")).toBe(readTlcDump("Counter.dot"));
  });

  it("labels the successors in the dot file by what changes with -difftrace", () => {
    const directory = createDirectory();
    runCliWith("state-graph", [
      "Changes.tla",
      "-difftrace",
      "-dump",
      "dot",
      join(directory, "Changes"),
    ]);
    expect(readFileSync(join(directory, "Changes.dot"), "utf8")).toBe(readTlcDump("Changes.dot"));
  });

  it("names the liveness graph after the dot file", () => {
    const directory = createDirectory();
    runCliWith("state-graph", ["LeadsTo.tla", "-dump", "dot", join(directory, "LeadsTo")]);
    expect(readFileSync(join(directory, "LeadsTo_liveness.dot"), "utf8")).toBe(
      readTlcDump("LeadsTo_liveness.dot"),
    );
  });
});
