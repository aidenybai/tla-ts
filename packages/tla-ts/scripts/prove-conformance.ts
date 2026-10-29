// Proves each module with tla-ts's own backend and compares every obligation's status with the one
// tlapm reached, as conformance:record-proofs recorded it. tla-ts should prove what tlapm proves,
// find trivial what tlapm finds trivial, and never prove what tlapm fails to prove.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { prove, type ProofObligation, TlaError } from "../src";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, getLibraryModules } from "./corpora";
import { PROOFS_PATH, type ModuleProofRecord, type ObligationRecord } from "./proof-records";

type Verdict = "agree" | "missed" | "unsound" | "trivial" | "absent";

interface Result {
  module: string;
  id: number;
  verdict: Verdict;
  expected: string;
  actual?: string;
  reason?: string;
}

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".prove-results.json");

const libraryModules = getLibraryModules();

// tlapm searches the module's directory, then the -I library, then its own standard library.
const TLAPM_LIBRARY = join(CORPORA_DIRECTORY, "tlapm/library");

const readModule = (path: string | undefined) =>
  path !== undefined && existsSync(path) ? readFileSync(path, "utf8") : undefined;

const isProved = (status: string) => status === "proved" || status === "trivial";

// What tlapm reached, with the prover that proved it.
const getExpected = (record: ObligationRecord) =>
  record.status === "proved" && record.prover !== undefined
    ? `proved by ${record.prover}`
    : record.status;

const getVerdict = (expected: ObligationRecord, actual: ProofObligation | undefined): Verdict => {
  if (!actual) return "absent";
  if ((expected.status === "trivial") !== (actual.status === "trivial")) return "trivial";
  if (isProved(actual.status) && !isProved(expected.status)) return "unsound";
  if (isProved(expected.status) && !isProved(actual.status)) return "missed";
  return "agree";
};

const filter = process.argv.includes("--filter")
  ? process.argv[process.argv.indexOf("--filter") + 1]
  : undefined;
const isVerbose = process.argv.includes("--verbose");
if (!existsSync(PROOFS_PATH)) {
  console.error("Run conformance:record-proofs first");
  process.exit(1);
}
const records: ModuleProofRecord[] = JSON.parse(readFileSync(PROOFS_PATH, "utf8"));
const results: Result[] = [];
for (const record of records.filter(
  (innerRecord) => filter === undefined || innerRecord.id.includes(filter),
)) {
  const path = join(CORPORA_DIRECTORY, record.id);
  // A module tla-ts can't load leaves each of its obligations absent, with the error as reason.
  const proved = await prove({
    source: readFileSync(path, "utf8"),
    loadModule: (name) =>
      readModule(join(dirname(path), `${name}.tla`)) ??
      readModule(libraryModules.get(name)) ??
      readModule(join(TLAPM_LIBRARY, `${name}.tla`)),
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
    const reason = proved instanceof TlaError ? proved.message : actual?.reason;
    results.push({
      module: record.id,
      id: expected.id,
      verdict: getVerdict(expected, actual),
      expected: getExpected(expected),
      ...(actual ? { actual: actual.status } : {}),
      ...(reason === undefined ? {} : { reason }),
    });
  });
}

writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
const counts = Map.groupBy(results, (result) => result.verdict);
console.log(
  (["agree", "missed", "unsound", "trivial", "absent"] as const)
    .map((verdict) => `${counts.get(verdict)?.length ?? 0} ${verdict}`)
    .join(", "),
);
// What tlapm proved and tla-ts didn't, by the prover tlapm used and what tla-ts reached.
const missed = Map.groupBy(
  counts.get("missed") ?? [],
  (result) => `${result.expected}, tla-ts ${result.actual}`,
);
[...missed].forEach((group) => console.log(`  missed ${group[0]}: ${group[1].length}`));
const shown = results.filter(
  (result) =>
    result.verdict === "unsound" || result.verdict === "trivial" || result.verdict === "absent",
);
(isVerbose ? shown : shown.slice(0, 20)).forEach((result) =>
  console.log(
    `${result.verdict} ${result.module} #${result.id}: tlapm ${result.expected}, tla-ts ${result.actual ?? "none"}${result.reason ? ` (${result.reason})` : ""}`,
  ),
);
