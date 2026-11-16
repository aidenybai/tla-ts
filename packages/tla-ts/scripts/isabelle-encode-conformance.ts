import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TlaProverError, TlaUnsupportedError } from "../src/errors";
import { encodeForBackend } from "../src/prover/prove";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, writeResults } from "./corpora";
import {
  describeEncodeResult,
  getIsabelleDigest,
  getObligationsById,
  normalizeTheory,
  printResults,
  PROOF_INPUTS_DIRECTORY,
  readProofRecords,
  type EncodeResult,
} from "./proof-records";

type Result = EncodeResult<"match" | "mismatch" | "unsupported" | "failed">;

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".isabelle-encode-results.json");

const CONTEXT_LENGTH = 150;

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
    const obligations = getObligationsById(join(CORPORA_DIRECTORY, record.id));
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

writeResults(RESULTS_PATH, results);
printResults(
  results,
  ["match", "mismatch", "unsupported", "failed"],
  ["mismatch", "unsupported", "failed"],
  describeEncodeResult,
);
