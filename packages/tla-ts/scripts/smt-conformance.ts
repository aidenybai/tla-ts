import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { SmtParseError } from "../src/errors";
import { decideSmt } from "../src/prove/smt/solver/solver";
import { CONFORMANCE_DIRECTORY } from "./corpora";
import { getSmtVerdict, PROOF_INPUTS_DIRECTORY, type BackendVerdict } from "./proof-records";

// "unsound" is an answer Z3 contradicts, "extra" a proof of an obligation Z3 gave up on.
type Outcome = "proved" | "missed" | "extra" | "unsound" | "unproved";

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".smt-results.json");

// tlapm gives Z3 5 s per obligation.
const TIME_LIMIT_MS = 5000;

const listInputs = (directory: string): string[] =>
  readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? listInputs(path) : path.endsWith(".smt") ? [path] : [];
    });

// Z3 rejects malformed input with an error, which counts as unknown.
const decide = (text: string) => {
  try {
    return decideSmt(text, { timeLimitMs: TIME_LIMIT_MS });
  } catch (error) {
    if (error instanceof SmtParseError) return "unknown";
    throw error;
  }
};

const getOutcome = (z3: BackendVerdict, ours: BackendVerdict): Outcome => {
  if (ours === "unsat") return z3 === "unsat" ? "proved" : z3 === "sat" ? "unsound" : "extra";
  if (ours === "sat" && z3 === "unsat") return "unsound";
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
  const start = performance.now();
  const ours = decide(readFileSync(path, "utf8"));
  const timeMs = Math.round(performance.now() - start);
  const outcome = getOutcome(z3, ours);
  const id = relative(PROOF_INPUTS_DIRECTORY, path);
  if (outcome === "missed" || outcome === "extra" || outcome === "unsound")
    console.log(`${outcome.padEnd(8)} ${id} (z3 ${z3}, ours ${ours}, ${timeMs} ms)`);
  return { id, z3, ours, outcome, timeMs };
});
writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);

const counts = new Map<Outcome, number>();
results.forEach((result) => counts.set(result.outcome, (counts.get(result.outcome) ?? 0) + 1));
const times = results.map((result) => result.timeMs).sort((left, right) => left - right);
const getPercentile = (fraction: number) =>
  times[Math.min(times.length - 1, Math.floor(times.length * fraction))] ?? 0;
console.log("");
console.log(`proved by both: ${counts.get("proved") ?? 0}`);
console.log(`missed (Z3 unsat, ours not): ${counts.get("missed") ?? 0}`);
console.log(`extra (ours unsat, Z3 unknown): ${counts.get("extra") ?? 0}`);
console.log(`unsound (ours contradicts Z3): ${counts.get("unsound") ?? 0}`);
console.log(`unproved by both: ${counts.get("unproved") ?? 0}`);
console.log(
  `time: median ${getPercentile(0.5)} ms, p90 ${getPercentile(0.9)} ms, p99 ${getPercentile(0.99)} ms, max ${getPercentile(1)} ms`,
);
console.log(`inputs: ${results.length} (${basename(RESULTS_PATH)} has the details)`);
if ((counts.get("unsound") ?? 0) > 0) process.exitCode = 1;
