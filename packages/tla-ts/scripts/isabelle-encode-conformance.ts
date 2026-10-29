// Compares tla-ts's Isabelle theory for each obligation with the theory tlapm wrote, as
// conformance:record-proofs recorded it, up to comments and the theory's name.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TlaProverError, TlaUnsupportedError } from "../src/errors";
import { getObligations } from "../src/obligations";
import { encodeForBackend } from "../src/prove/prove";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY } from "./corpora";
import {
  getIsabelleDigest,
  getModuleLoader,
  normalizeTheory,
  printResults,
  PROOF_INPUTS_DIRECTORY,
  readProofRecords,
} from "./proof-records";

type Verdict = "match" | "mismatch" | "unsupported" | "failed";

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".isabelle-encode-results.json");

// How much of each theory to show around the first difference.
const CONTEXT_LENGTH = 150;

interface Result {
  module: string;
  id: number;
  verdict: Verdict;
  reason?: string;
  expected?: string;
  actual?: string;
}

// The theory, or why tla-ts can't encode the obligation or tlapm wouldn't.
const getEncoding = (encode: () => string) => {
  try {
    return { kind: "theory", text: encode() } as const;
  } catch (error) {
    if (error instanceof TlaUnsupportedError)
      return { kind: "unsupported", reason: error.message } as const;
    if (error instanceof TlaProverError) return { kind: "failed", reason: error.message } as const;
    throw error;
  }
};

// The two normalized theories from just before the first character where they differ.
const findDifference = (expected: string, actual: string) => {
  const left = normalizeTheory(expected);
  const right = normalizeTheory(actual);
  const index = [...left].findIndex((character, position) => character !== right[position]);
  const start = Math.max(0, (index === -1 ? left.length : index) - CONTEXT_LENGTH / 3);
  return {
    expected: left.slice(start, start + CONTEXT_LENGTH),
    actual: right.slice(start, start + CONTEXT_LENGTH),
  };
};

const results = readProofRecords()
  .filter((record) =>
    record.obligations.some(
      (obligation) => obligation.status !== "trivial" && "isabelle" in obligation,
    ),
  )
  .flatMap((record): Result[] => {
    const path = join(CORPORA_DIRECTORY, record.id);
    const loadModule = getModuleLoader(path);
    const obligations = new Map(
      getObligations([{ file: path, source: readFileSync(path, "utf8") }], (name) => {
        const source = loadModule(name);
        return source === undefined ? undefined : { file: name, source };
      })
        .flatMap((result) => result.obligations)
        .map((obligation) => [obligation.id, obligation]),
    );
    return record.obligations.flatMap((expected): Result[] => {
      if (expected.status === "trivial" || !("isabelle" in expected) || !expected.isabelle)
        return [];
      const base = { module: record.id, id: expected.id };
      const obligation = obligations.get(expected.id);
      if (!obligation || obligation.kind.kind === "Error")
        return [{ ...base, verdict: "mismatch", reason: "tla-ts has no such obligation" }];
      const encoded = getEncoding(() =>
        encodeForBackend(obligation, "isabelle", { caseErrors: 0 }),
      );
      const inputPath = join(PROOF_INPUTS_DIRECTORY, record.id, `${expected.id}.thy`);
      // tlapm writes a theory as it prints it, so one whose printing fails stops before its end.
      if (
        encoded.kind === "failed" &&
        existsSync(inputPath) &&
        !/\nend\s*$/.test(readFileSync(inputPath, "utf8"))
      )
        return [{ ...base, verdict: "match" }];
      if (encoded.kind !== "theory")
        return [{ ...base, verdict: encoded.kind, reason: encoded.reason }];
      if (getIsabelleDigest(encoded.text) === expected.isabelle.input)
        return [{ ...base, verdict: "match" }];
      if (!existsSync(inputPath)) return [{ ...base, verdict: "mismatch" }];
      return [
        {
          ...base,
          verdict: "mismatch",
          ...findDifference(readFileSync(inputPath, "utf8"), encoded.text),
        },
      ];
    });
  });

writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
printResults(
  results,
  ["match", "mismatch", "unsupported", "failed"],
  ["mismatch", "unsupported", "failed"],
  (result) =>
    [
      `${result.verdict} ${result.module} #${result.id}${result.reason ? `: ${result.reason}` : ""}`,
      ...(result.expected === undefined ? [] : [`  tlapm:  ${result.expected}`]),
      ...(result.actual === undefined ? [] : [`  tla-ts: ${result.actual}`]),
    ].join("\n"),
);
