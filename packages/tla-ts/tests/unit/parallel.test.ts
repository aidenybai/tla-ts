import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scheduler } from "node:timers/promises";
import { MessageChannel, receiveMessageOnPort } from "node:worker_threads";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { check } from "../../src";
import { getJavaClassName } from "../../src/builtins";
import { PROGRESS_INTERVAL, type SearchStatistics } from "../../src/check";
import {
  createSharedFingerprintsFromBuffers,
  getSharedFingerprintBuffers,
  insertSharedFingerprint,
} from "../../src/fingerprints";
import { createStateDecoder, createStateEncoder } from "../../src/transfer";
import { formatValue } from "../../src/values";

const FIXTURES = join(import.meta.dirname, "../fixtures");
const DIST = join(import.meta.dirname, "../../dist/index.js");

const tlaTs: typeof import("../../src") = await import(DIST);

const INTERPRETED_SET_SIZE = 1_000_000;

const checkFixtureInParallel = (directory: string, name: string, workers: number) =>
  tlaTs.check({
    source: readFileSync(join(FIXTURES, directory, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, directory, `${name}.cfg`), "utf8"),
    workers,
    maxSetSize: INTERPRETED_SET_SIZE,
  });

const getCounts = (result: { generatedStates: number; distinctStates: number; depth: number }) => [
  result.generatedStates,
  result.distinctStates,
  result.depth,
];

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("check with workers matches TLC", () => {
  it.each([2, 3, 4])("explores the commit protocol with %i workers", async (workers) => {
    const result = await checkFixtureInParallel("commit", "Commit", workers);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([890, 251, 11]);
  });

  it("reports an invariant that fails to evaluate on an initial state like one worker", async () => {
    const result = await tlaTs.check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x \\in 0..1\nNext == UNCHANGED x\nInv == 1 \\div x = 0\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      workers: 2,
    });
    expect(result.failure?.message).toBe("The second argument of \\div is 0.");
    expect(result.failure?.exitCode).toBe(75);
  });

  it("summarizes the outdegrees and the fingerprints of every worker like one worker", async () => {
    const directory = join(import.meta.dirname, "../../benchmarks/queue");
    const options = {
      source: readFileSync(join(directory, "Queue.tla"), "utf8"),
      config: readFileSync(join(directory, "Queue.cfg"), "utf8"),
    };
    const [sequential, parallel] = await Promise.all([
      tlaTs.check(options),
      tlaTs.check({ ...options, workers: 3, maxSetSize: INTERPRETED_SET_SIZE }),
    ]);
    expect(parallel.fingerprintDistance).toBe(sequential.fingerprintDistance);
    expect(parallel.fingerprintDistance).toBeDefined();
    const getTotals = (outDegrees: number[] | undefined = []) => [
      outDegrees.reduce((sum, count) => sum + count, 0),
      outDegrees.reduce((sum, count, degree) => sum + count * degree, 0),
    ];
    expect(getTotals(parallel.outDegrees)).toEqual(getTotals(sequential.outDegrees));
  });

  it("reports an invariant that a successor outside the action constraint violates", async () => {
    const result = await tlaTs.check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in 0..1\nNext == x < 5 /\\ x' = x + 1\nInv == x # 3\nSkip == x' # 3\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nACTION_CONSTRAINT Skip\nCHECK_DEADLOCK FALSE",
      workers: 2,
    });
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Inv");
    expect(result.violation?.trace).toHaveLength(3);
  });

  it("prints what assumptions print once when it checks on the calling thread", async () => {
    const printed: string[] = [];
    const result = await tlaTs.check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nASSUME PrintT("start")\nInit == x = 0\nNext == x\' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == <>(x = 2)\n====',
      config: "SPECIFICATION Spec\nPROPERTY Live",
      workers: 2,
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual(['"start"']);
  });

  it("ranks the strings that constant definitions create before those TLC interns as it creates the checker", async () => {
    const printed: string[] = [];
    await tlaTs.check({
      source:
        '---- MODULE R1 ----\nEXTENDS TLC, Sequences, Naturals\nVARIABLE x\nS == {"st" \\o "ate", "ac" \\o "tion"}\nT == {"lo" \\o "cation", "na" \\o "me"}\nASSUME PrintT(<<S, T>>)\nASSUME PrintT({"tag" \\o "s", "ta" \\o "g", "dur" \\o "ation"})\nInit == x \\in 0..3\nNext == x\' = (x + 1) % 4\n====',
      config: "INIT Init\nNEXT Next",
      workers: 2,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual([
      '<<{"state", "action"}, {"location", "name"}>>',
      '{"tag", "duration", "tags"}',
    ]);
  });

  it("ranks the strings that splitting the next-state relation creates before those TLC interns as it creates the checker", async () => {
    const printed: string[] = [];
    await tlaTs.check({
      source:
        '---- MODULE Q1 ----\nEXTENDS TLC, Naturals, Sequences\nVARIABLE x\nInit == x = 0\nNext == \\E s \\in {"zz" \\o "z"} : x\' = (x + 1) % 2\nASSUME PrintT({"zz" \\o "z", "dur" \\o "ation"})\n====',
      config: "INIT Init\nNEXT Next",
      workers: 2,
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(['{"zzz", "duration"}']);
  });

  it("reports the string the search orders as it checks again on the calling thread", async () => {
    const ordered: string[] = [];
    const result = await tlaTs.check({
      source: readFileSync(join(FIXTURES, "strings", "RuntimeStrings.tla"), "utf8"),
      config: readFileSync(join(FIXTURES, "strings", "RuntimeStrings.cfg"), "utf8"),
      workers: 2,
      onProgress: (progress) => {
        if (progress.kind === "sequential-fallback") ordered.push(progress.string);
      },
    });
    expect(getCounts(result)).toEqual([115, 97, 6]);
    expect(ordered).toHaveLength(1);
  });

  it("keeps its workers when the search creates strings it never orders", async () => {
    const progressKinds = new Set<string>();
    const result = await tlaTs.check({
      source: readFileSync(join(FIXTURES, "strings", "RuntimeTags.tla"), "utf8"),
      config: readFileSync(join(FIXTURES, "strings", "RuntimeTags.cfg"), "utf8"),
      workers: 2,
      onProgress: (progress) => progressKinds.add(progress.kind),
    });
    expect(getCounts(result)).toEqual([841, 441, 41]);
    expect(progressKinds.has("sequential-fallback")).toBe(false);
  });

  it("prints values as the version of TLC it matches does", async () => {
    const printed: string[] = [];
    await tlaTs.check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nASSUME PrintT([k \\in 1..0 |-> k])\nInit == x = 0\nNext == x' = (x + 1) % 3\n====",
      config: "INIT Init\nNEXT Next",
      workers: 2,
      version: "1.7.4",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toEqual(["<< >>"]);
  });

  it("grows the fingerprint table that workers share while they expand a level", async () => {
    const result = await tlaTs.check({
      source:
        "---- MODULE Grid ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == \\/ x < 99 /\\ x' = x + 1 /\\ y' = y\n        \\/ y < 99 /\\ y' = y + 1 /\\ x' = x\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      workers: 4,
      maxSetSize: INTERPRETED_SET_SIZE,
    });
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([19801, 10000, 199]);
  });

  it("explores a level long enough for workers to take breaks like one worker", async () => {
    const options = {
      source:
        "---- MODULE Slow ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in 1..4000\nNext == x <= 4000 /\\ (\\A i \\in 1..2000 : i > 0) /\\ x' = x + 4000\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    };
    const sequential = await tlaTs.check(options);
    const parallel = await tlaTs.check({
      ...options,
      workers: 3,
      maxSetSize: INTERPRETED_SET_SIZE,
    });
    expect(parallel.status).toBe("success");
    expect(getCounts(parallel)).toEqual(getCounts(sequential));
  });

  it("reports its progress every minute while workers expand a level", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const reported: SearchStatistics[] = [];
    let isDone = false;
    const checked = tlaTs
      .check({
        source:
          "---- MODULE Slow ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in 1..500\nNext == x <= 500 /\\ (\\A i \\in 1..10000 : i > 0) /\\ x' = x + 500\n====",
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        workers: 2,
        maxSetSize: INTERPRETED_SET_SIZE,
        onProgress: (progress) => {
          if (progress.kind === "progress") reported.push(progress.statistics);
        },
      })
      .finally(() => {
        isDone = true;
      });
    while (!isDone) {
      vi.advanceTimersByTime(PROGRESS_INTERVAL);
      await scheduler.wait(1);
    }
    const result = await checked;
    expect(getCounts(result)).toEqual([1000, 1000, 2]);
    expect(
      reported.some(
        (statistics) => statistics.distinctStates > 500 && statistics.distinctStates < 1000,
      ),
    ).toBe(true);
    reported.forEach((statistics, index) => {
      const previous = reported[index - 1] ?? statistics;
      expect(statistics.distinctStates).toBeGreaterThanOrEqual(previous.distinctStates);
      expect(statistics.generatedStates).toBeGreaterThanOrEqual(previous.generatedStates);
      expect(statistics.depth).toBeGreaterThanOrEqual(previous.depth);
      expect([
        statistics.distinctStates >= 500 && statistics.distinctStates <= 1000,
        statistics.generatedStates >= 500 && statistics.generatedStates <= 1000,
        statistics.queuedStates >= 0 && statistics.queuedStates <= 500 - 2,
        statistics.depth >= 1 && statistics.depth <= 2,
      ]).toEqual([true, true, true, true]);
    });
  });

  it.each([
    [
      "a spec the typed tier doesn't take",
      readFileSync(join(FIXTURES, "tier-workers", "Interpreted.tla"), "utf8"),
      readFileSync(join(FIXTURES, "tier-workers", "Interpreted.cfg"), "utf8"),
      [177, 143, 10],
    ],
    [
      "a property of an instance",
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 1\nNext == x < 512 /\\ x' \\in {2 * x, 2 * x + 1}\nI == INSTANCE Inner WITH y <- 2 * x\nProp == I!Grows\n====",
      "INIT Init\nNEXT Next\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
      [1023, 1023, 10],
    ],
  ])(
    "checks %s with workers while it records the trace for the trace spec, as the CLI does by default",
    async (_name, source, config, counts) => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      let progressCount = 0;
      let isDone = false;
      const checked = tlaTs
        .check({
          source,
          config,
          loadModule: (name) =>
            name === "Inner"
              ? "---- MODULE Inner ----\nEXTENDS Naturals\nVARIABLE y\nGrows == [][y' > y]_y\n===="
              : undefined,
          workers: 2,
          traceSpec: { module: "M_TTrace", traceFile: "M_TTrace.bin" },
          onProgress: (progress) => {
            if (progress.kind === "progress") progressCount++;
          },
        })
        .finally(() => {
          isDone = true;
        });
      while (!isDone) {
        vi.advanceTimersByTime(PROGRESS_INTERVAL);
        await new Promise((resolve) => setImmediate(resolve));
      }
      expect([getCounts(await checked), progressCount > 0]).toEqual([counts, true]);
    },
  );

  it("prints what the next-state relation prints in TLC's order", async () => {
    const printed: string[] = [];
    const result = await tlaTs.check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nUnused(v) == PrintT(<<"unused", v>>)\nInit == x \\in 1..4\nNext == x < 20 /\\ PrintT(x) /\\ x\' = x + 4\n====',
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      workers: 2,
      onPrint: (text) => printed.push(text),
    });
    expect([getCounts(result), printed]).toEqual([
      [23, 23, 6],
      Array.from({ length: 19 }, (_value, index) => String(index + 1)),
    ]);
  });

  it("explores a queue that only grows to its bound", async () => {
    const result = await checkFixtureInParallel("queue", "Queue", 3);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([181, 105, 9]);
  });

  it("reduces states under a symmetry set", async () => {
    const result = await checkFixtureInParallel("symmetry", "Symmetry", 2);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([42, 10, 7]);
  });

  it("reports the shortest invariant violation trace like one worker", async () => {
    const result = await checkFixtureInParallel("water-jugs", "WaterJugs", 4);
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("GoalNotReached");
    expect(result.violation?.trace).toHaveLength(7);
    expect(getCounts(result)).toEqual([73, 14, 7]);
  });

  it("reports deadlock with its trace like one worker", async () => {
    const result = await checkFixtureInParallel("counter", "Counter", 2);
    expect(result.status).toBe("deadlock");
    expect(result.violation?.trace.map((step) => step.action)).toEqual([
      undefined,
      "Increment",
      "Increment",
      "Increment",
    ]);
    expect(getCounts(result)).toEqual([4, 4, 4]);
  });

  it.each([2, 3])("orders sets of strings like TLC with %i workers", async (workers) => {
    const result = await checkFixtureInParallel("strings", "StringSets", workers);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([76, 31, 5]);
  });

  it("checks specs that create strings while checking like one worker", async () => {
    const result = await checkFixtureInParallel("strings", "RuntimeStrings", 2);
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([115, 97, 6]);
  });

  it("explores states that hold functions over SUBSET", async () => {
    const result = await tlaTs.check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = [s \\in SUBSET (1..2) |-> 0]\nNext == \\E q \\in 1..2 :\n          /\\ x' = (x + q) % 5\n          /\\ y' = [s \\in SUBSET (1..2) |-> IF q \\in s THEN (y[s] + 1) % 3 ELSE y[s]]\n====",
      config: "INIT Init\nNEXT Next",
      workers: 2,
      maxSetSize: INTERPRETED_SET_SIZE,
    });
    expect(result.status).toBe("success");
    expect(getCounts(result)).toEqual([91, 45, 11]);
  });

  it.each([
    [true, [2, 2, 2]],
    [false, [3, 3, 3]],
  ])(
    "converts a function over SUBSET that a state holds to a string as TLC does with isLazyValueExpanded %s",
    async (isLazyValueExpanded, counts) => {
      const result = await tlaTs.check({
        source:
          '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES y, s\nInit == y = [p \\in SUBSET (1..2) |-> 0] /\\ s = ""\nNext == \\/ s = "" /\\ s\' = ToString(y) /\\ UNCHANGED y\n        \\/ s = "[p \\\\in SUBSET (1..2) |-> <expression 0>]" /\\ s\' = "done" /\\ UNCHANGED y\n====',
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        workers: 2,
        isLazyValueExpanded,
      });
      expect(getCounts(result)).toEqual(counts);
    },
  );

  const randomHead =
    "---- MODULE M ----\nEXTENDS Naturals, FiniteSets, Randomization\nVARIABLE x, n\n";
  const drawsInNext = {
    name: "the next-state relation",
    source: `${randomHead}Init == x = 0 /\\ n = 0\nNext == n < 8 /\\ n' = n + 1 /\\ x' \\in RandomSubset(2, 0..5)\n====`,
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
  };
  const drawsInInit = {
    name: "the initial predicate and a constraint",
    source: `${randomHead}Init == x \\in 0..3 /\\ n \\in RandomSubset(2, 0..12)\nNext == n < 14 /\\ n' = n + 1 /\\ x' = x\nC == n > 10 \\/ x \\in RandomSubset(3, 0..3)\n====`,
    config: "INIT Init\nNEXT Next\nCONSTRAINT C\nCHECK_DEADLOCK FALSE",
  };
  const drawsInChecks = {
    name: "the next-state relation and a constraint",
    source: `${randomHead}Init == x = 0 /\\ n = 0\nNext == n < 6 /\\ n' = n + 1 /\\ x' \\in RandomSubset(3, 0..5)\nC == n = 0 \\/ x \\in RandomSubset(4, 0..5)\n====`,
    config: "INIT Init\nNEXT Next\nCONSTRAINT C\nCHECK_DEADLOCK FALSE",
  };
  const drawsInConstant = {
    name: "a constant definition",
    source: `${randomHead}S == RandomSubset(2, 1..6)\nInit == x = 0 /\\ n = 0\nNext == x < 12 /\\ x' \\in {x + k : k \\in S} /\\ n' = n\n====`,
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
  };
  it.each(
    [
      { ...drawsInNext, seed: 4n, counts: [59, 35, 9] },
      { ...drawsInNext, seed: 7n, counts: [57, 33, 9] },
      { ...drawsInInit, seed: 4n, counts: [42, 38, 13] },
      { ...drawsInInit, seed: 7n, counts: [31, 25, 14] },
      { ...drawsInChecks, seed: 4n, counts: [67, 28, 7] },
      { ...drawsInChecks, seed: 7n, counts: [67, 27, 7] },
      { ...drawsInConstant, seed: 4n, counts: [11, 8, 4] },
      { ...drawsInConstant, seed: 7n, counts: [13, 8, 5] },
    ].flatMap((row) => [1, 2, 4].map((workers) => ({ ...row, workers }))),
  )(
    "draws random values in $name with seed $seed and $workers workers as TLC does",
    async (row) => {
      const result = await tlaTs.check({
        source: row.source,
        config: row.config,
        seed: row.seed,
        workers: row.workers,
      });
      expect(getCounts(result)).toEqual(row.counts);
    },
  );

  const exceptWarning =
    "The EXCEPT was applied to non-existing fields of the value at\nline 4, col 10 to line 4, col 10 of module M";
  it.each([1, 2, 4])(
    "reports the warnings a constant and the search raise like one worker with %i workers",
    async (workers) => {
      const reported: string[] = [];
      const result = await tlaTs.check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x, r\nF(s) == [s EXCEPT !.b = 1]\nC == F([a |-> 0])\nInit == x = 0 /\\ r = C\nNext == x < 20 /\\ x' = x + 1 /\\ r' = IF x % 5 = 0 THEN F(r) ELSE r\n====",
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        workers,
        onProgress: (progress) =>
          reported.push(progress.kind === "warning" ? progress.text : progress.kind),
      });
      expect(getCounts(result)).toEqual([21, 21, 21]);
      expect(reported).toEqual([
        "parsed",
        exceptWarning,
        "initial-states-started",
        "initial-states-computed",
        ...Array.from({ length: 4 }, () => exceptWarning),
      ]);
    },
  );

  it.each([1, 2, 4])(
    "fails on a warning the search raises that -messagesAsErrors names like TLC with %i workers",
    async (workers) => {
      const options = {
        source:
          "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x, r\nInit == x = 0 /\\ r = [a |-> 0]\nNext == x < 20 /\\ x' = x + 1 /\\ r' = IF x = 10 THEN [r EXCEPT !.b = 1] ELSE r\n====",
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        workers,
        errorCodes: [2144],
      };
      const result = await tlaTs.check(options);
      expect([
        result.failure?.exitCode,
        result.failure?.message,
        result.failure?.trace?.length,
      ]).toEqual([
        75,
        "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: The EXCEPT was applied to non-existing fields of the value at\nline 5, col 54 to line 5, col 54 of module M",
        11,
      ]);
    },
  );

  it.each([1, 4])(
    "checks from Init with %i workers after the typed tier gives up partway, reporting the initial states once",
    async (workers) => {
      const kinds: string[] = [];
      const result = await tlaTs.check({
        source: readFileSync(join(FIXTURES, "tier-workers", "Fallback.tla"), "utf8"),
        config: readFileSync(join(FIXTURES, "tier-workers", "Fallback.cfg"), "utf8"),
        workers,
        onProgress: (progress) => kinds.push(progress.kind),
      });
      expect([getCounts(result), kinds]).toEqual([
        [310, 310, 31],
        [
          "parsed",
          "initial-states-started",
          "initial-states-progress",
          "initial-states-progress",
          "initial-states-progress",
          "initial-states-computed",
        ],
      ]);
    },
  );

  it("checks again without the typed tier when workers stop after it gives up partway, reading the clock as one worker does", async () => {
    const getClockReads = async (workers: number) => {
      let now = 0;
      vi.spyOn(performance, "now").mockImplementation(() => (now += 1000));
      const result = await tlaTs.check({
        source:
          "---- MODULE Counter ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x < 1000 /\\ x' = x + 1 + 0 \\div (500 - x)\n====",
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
        workers,
        onProgress: () => {},
      });
      return [result.status, result.generatedStates, now / 1000];
    };
    expect(await getClockReads(4)).toEqual(await getClockReads(1));
  });

  it("hands a worker a converted function over SUBSET as the FcnLambdaValue it is", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE y\nInit == y = [p \\in SUBSET {1, 2} |-> 0]\nNext == UNCHANGED y\nInv == y[{}] = 1\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    const encoder = createStateEncoder();
    const isEncoded = encoder.encode(result.violation?.trace.map((step) => step.state.y) ?? []);
    const decoded = createStateDecoder(1)(encoder.finish()).flat();
    expect([
      isEncoded,
      decoded.map((innerValue) => [getJavaClassName(innerValue), formatValue(innerValue)]),
    ]).toEqual([true, [["FcnLambdaValue", "({} :> 0 @@ {1} :> 0 @@ {2} :> 0 @@ {1, 2} :> 0)"]]]);
  });
});

describe("the shared fingerprint table", () => {
  it("reaches a worker whole when it holds 4 GiB", () => {
    const table = {
      slots: new BigInt64Array(new SharedArrayBuffer(2 ** 32)),
      used: new Int32Array(new SharedArrayBuffer(4)),
    };
    const channel = new MessageChannel();
    channel.port1.postMessage(getSharedFingerprintBuffers(table));
    const received = createSharedFingerprintsFromBuffers(
      receiveMessageOnPort(channel.port2)?.message,
    );
    channel.port1.close();
    expect(received.slots.length).toBe(2 ** 29);
    expect(insertSharedFingerprint(received, -1, 7)).toBe(true);
    expect(insertSharedFingerprint(table, -1, 7)).toBe(false);
    expect(table.used[0]).toBe(1);
  });
});
