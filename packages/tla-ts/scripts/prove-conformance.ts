// Proves each module with tla-ts's own backends and compares every obligation's status with the one
// tlapm reached, as conformance:record-proofs recorded it. tla-ts should prove what tlapm proves,
// find trivial what tlapm finds trivial, never prove what tlapm fails to prove, and prove each
// obligation with the prover tlapm used. A proof of what tlapm's backend refuted is unsound. A
// difference where tlapm is wrong counts as a deviation instead. Worker processes take one module
// at a time, largest first, --jobs of them at once.

import { readFileSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { prove, type ProofObligation, TlaError } from "../src";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY } from "./corpora";
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

interface Result {
  module: string;
  id: number;
  verdict: Verdict;
  expected: string;
  actual?: string;
  reason?: string;
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

const proveModule = async (record: ModuleProofRecord): Promise<Result[]> => {
  const path = join(CORPORA_DIRECTORY, record.id);
  // A module tla-ts can't load leaves each of its obligations absent, with the error as reason.
  const proved = await prove({
    source: readFileSync(path, "utf8"),
    loadModule: getModuleLoader(path),
  }).then(
    (result) => result.obligations,
    (error: unknown) => {
      if (!(error instanceof TlaError)) throw error;
      return error;
    },
  );
  const byId = new Map(
    proved instanceof TlaError ? [] : proved.map((obligation) => [obligation.id, obligation]),
  );
  return record.obligations.map((expected) => {
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
printResults(
  results,
  VERDICTS,
  ["deviation", "unsound", "extra", "trivial", "absent", "prover"],
  (result) =>
    `${result.verdict} ${result.module} #${result.id}: tlapm ${result.expected}, tla-ts ${result.actual ?? "none"}${result.reason ? ` (${result.reason})` : ""}`,
);
// The differences, by kind and the backend each points at.
const differences = Map.groupBy(
  results.filter((result) => result.verdict !== "agree" && result.verdict !== "deviation"),
  (result) => `${result.verdict} ${getOwner(result)}`,
);
[...differences]
  .toSorted((left, right) => right[1].length - left[1].length)
  .forEach((group) => console.log(`  ${group[0]}: ${group[1].length}`));
