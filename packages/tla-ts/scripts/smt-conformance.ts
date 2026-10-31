import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { SmtParseError } from "../src/errors";
import { decideSmt } from "../src/prove/smt/solver/solver";
import { CONFORMANCE_DIRECTORY } from "./corpora";
import { getSmtVerdict, PROOF_INPUTS_DIRECTORY, type BackendVerdict } from "./proof-records";

// "unsound" is an answer Z3 contradicts, "extra" a proof of an obligation Z3 gave up on.
type Outcome = "proved" | "missed" | "extra" | "unsound" | "unproved";

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".smt-results.json");

// tlapm gives Z3 5 s of wall-clock time per obligation. On a loaded machine wall-clock time
// overstates the time on an idle core, so the solver runs with ten times that wall-clock limit, and
// an answer counts as within the limit by its CPU time, which decides parity, or by its wall-clock
// time.
const TIME_LIMIT_MS = 5000;
const WALL_LIMIT_MS = 10 * TIME_LIMIT_MS;

const listInputs = (directory: string): string[] =>
  readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) return listInputs(path);
      return path.endsWith(".smt") || path.endsWith(".smt2") ? [path] : [];
    });

// Z3 rejects malformed input with an error, which counts as unknown.
const decide = (text: string) => {
  try {
    return decideSmt(text, { timeLimitMs: WALL_LIMIT_MS });
  } catch (error) {
    if (error instanceof SmtParseError) return "unknown";
    throw error;
  }
};

// An answer that contradicts Z3 is unsound whenever it comes, and other answers count only within
// the time limit.
const getOutcome = (z3: BackendVerdict, ours: BackendVerdict, isInTime: boolean): Outcome => {
  if ((ours === "unsat" && z3 === "sat") || (ours === "sat" && z3 === "unsat")) return "unsound";
  if (ours === "unsat" && isInTime) return z3 === "unsat" ? "proved" : "extra";
  return z3 === "unsat" ? "missed" : "unproved";
};

const filter = process.argv.includes("--filter")
  ? process.argv[process.argv.indexOf("--filter") + 1]
  : undefined;
const inputs = existsSync(PROOF_INPUTS_DIRECTORY)
  ? listInputs(PROOF_INPUTS_DIRECTORY).filter(
      (path) => existsSync(`${path}.out`) && (filter === undefined || path.includes(filter)),
    )
  : [];
if (inputs.length === 0)
  console.log(`no recorded inputs in ${PROOF_INPUTS_DIRECTORY}, run conformance:record-proofs`);
const results = inputs.map((path) => {
  const z3 = getSmtVerdict(readFileSync(`${path}.out`, "utf8"));
  const text = readFileSync(path, "utf8");
  const start = performance.now();
  const startCpu = process.cpuUsage();
  const ours = decide(text);
  const cpu = process.cpuUsage(startCpu);
  const timeMs = Math.round(performance.now() - start);
  const cpuMs = Math.round((cpu.user + cpu.system) / 1000);
  const outcome = getOutcome(z3, ours, cpuMs <= TIME_LIMIT_MS);
  const wallOutcome = getOutcome(z3, ours, timeMs <= TIME_LIMIT_MS);
  const id = relative(PROOF_INPUTS_DIRECTORY, path);
  if (outcome === "missed" || outcome === "extra" || outcome === "unsound")
    console.log(
      `${outcome.padEnd(8)} ${id} (z3 ${z3}, ours ${ours}, ${cpuMs} ms cpu, ${timeMs} ms)`,
    );
  return { id, z3, ours, outcome, wallOutcome, cpuMs, timeMs };
});
writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);

const report = (title: string, outcomes: Outcome[], times: number[]) => {
  const counts = new Map<Outcome, number>();
  outcomes.forEach((outcome) => counts.set(outcome, (counts.get(outcome) ?? 0) + 1));
  const sorted = times.toSorted((left, right) => left - right);
  const getPercentile = (fraction: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
  console.log("");
  console.log(title);
  console.log(`proved by both: ${counts.get("proved") ?? 0}`);
  console.log(`missed (Z3 unsat, ours not): ${counts.get("missed") ?? 0}`);
  console.log(`extra (ours unsat, Z3 unknown): ${counts.get("extra") ?? 0}`);
  console.log(`unsound (ours contradicts Z3): ${counts.get("unsound") ?? 0}`);
  console.log(`unproved by both: ${counts.get("unproved") ?? 0}`);
  console.log(
    `time: median ${getPercentile(0.5)} ms, p90 ${getPercentile(0.9)} ms, p99 ${getPercentile(0.99)} ms, max ${getPercentile(1)} ms`,
  );
  return counts.get("unsound") ?? 0;
};
const numUnsound = report(
  "within 5 s of CPU time, the estimate for an idle core:",
  results.map((result) => result.outcome),
  results.map((result) => result.cpuMs),
);
report(
  "within 5 s of wall-clock time:",
  results.map((result) => result.wallOutcome),
  results.map((result) => result.timeMs),
);
console.log(`inputs: ${results.length} (${basename(RESULTS_PATH)} has the details)`);
if (numUnsound > 0) process.exitCode = 1;
