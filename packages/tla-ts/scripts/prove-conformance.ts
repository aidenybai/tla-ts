// Proves each module with tla-ts's own backends and compares every obligation's status with the one
// tlapm reached, as conformance:record-proofs recorded it. tla-ts should prove what tlapm proves,
// find trivial what tlapm finds trivial, never prove what tlapm fails to prove, and prove each
// obligation with the prover tlapm used.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prove, type ProofObligation, TlaError } from "../src";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY } from "./corpora";
import {
  getModuleLoader,
  printResults,
  readProofRecords,
  type ObligationRecord,
} from "./proof-records";

type Verdict = "agree" | "prover" | "missed" | "unsound" | "trivial" | "absent";

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
  if (actual.status === "proved" && expected.prover !== actual.prover) return "prover";
  return "agree";
};

const results: Result[] = [];
for (const record of readProofRecords()) {
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
  record.obligations.forEach((expected) => {
    const actual = byId.get(expected.id);
    const reason =
      proved instanceof TlaError
        ? proved.message
        : actual?.status === "failed" || actual?.status === "unsupported"
          ? actual.reason
          : undefined;
    results.push({
      module: record.id,
      id: expected.id,
      verdict: getVerdict(expected, actual),
      expected: getExpected(expected),
      ...(actual ? { actual: getActual(actual) } : {}),
      ...(reason === undefined ? {} : { reason }),
    });
  });
}

writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
printResults(
  results,
  ["agree", "prover", "missed", "unsound", "trivial", "absent"],
  ["unsound", "trivial", "absent", "prover"],
  (result) =>
    `${result.verdict} ${result.module} #${result.id}: tlapm ${result.expected}, tla-ts ${result.actual ?? "none"}${result.reason ? ` (${result.reason})` : ""}`,
);
// What tlapm proved and tla-ts didn't, by the prover tlapm used and what tla-ts reached.
const missed = Map.groupBy(
  results.filter((result) => result.verdict === "missed"),
  (result) => `${result.expected}, tla-ts ${result.actual}`,
);
[...missed].forEach((group) => console.log(`  missed ${group[0]}: ${group[1].length}`));
