import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { encodeForBackend } from "../src/prover/prove";
import type { PrintedObligation } from "../src/obligations";
import { runZenon } from "../src/prover/zenon/decide";
import { CORPORA_DIRECTORY, formatSeconds, getMedian, getOption } from "./corpora";
import {
  getInputDigest,
  getObligationsById,
  getZenonVerdict,
  PROOF_INPUTS_DIRECTORY,
  readProofRecords,
} from "./proof-records";

const TIME_LIMIT_MS = 10_000;

const shard = (getOption("--shard") ?? "1/1").split("/").map(Number);
const zenonPath = process.env.ZENON;

const runs = readProofRecords()
  .flatMap((module) =>
    module.obligations.flatMap((obligation) =>
      (obligation.status !== "proved" && obligation.status !== "failed") ||
      obligation.zenon === undefined
        ? []
        : [{ moduleId: module.id, id: obligation.id, record: obligation.zenon }],
    ),
  )
  .filter((_, index) => index % shard[1] === shard[0] - 1);

let currentModuleId = "";
let currentObligations: Map<number, PrintedObligation> | undefined;
const getModule = (moduleId: string) => {
  if (currentModuleId === moduleId) return currentObligations;
  currentModuleId = moduleId;
  currentObligations = (() => {
    try {
      return getObligationsById(join(CORPORA_DIRECTORY, moduleId));
    } catch (error) {
      if (error instanceof Error) return undefined;
      throw error;
    }
  })();
  return currentObligations;
};

const getEncoderOutcome = (moduleId: string, id: number, input: string) => {
  const obligations = getModule(moduleId);
  if (obligations === undefined) return "module error";
  const obligation = obligations.get(id);
  if (obligation === undefined) return "missing";
  try {
    return getInputDigest(encodeForBackend(obligation, "zenon", { caseErrors: 0 })) === input
      ? "match"
      : "mismatch";
  } catch (error) {
    if (error instanceof Error) return error.name;
    throw error;
  }
};

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
    nodesSearched: nodesSearched === undefined ? undefined : Number(nodesSearched),
    elapsed: performance.now() - start,
  };
};

const results = runs.map((run) => {
  const name = `${run.moduleId} #${run.id}`;
  const encoderOutcome = getEncoderOutcome(run.moduleId, run.id, run.record.input);
  if (encoderOutcome !== "match") console.log(`encoder ${encoderOutcome.padEnd(12)} ${name}`);
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
  `median ${formatSeconds(getMedian(times), 3)}, worst ${formatSeconds(Math.max(0, ...times), 3)}`;

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
