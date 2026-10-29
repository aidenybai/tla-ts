import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { encodeZenon } from "../src/prove/zenon/encode";
import type { PrintedObligation } from "../src/obligations";
import { runZenon } from "../src/prove/zenon/decide";
import { CORPORA_DIRECTORY, getLibraryModules, getModuleObligations } from "./corpora";
import {
  getInputDigest,
  getZenonVerdict,
  PROOF_INPUTS_DIRECTORY,
  PROOFS_PATH,
  type ModuleProofRecord,
} from "./proof-records";

// tlapm gives Zenon 10 s per obligation unless a proof says otherwise.
const TIME_LIMIT_MS = 10_000;

const getOption = (name: string) =>
  process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined;

const filter = getOption("--filter");
// --shard 2/4 checks every fourth obligation, starting with the second, to split a run across
// processes.
const shard = (getOption("--shard") ?? "1/1").split("/").map(Number);
// With ZENON set to tlapm's Zenon binary, it runs on the same files, to compare verdicts, node
// counts and times.
const zenonPath = process.env.ZENON;

const libraryModules = getLibraryModules();

const getMedian = (values: number[]) => {
  const sorted = values.toSorted((left, right) => left - right);
  return sorted.length === 0 ? 0 : sorted[Math.floor((sorted.length - 1) / 2)];
};

const formatSeconds = (milliseconds: number) => `${(milliseconds / 1000).toFixed(3)} s`;

const records: ModuleProofRecord[] = JSON.parse(readFileSync(PROOFS_PATH, "utf8"));
const runs = records
  .filter((module) => filter === undefined || module.id.includes(filter))
  .flatMap((module) =>
    module.obligations.flatMap((obligation) =>
      (obligation.status !== "proved" && obligation.status !== "failed") ||
      obligation.zenon === undefined
        ? []
        : [{ moduleId: module.id, id: obligation.id, record: obligation.zenon }],
    ),
  )
  .filter((_, index) => index % shard[1] === shard[0] - 1);

const moduleObligations = new Map<string, Map<number, PrintedObligation> | string>();
const getModule = (moduleId: string) => {
  const cached = moduleObligations.get(moduleId);
  if (cached !== undefined) return cached;
  const obligations = (() => {
    try {
      const printed = getModuleObligations(join(CORPORA_DIRECTORY, moduleId), libraryModules);
      return new Map(printed.map((obligation) => [obligation.id, obligation]));
    } catch (error) {
      if (error instanceof Error) return `${error.name}: ${error.message}`;
      throw error;
    }
  })();
  moduleObligations.set(moduleId, obligations);
  return obligations;
};

const getEncoderOutcome = (moduleId: string, id: number, input: string) => {
  const obligations = getModule(moduleId);
  if (typeof obligations === "string") return "module error";
  const obligation = obligations.get(id);
  if (obligation === undefined) return "missing";
  try {
    return getInputDigest(encodeZenon(obligation)) === input ? "match" : "mismatch";
  } catch (error) {
    if (error instanceof Error) return error.name;
    throw error;
  }
};

// tlapm runs Zenon with -max-time 1d and kills it once its timeout passes.
const runReference = (path: string) => {
  if (zenonPath === undefined) return undefined;
  const start = performance.now();
  const result = spawnSync(
    zenonPath,
    ["-p0", "-x", "tla", "-oisar", "-max-time", "1d", "-stats", path],
    { encoding: "utf8", maxBuffer: 1 << 30, timeout: TIME_LIMIT_MS, killSignal: "SIGKILL" },
  );
  const nodesSearched = /^nodes searched: (\d+)$/m.exec(result.stderr)?.[1];
  return {
    isProved: result.signal === null && getZenonVerdict(result.stdout) === "unsat",
    // Zenon prints its statistics only when it stops by itself.
    nodesSearched: nodesSearched === undefined ? undefined : Number(nodesSearched),
    elapsed: performance.now() - start,
  };
};

const results = runs.map((run) => {
  const name = `${run.moduleId} #${run.id}`;
  const encoderOutcome = getEncoderOutcome(run.moduleId, run.id, run.record.input);
  if (encoderOutcome !== "match") console.log(`encoder ${encoderOutcome.padEnd(12)} ${name}`);
  // The prover runs on the file tlapm wrote, so a gap in the encoder doesn't hide one in the prover.
  const path = join(PROOF_INPUTS_DIRECTORY, run.moduleId, `${run.id}.znn`);
  if (!existsSync(path)) return { encoderOutcome };
  const isFound = run.record.verdict === "unsat";
  const start = performance.now();
  const zenon = runZenon(readFileSync(path, "utf8"), { timeLimitMs: TIME_LIMIT_MS });
  const elapsed = performance.now() - start;
  const isProved = zenon.isar !== undefined;
  if (isFound !== isProved) console.log(`prover  ${isFound ? "miss" : "surplus"}      ${name}`);
  const reference = runReference(path);
  if (reference !== undefined && reference.isProved !== isProved)
    console.log(`binary  ${reference.isProved ? "miss" : "surplus"}      ${name}`);
  // The node counts match only where both searches stop by themselves: tla-ts bounds its memory
  // by nodes rather than by Zenon's heap.
  const isCounted =
    reference?.nodesSearched !== undefined &&
    zenon.failure !== "time limit" &&
    zenon.failure !== "memory limit";
  if (isCounted && reference.nodesSearched !== zenon.nodesSearched)
    console.log(`nodes   ${zenon.nodesSearched} vs ${reference.nodesSearched}  ${name}`);
  return {
    encoderOutcome,
    prover: {
      isFound,
      isProved,
      elapsed,
      reference,
      isCounted,
      isSameCount: isCounted && reference.nodesSearched === zenon.nodesSearched,
    },
  };
});

const encoderCounts = new Map<string, number>();
results.forEach((result) =>
  encoderCounts.set(result.encoderOutcome, (encoderCounts.get(result.encoderOutcome) ?? 0) + 1),
);
const proverResults = results.flatMap((result) =>
  result.prover === undefined ? [] : [result.prover],
);
const provedTimes = proverResults
  .filter((result) => result.isFound && result.isProved)
  .map((result) => result.elapsed);
const referenceTimes = proverResults.flatMap((result) =>
  result.reference?.isProved === true ? [result.reference.elapsed] : [],
);
const formatTimes = (times: number[]) =>
  `median ${formatSeconds(getMedian(times))}, worst ${formatSeconds(Math.max(0, ...times))}`;

console.log("");
console.log(`obligations: ${results.length}`);
encoderCounts.forEach((count, outcome) => console.log(`encoder ${outcome}: ${count}`));
console.log(`prover inputs: ${proverResults.length}`);
console.log(
  `prover proved: ${proverResults.filter((result) => result.isProved).length} (tlapm's Zenon found ${proverResults.filter((result) => result.isFound).length})`,
);
console.log(
  `prover misses: ${proverResults.filter((result) => result.isFound && !result.isProved).length}`,
);
console.log(
  `prover surplus: ${proverResults.filter((result) => !result.isFound && result.isProved).length}`,
);
console.log(`tla-ts time on found proofs: ${formatTimes(provedTimes)}`);
if (zenonPath !== undefined) {
  console.log(
    `binary disagreements: ${proverResults.filter((result) => result.reference?.isProved !== result.isProved).length}`,
  );
  console.log(
    `node counts compared: ${proverResults.filter((result) => result.isCounted).length}, equal ${proverResults.filter((result) => result.isSameCount).length}`,
  );
  console.log(`Zenon time on its proofs: ${formatTimes(referenceTimes)}`);
}
