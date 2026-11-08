// tlapm's limit is 30 s of wall-clock time, which a loaded machine stretches. So each theory runs
// until it has used 30 s of CPU time, and its result counts by both wall-clock and CPU time.

import { once } from "node:events";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { scheduler } from "node:timers/promises";
import { Worker } from "node:worker_threads";
import type { Verdict } from "../src/prover/verdict";
import { getOption } from "./corpora";
import { getIsabelleDigest, PROOF_INPUTS_DIRECTORY, readProofRecords } from "./proof-records";

type Outcome = "match" | "unsound" | "missed" | "missing" | "stale";

interface Decision {
  verdict: Exclude<Verdict, "sat">;
  wallMilliseconds: number;
  cpuMilliseconds: number;
  isInterrupted: boolean;
}

interface Job {
  name: string;
  text: string;
  expected: "unsat" | "unknown";
}

interface Result {
  name: string;
  expected: "unsat" | "unknown";
  wall: Outcome;
  cpu: Outcome;
  wallMilliseconds: number;
  cpuMilliseconds: number;
}

const TIME_LIMIT_MS = 30_000;
const POLL_MS = 100;

const jobCount = Number(getOption("--jobs") ?? 1);

// Node keeps 192 KB of a worker's stack in reserve, so this gives decideIsabelle the stack it has
// on the main thread.
const spawnWorker = async () => {
  const worker = new Worker(new URL("./isabelle-conformance-worker.js", import.meta.url), {
    resourceLimits: { stackSizeMb: 1.15 },
  });
  await once(worker, "online");
  return worker;
};

const decide = async (worker: Worker, text: string): Promise<Decision> => {
  const started = performance.now();
  const startedCpu = await worker.cpuUsage();
  const finished = new Promise<Decision>((resolve, reject) => {
    worker.once("error", reject).once("message", (decision: Omit<Decision, "isInterrupted">) => {
      worker.off("error", reject);
      resolve({ ...decision, isInterrupted: false });
    });
  });
  worker.postMessage(text);
  for (;;) {
    const decision = await Promise.race([finished, scheduler.wait(POLL_MS)]);
    if (decision !== undefined) return decision;
    const cpu = await worker.cpuUsage(startedCpu);
    const cpuMilliseconds = Math.round((cpu.user + cpu.system) / 1000);
    if (cpuMilliseconds > TIME_LIMIT_MS)
      return {
        verdict: "unknown",
        wallMilliseconds: Math.round(performance.now() - started),
        cpuMilliseconds,
        isInterrupted: true,
      };
  }
};

const classify = (job: Job, decision: Decision): Result => {
  const getOutcome = (milliseconds: number): Outcome => {
    if (decision.verdict === "unsat" && job.expected !== "unsat") return "unsound";
    const verdict =
      decision.verdict === "unsat" && milliseconds <= TIME_LIMIT_MS ? "unsat" : "unknown";
    return verdict === job.expected ? "match" : "missed";
  };
  return {
    name: job.name,
    expected: job.expected,
    wall: getOutcome(decision.wallMilliseconds),
    cpu: getOutcome(decision.cpuMilliseconds),
    wallMilliseconds: decision.wallMilliseconds,
    cpuMilliseconds: decision.cpuMilliseconds,
  };
};

const report = (result: Result) => {
  if (result.wall === "match" && result.cpu === "match") return;
  console.log(
    `wall ${result.wall.padEnd(8)} cpu ${result.cpu.padEnd(8)} ${result.name} (Isabelle: ${result.expected}, ${result.wallMilliseconds} ms wall, ${result.cpuMilliseconds} ms cpu)`,
  );
};

const results: Result[] = [];
const jobs: Job[] = [];
for (const module of readProofRecords()) {
  for (const obligation of module.obligations) {
    if (!("isabelle" in obligation) || obligation.isabelle === undefined) continue;
    const name = `${module.id}/${obligation.id}`;
    const path = join(PROOF_INPUTS_DIRECTORY, module.id, `${obligation.id}.thy`);
    const expected = obligation.isabelle.verdict;
    const skipped = (outcome: Outcome) =>
      results.push({
        name,
        expected,
        wall: outcome,
        cpu: outcome,
        wallMilliseconds: 0,
        cpuMilliseconds: 0,
      });
    if (!existsSync(path)) {
      skipped("missing");
      continue;
    }
    const text = readFileSync(path, "utf8");
    if (getIsabelleDigest(text) !== obligation.isabelle.input) skipped("stale");
    else jobs.push({ name, text, expected });
  }
}

const run = async () => {
  let worker = await spawnWorker();
  for (let job = jobs.shift(); job !== undefined; job = jobs.shift()) {
    const decision = await decide(worker, job.text);
    if (decision.isInterrupted) {
      await worker.terminate();
      worker = await spawnWorker();
    }
    const result = classify(job, decision);
    report(result);
    results.push(result);
  }
  await worker.terminate();
};
await Promise.all(Array.from({ length: jobCount }, run));

const summarize = (view: "wall" | "cpu") => {
  const counts = new Map<Outcome, number>();
  results.forEach((result) => counts.set(result[view], (counts.get(result[view]) ?? 0) + 1));
  console.log(`\nby ${view === "wall" ? "wall-clock" : "CPU"} time:`);
  counts.forEach((count, outcome) => console.log(`  ${outcome}: ${count}`));
  return counts.get("unsound") ?? 0;
};
const unsound = summarize("wall") + summarize("cpu");
console.log("\nslowest proofs:");
results
  .filter((result) => result.expected === "unsat")
  .toSorted((left, right) => right.cpuMilliseconds - left.cpuMilliseconds)
  .slice(0, 10)
  .forEach((result) =>
    console.log(
      `  ${result.name} (${result.cpuMilliseconds} ms cpu, ${result.wallMilliseconds} ms wall)`,
    ),
  );
console.log(`obligations: ${results.length}`);
if (unsound > 0) process.exitCode = 1;
