import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { decideIsabelle } from "../src/prove/isabelle/decide";
import {
  getIsabelleDigest,
  type ModuleProofRecord,
  PROOF_INPUTS_DIRECTORY,
  PROOFS_PATH,
} from "./proof-records";

// Runs each Isabelle theory tlapm wrote through decideIsabelle, with tlapm's time limit, and compares
// the verdict with Isabelle's. An unsound answer proves what Isabelle couldn't.
type Outcome = "match" | "unsound" | "missed" | "missing" | "stale";

interface Result {
  name: string;
  outcome: Outcome;
  milliseconds: number;
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
      if (!existsSync(path)) return [{ name, outcome: "missing", milliseconds: 0 }];
      const text = readFileSync(path, "utf8");
      if (getIsabelleDigest(text) !== record.input)
        return [{ name, outcome: "stale", milliseconds: 0 }];
      const started = performance.now();
      const verdict = decideIsabelle(text, { timeLimitMs: TIME_LIMIT_MS });
      const milliseconds = Math.round(performance.now() - started);
      const outcome =
        verdict === record.verdict ? "match" : verdict === "unsat" ? "unsound" : "missed";
      if (outcome !== "match")
        console.log(
          `${outcome.padEnd(8)} ${name} (Isabelle: ${record.verdict}, ${milliseconds} ms)`,
        );
      return [{ name, outcome, milliseconds }];
    }),
  );
const counts = new Map<Outcome, number>();
results.forEach((result) => counts.set(result.outcome, (counts.get(result.outcome) ?? 0) + 1));
console.log("");
counts.forEach((count, outcome) => console.log(`${outcome}: ${count}`));
const slowest = results.toSorted((left, right) => right.milliseconds - left.milliseconds)[0];
if (slowest !== undefined) console.log(`slowest: ${slowest.name} (${slowest.milliseconds} ms)`);
console.log(`obligations: ${results.length}`);
if ((counts.get("unsound") ?? 0) > 0) process.exitCode = 1;
