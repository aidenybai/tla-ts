// Proves each module with tla-ts's own backends and compares every obligation's status with the one
// tlapm reached, as conformance:record-proofs recorded it. tla-ts should prove what tlapm proves,
// find trivial what tlapm finds trivial, never prove what tlapm fails to prove, and prove each
// obligation with the prover tlapm used. A proof of what tlapm's backend refuted is unsound. A
// difference where tlapm is wrong counts as a deviation instead. Worker processes take one module
// at a time, largest first, --jobs of them at once.
//
// tlapm's time limits are wall-clock time, which a loaded machine stretches. So an obligation
// tla-ts misses, or proves with a later prover than tlapm's, goes to tlapm's prover again until it
// has used the limit in both wall-clock and CPU time. Each result counts twice: by wall-clock time,
// as prove saw it here, and by CPU time, where a proof within the limit on that second run agrees.

import { readFileSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { prove, type ProofObligation, TlaError } from "../src";
import { getObligations, type PrintedObligation } from "../src/obligations";
import { DECIDERS } from "../src/prove/deciders";
import { findMethods } from "../src/prove/prep/pragma";
import { encodeForBackend } from "../src/prove/prove";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY } from "./corpora";
import { runWithCpuLimit } from "./cpu-limit";
import { runModuleWorkers } from "./module-workers";
import {
  getModuleLoader,
  printResults,
  readProofRecords,
  type ModuleProofRecord,
  type ObligationRecord,
} from "./proof-records";
import { getDeviation } from "./tlapm-deviations";

// "extra" is a proof of what tlapm failed to prove, and "unsound" one of what tlapm's backend
// refuted.
const VERDICTS = [
  "agree",
  "deviation",
  "prover",
  "missed",
  "extra",
  "unsound",
  "trivial",
  "absent",
] as const;

type Verdict = (typeof VERDICTS)[number];

// tlapm's prover proving the obligation within its limit in CPU time.
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
  cpuProof?: CpuProof;
}

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".prove-results.json");

const isProved = (status: string) => status === "proved" || status === "trivial";

// What tlapm reached, with the prover that proved it.
const getExpected = (record: ObligationRecord) =>
  record.status === "proved" ? `proved by ${record.prover}` : record.status;

const getActual = (obligation: ProofObligation) =>
  obligation.status === "proved" ? `proved by ${obligation.prover}` : obligation.status;

// What tlapm's backend answered on the input the prover selects.
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

// Decides the obligation again with the prover tlapm proved it with, when tla-ts tried that prover
// and didn't prove it, and returns the proof if it comes within the limit in CPU time. The SMT
// encoder's CASE numbering only names a symbol, so the input starts it from zero.
const getCpuProof = (
  obligation: PrintedObligation,
  expected: ObligationRecord,
  actual: ProofObligation,
): CpuProof | undefined => {
  if (expected.status !== "proved") return undefined;
  const provers = findMethods(obligation).provers;
  const position = provers.findIndex((method) => method.prover === expected.prover);
  const method = provers[position];
  if (!method || !(method.prover in DECIDERS)) return undefined;
  if (
    actual.status === "proved" &&
    provers.findIndex((innerMethod) => innerMethod.prover === actual.prover) < position
  )
    return undefined;
  try {
    const text = encodeForBackend(obligation, method.prover, { caseErrors: 0 });
    const run = runWithCpuLimit(method.timeLimitMs, (options) =>
      DECIDERS[method.prover](text, options),
    );
    return run.result === "unsat" && run.cpuMilliseconds <= method.timeLimitMs
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

const proveModule = async (record: ModuleProofRecord): Promise<Result[]> => {
  const path = join(CORPORA_DIRECTORY, record.id);
  const source = readFileSync(path, "utf8");
  const loadModule = getModuleLoader(path);
  // A module tla-ts can't load leaves each of its obligations absent, with the error as reason.
  const proved = await prove({ source, loadModule }).then(
    (result) => result.obligations,
    (error: unknown) => {
      if (!(error instanceof TlaError)) throw error;
      return error;
    },
  );
  const byId = new Map(
    proved instanceof TlaError ? [] : proved.map((obligation) => [obligation.id, obligation]),
  );
  const results = record.obligations.map((expected): Result => {
    const actual = byId.get(expected.id);
    const verdict = getVerdict(expected, actual);
    const deviation = verdict === "agree" ? undefined : getDeviation(record.id, expected.id);
    const reason =
      deviation ??
      (proved instanceof TlaError
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
  const isRechecked = (result: Result) =>
    result.verdict === "missed" || result.verdict === "prover";
  if (!results.some(isRechecked)) return results;
  const printed = new Map(
    getObligations([{ file: path, source }], (name) => {
      const loaded = loadModule(name);
      return loaded === undefined ? undefined : { file: `${name}.tla`, source: loaded };
    })
      .flatMap((result) => result.obligations)
      .map((obligation) => [obligation.id, obligation]),
  );
  return results.map((result, index) => {
    const obligation = printed.get(result.id);
    const actual = byId.get(result.id);
    const cpuProof =
      isRechecked(result) && obligation && actual
        ? getCpuProof(obligation, record.obligations[index], actual)
        : undefined;
    return cpuProof ? { ...result, cpuProof } : result;
  });
};

// The backend a difference points at: the prover tlapm proved the obligation with, or the one
// tla-ts proved it with when tlapm didn't.
const getOwner = (result: Result) =>
  (/^proved by (\w+)/.exec(result.expected) ?? /^proved by (\w+)/.exec(result.actual ?? ""))?.[1] ??
  "none";

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
writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
console.log("by wall-clock time:");
printResults(
  results,
  VERDICTS,
  ["deviation", "unsound", "extra", "trivial", "absent", "prover"],
  (result) =>
    `${result.verdict} ${result.module} #${result.id}: tlapm ${result.expected}, tla-ts ${result.actual ?? "none"}${result.reason ? ` (${result.reason})` : ""}${result.cpuProof ? ` (${result.cpuProof.prover} proves it in ${result.cpuProof.cpuMilliseconds} ms of CPU time)` : ""}`,
);
const byCpu = results.map((result) => (result.cpuProof ? "agree" : result.verdict));
console.log(
  `by CPU time: ${VERDICTS.map((verdict) => `${byCpu.filter((innerVerdict) => innerVerdict === verdict).length} ${verdict}`).join(", ")}`,
);
// The differences by CPU time, by kind and the backend each points at.
const differences = Map.groupBy(
  results.filter(
    (result) => result.verdict !== "agree" && result.verdict !== "deviation" && !result.cpuProof,
  ),
  (result) => `${result.verdict} ${getOwner(result)}`,
);
[...differences]
  .toSorted((left, right) => right[1].length - left[1].length)
  .forEach((group) => console.log(`  ${group[0]}: ${group[1].length}`));
