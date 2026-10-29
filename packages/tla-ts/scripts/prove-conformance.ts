// Proves each module with tla-ts's own backends and compares every obligation's status with the one
// tlapm reached, as conformance:record-proofs recorded it. tla-ts should prove what tlapm proves,
// find trivial what tlapm finds trivial, never prove what tlapm fails to prove, and prove each
// obligation with the prover tlapm used. A difference where tlapm is wrong counts as a deviation
// instead. Worker processes take one module at a time, largest first,
// --jobs of them at once.

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

type Verdict = "agree" | "deviation" | "prover" | "missed" | "unsound" | "trivial" | "absent";

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

const getVerdict = (expected: ObligationRecord, actual: ProofObligation | undefined): Verdict => {
  if (!actual) return "absent";
  if ((expected.status === "trivial") !== (actual.status === "trivial")) return "trivial";
  if (isProved(actual.status) && !isProved(expected.status)) return "unsound";
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
  ["agree", "deviation", "prover", "missed", "unsound", "trivial", "absent"],
  ["deviation", "unsound", "trivial", "absent", "prover"],
  (result) =>
    `${result.verdict} ${result.module} #${result.id}: tlapm ${result.expected}, tla-ts ${result.actual ?? "none"}${result.reason ? ` (${result.reason})` : ""}`,
);
// What tlapm reached and tla-ts didn't, by tlapm's status and what tla-ts reached.
const differences = Map.groupBy(
  results.filter((result) => result.verdict !== "agree" && result.verdict !== "deviation"),
  (result) => `${result.verdict}: tlapm ${result.expected}, tla-ts ${result.actual}`,
);
[...differences]
  .toSorted((left, right) => right[1].length - left[1].length)
  .forEach((group) => console.log(`  ${group[0]}: ${group[1].length}`));
