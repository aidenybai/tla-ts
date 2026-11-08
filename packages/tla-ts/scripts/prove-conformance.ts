// A difference where tlapm is wrong counts as a deviation, and one where tlapm's backend proved the
// obligation after tlapm's time limit counts as late. As a loaded machine stretches wall-clock
// time, an obligation tla-ts misses goes to tlapm's prover again until it has used the limit in
// both wall-clock and CPU time.

import { readFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { type ProofObligation, TlaError } from "../src";
import type { PrintedObligation } from "../src/obligations";
import { DECIDERS } from "../src/prover/deciders";
import { findMethods, type Method } from "../src/prover/prep/methods";
import { encodeForBackend } from "../src/prover/prove";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, writeResults } from "./corpora";
import { runWithCpuLimit } from "./cpu-limit";
import { tlaTs } from "./dist";
import { runModuleWorkers } from "./module-workers";
import {
  getModuleLoader,
  getModuleObligations,
  printResults,
  readProofRecords,
  type ModuleProofRecord,
  type ObligationRecord,
} from "./proof-records";
import { getDeviation } from "./tlapm-deviations";

// "extra" is a proof of what tlapm failed to prove, and "unsound" one of what tlapm's backend
// refuted. "late" is a proof by a backend whose input tlapm's backend proved too, after tlapm had
// stopped waiting for it at its time limit.
const VERDICTS = [
  "agree",
  "deviation",
  "late",
  "prover",
  "missed",
  "extra",
  "unsound",
  "trivial",
  "absent",
] as const;

type Verdict = (typeof VERDICTS)[number];

const isDifference = (verdict: Verdict) =>
  verdict !== "agree" && verdict !== "deviation" && verdict !== "late";

interface CpuProof {
  prover: string;
  wallMilliseconds: number;
  cpuMilliseconds: number;
}

interface Result {
  module: string;
  id: number;
  verdict: Verdict;
  expected: string;
  actual?: string;
  reason?: string;
  backend?: string;
  cpuProof?: CpuProof;
}

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".prove-results.json");

const isProved = (status: string) => status === "proved" || status === "trivial";

const getExpected = (record: ObligationRecord) =>
  record.status === "proved" ? `proved by ${record.prover}` : record.status;

const getActual = (obligation: ProofObligation) =>
  obligation.status === "proved" ? `proved by ${obligation.prover}` : obligation.status;

const getBackendVerdict = (record: ObligationRecord, prover: string) => {
  if (!("prover" in record)) return undefined;
  return prover === "smt" || prover === "z3"
    ? record.smt?.verdict
    : prover === "zenon"
      ? record.zenon?.verdict
      : prover === "isabelle"
        ? record.isabelle?.verdict
        : undefined;
};

const getVerdict = (expected: ObligationRecord, actual: ProofObligation | undefined): Verdict => {
  if (!actual) return "absent";
  if ((expected.status === "trivial") !== (actual.status === "trivial")) return "trivial";
  if (
    actual.status === "proved" &&
    !(expected.status === "proved" && expected.prover === actual.prover) &&
    getBackendVerdict(expected, actual.prover) === "unsat"
  )
    return "late";
  if (isProved(actual.status) && !isProved(expected.status))
    return actual.status === "proved" && getBackendVerdict(expected, actual.prover) === "sat"
      ? "unsound"
      : "extra";
  if (isProved(expected.status) && !isProved(actual.status)) return "missed";
  if (
    actual.status === "proved" &&
    expected.status === "proved" &&
    expected.prover !== actual.prover
  )
    return "prover";
  return "agree";
};

// The SMT encoder's CASE numbering only names a symbol, so the input starts it from zero.
const getCpuProof = async (
  obligation: PrintedObligation,
  method: Method,
): Promise<CpuProof | undefined> => {
  if (!(method.prover in DECIDERS)) return undefined;
  try {
    const text = encodeForBackend(obligation, method.prover, { caseErrors: 0 });
    const run = await runWithCpuLimit(method.timeLimitMs, method.prover, text);
    return run.verdict === "unsat" && run.cpuMilliseconds <= method.timeLimitMs
      ? {
          prover: method.prover,
          wallMilliseconds: run.wallMilliseconds,
          cpuMilliseconds: run.cpuMilliseconds,
        }
      : undefined;
  } catch (error) {
    if (error instanceof TlaError) return undefined;
    throw error;
  }
};

// The first prover the obligation's methods try of those tlapm and tla-ts proved it with. A
// difference without one is in Prep.
const getBackend = (
  provers: Method[],
  expected: ObligationRecord,
  actual: ProofObligation | undefined,
) => {
  const getPosition = (prover: string) => {
    const position = provers.findIndex((method) => method.prover === prover);
    return position === -1 ? Infinity : position;
  };
  return (
    [
      ...(expected.status === "proved" ? [expected.prover] : []),
      ...(actual?.status === "proved" ? [actual.prover] : []),
    ].toSorted((left, right) => getPosition(left) - getPosition(right))[0] ?? "prep"
  );
};

const proveModule = async (record: ModuleProofRecord): Promise<Result[]> => {
  const path = join(CORPORA_DIRECTORY, record.id);
  // A module tla-ts can't load leaves each of its obligations absent, with the error as reason.
  const proved = await tlaTs
    .prove({ source: readFileSync(path, "utf8"), loadModule: getModuleLoader(path) })
    .then(
      (result) => result.obligations,
      (error: unknown) => {
        if (!(error instanceof tlaTs.TlaError)) throw error;
        return error;
      },
    );
  const byId = new Map(
    proved instanceof tlaTs.TlaError ? [] : proved.map((obligation) => [obligation.id, obligation]),
  );
  const results = record.obligations.map((expected): Result => {
    const actual = byId.get(expected.id);
    const verdict = getVerdict(expected, actual);
    const deviation = verdict === "agree" ? undefined : getDeviation(record.id, expected.id);
    const reason =
      deviation ??
      (proved instanceof tlaTs.TlaError
        ? proved.message
        : actual?.status === "failed" || actual?.status === "unsupported"
          ? actual.reason
          : undefined);
    return {
      module: record.id,
      id: expected.id,
      verdict: deviation === undefined ? verdict : "deviation",
      expected: getExpected(expected),
      ...(actual ? { actual: getActual(actual) } : {}),
      ...(reason === undefined ? {} : { reason }),
    };
  });
  if (!results.some((result) => isDifference(result.verdict))) return results;
  const printed = new Map(
    getModuleObligations(path).map((obligation) => [obligation.id, obligation]),
  );
  // The second runs go one at a time, so they don't share the core they are timed on.
  const withBackends: Result[] = [];
  for (const [index, result] of results.entries()) {
    const obligation = printed.get(result.id);
    if (!isDifference(result.verdict) || !obligation) {
      withBackends.push(result);
      continue;
    }
    const expected = record.obligations[index];
    const actual = byId.get(result.id);
    const provers = findMethods(obligation).provers;
    const backend = getBackend(provers, expected, actual);
    // tla-ts not proving what tlapm's prover did may be a time-out.
    const method = provers.find((innerMethod) => innerMethod.prover === backend);
    const cpuProof =
      (result.verdict === "missed" || result.verdict === "prover") &&
      expected.status === "proved" &&
      expected.prover === backend &&
      method
        ? await getCpuProof(obligation, method)
        : undefined;
    withBackends.push({ ...result, backend, ...(cpuProof ? { cpuProof } : {}) });
  }
  return withBackends;
};

const records = readProofRecords();
const byModule = await runModuleWorkers(records, proveModule, availableParallelism());
// A worker that exits mid-module leaves that module's obligations absent.
const results = records.flatMap(
  (record, index) =>
    byModule.get(index) ??
    record.obligations.map((expected): Result => ({
      module: record.id,
      id: expected.id,
      verdict: "absent",
      expected: getExpected(expected),
      reason: "the worker exited",
    })),
);
writeResults(RESULTS_PATH, results);
console.log("by wall-clock time:");
printResults(
  results,
  VERDICTS,
  ["deviation", "late", "unsound", "missed", "extra", "trivial", "absent", "prover"],
  (result) =>
    `${result.verdict} ${result.module} #${result.id}: tlapm ${result.expected}, tla-ts ${result.actual ?? "none"}${result.reason ? ` (${result.reason})` : ""}${result.cpuProof ? ` (${result.cpuProof.prover} proves it in ${result.cpuProof.cpuMilliseconds} ms of CPU time)` : ""}`,
);
const byCpu = results.map((result) => (result.cpuProof ? "agree" : result.verdict));
console.log(
  `by CPU time: ${VERDICTS.map((verdict) => `${byCpu.filter((innerVerdict) => innerVerdict === verdict).length} ${verdict}`).join(", ")}`,
);
const differences = Map.groupBy(
  results.filter((result) => isDifference(result.verdict) && !result.cpuProof),
  (result) => `${result.verdict} ${result.backend ?? "prep"}`,
);
[...differences]
  .toSorted((left, right) => right[1].length - left[1].length)
  .forEach((group) => console.log(`  ${group[0]}: ${group[1].length}`));
