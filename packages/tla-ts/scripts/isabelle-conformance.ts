import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { decideIsabelle } from "../src/prove/isabelle/decide";
import {
  getIsabelleDigest,
  type ModuleProofRecord,
  PROOF_INPUTS_DIRECTORY,
  PROOFS_PATH,
} from "./proof-records";

// Runs each Isabelle theory tlapm wrote through decideIsabelle and compares the verdict with
// Isabelle's. An unsound answer proves what Isabelle couldn't.
//
// tlapm's limit is 30 s of wall-clock time, which a loaded machine stretches. So each theory runs
// with ten times that, and its result counts twice: within the limit by wall-clock time, as tlapm
// would see it here, and within the limit by CPU time, an estimate of a run on an idle core.
type Outcome = "match" | "unsound" | "missed" | "missing" | "stale";

interface Result {
  name: string;
  wall: Outcome;
  cpu: Outcome;
  wallMilliseconds: number;
  cpuMilliseconds: number;
}

const TIME_LIMIT_MS = 30_000;

const filter = process.argv.includes("--filter")
  ? process.argv[process.argv.indexOf("--filter") + 1]
  : undefined;
const modules: ModuleProofRecord[] = JSON.parse(readFileSync(PROOFS_PATH, "utf8"));
const results = modules
  .filter((module) => filter === undefined || module.id.includes(filter))
  .flatMap((module) =>
    module.obligations.flatMap((obligation): Result[] => {
      if (!("isabelle" in obligation) || obligation.isabelle === undefined) return [];
      const record = obligation.isabelle;
      const name = `${module.id}/${obligation.id}`;
      const path = join(PROOF_INPUTS_DIRECTORY, module.id, `${obligation.id}.thy`);
      const skipped = (outcome: Outcome) => [
        { name, wall: outcome, cpu: outcome, wallMilliseconds: 0, cpuMilliseconds: 0 },
      ];
      if (!existsSync(path)) return skipped("missing");
      const text = readFileSync(path, "utf8");
      if (getIsabelleDigest(text) !== record.input) return skipped("stale");
      const started = performance.now();
      const startedCpu = process.cpuUsage();
      const verdict = decideIsabelle(text, { timeLimitMs: 10 * TIME_LIMIT_MS });
      const cpu = process.cpuUsage(startedCpu);
      const wallMilliseconds = Math.round(performance.now() - started);
      const cpuMilliseconds = Math.round((cpu.user + cpu.system) / 1000);
      const classify = (milliseconds: number): Outcome => {
        if (verdict === "unsat" && record.verdict !== "unsat") return "unsound";
        const within = verdict === "unsat" && milliseconds <= TIME_LIMIT_MS ? "unsat" : "unknown";
        return within === record.verdict ? "match" : "missed";
      };
      const result = {
        name,
        wall: classify(wallMilliseconds),
        cpu: classify(cpuMilliseconds),
        wallMilliseconds,
        cpuMilliseconds,
      };
      if (result.wall !== "match" || result.cpu !== "match")
        console.log(
          `wall ${result.wall.padEnd(8)} cpu ${result.cpu.padEnd(8)} ${name} (Isabelle: ${record.verdict}, ${wallMilliseconds} ms wall, ${cpuMilliseconds} ms cpu)`,
        );
      return [result];
    }),
  );
const report = (view: "wall" | "cpu") => {
  const counts = new Map<Outcome, number>();
  results.forEach((result) => counts.set(result[view], (counts.get(result[view]) ?? 0) + 1));
  console.log(`\nby ${view === "wall" ? "wall-clock" : "CPU"} time:`);
  counts.forEach((count, outcome) => console.log(`  ${outcome}: ${count}`));
  return counts.get("unsound") ?? 0;
};
const unsound = report("wall") + report("cpu");
const slowest = results.toSorted((left, right) => right.cpuMilliseconds - left.cpuMilliseconds)[0];
if (slowest !== undefined)
  console.log(
    `\nslowest: ${slowest.name} (${slowest.cpuMilliseconds} ms cpu, ${slowest.wallMilliseconds} ms wall)`,
  );
console.log(`obligations: ${results.length}`);
if (unsound > 0) process.exitCode = 1;
