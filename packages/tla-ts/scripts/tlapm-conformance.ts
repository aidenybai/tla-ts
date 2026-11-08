import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { TlaUnsupportedError } from "../src/errors";
import type { PrintedObligation } from "../src/obligations";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, getOption, writeResults } from "./corpora";
import { getModuleObligations } from "./proof-records";
import {
  collapseWhitespace,
  getDigest,
  TLAPM_PATH,
  TLAPM_TEXT_PATH,
  type TlapmDigest,
  type TlapmObligation,
  type TlapmResult,
} from "./tlapm-digest";

type Verdict = "match" | "layout" | "mismatch" | "accepted" | "rejected" | "unsupported";

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".tlapm-results.json");

interface Outcome {
  status: "ok" | "error" | "unsupported";
  error?: string;
  obligations: PrintedObligation[];
}

const analyze = (path: string): Outcome => {
  try {
    return { status: "ok", obligations: getModuleObligations(path) };
  } catch (error) {
    if (error instanceof TlaUnsupportedError)
      return { status: "unsupported", error: error.message, obligations: [] };
    return {
      status: "error",
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      obligations: [],
    };
  }
};

const isSameText = (expected: TlapmObligation | undefined, actual: PrintedObligation | undefined) =>
  expected !== undefined &&
  actual !== undefined &&
  expected.loc === actual.location &&
  expected.text === getDigest(collapseWhitespace(actual.text));

const findDifference = (expected: TlapmDigest, actual: Outcome, texts: TlapmResult | undefined) => {
  const expectedObligations = expected.obligations ?? [];
  const count = Math.max(expectedObligations.length, actual.obligations.length);
  for (let index = 0; index < count; index++) {
    const left = expectedObligations[index];
    const right = actual.obligations[index];
    if (isSameText(left, right)) continue;
    return {
      index,
      expected: left && { loc: left.loc, text: texts?.obligations?.[index]?.text },
      actual: right && { loc: right.location, text: right.text },
    };
  }
  return undefined;
};

const getVerdict = (expected: TlapmDigest, actual: Outcome): Verdict => {
  if (actual.status === "unsupported") return "unsupported";
  if (actual.status !== expected.status) return actual.status === "ok" ? "accepted" : "rejected";
  const expectedObligations = expected.obligations ?? [];
  if (
    expectedObligations.length !== actual.obligations.length ||
    !expectedObligations.every((obligation, index) =>
      isSameText(obligation, actual.obligations[index]),
    )
  )
    return "mismatch";
  // The recording trims the end of each obligation.
  const isLayoutSame = expectedObligations.every(
    (obligation, index) =>
      obligation.layout === getDigest(actual.obligations[index].text.trimEnd()),
  );
  return isLayoutSame ? "match" : "layout";
};

const filter = getOption("--filter");
const isVerbose = process.argv.includes("--verbose");
const expected: TlapmDigest[] = JSON.parse(readFileSync(TLAPM_PATH, "utf8"));
const recorded: TlapmResult[] = existsSync(TLAPM_TEXT_PATH)
  ? JSON.parse(readFileSync(TLAPM_TEXT_PATH, "utf8"))
  : [];
const texts = new Map(recorded.map((result) => [result.id, result]));
const results = expected
  .filter((result) => filter === undefined || result.id.includes(filter))
  .map((result) => {
    const actual = analyze(join(CORPORA_DIRECTORY, result.id));
    const verdict = getVerdict(result, actual);
    const difference =
      verdict === "mismatch" || verdict === "layout"
        ? findDifference(result, actual, texts.get(result.id))
        : undefined;
    if (verdict !== "match") {
      console.log(`${verdict.padEnd(11)} ${result.id}`);
      if (verdict === "accepted" || verdict === "rejected" || verdict === "unsupported") {
        console.log(`  tlapm:  ${(result.error ?? "ok").split("\n")[0]}`);
        console.log(`  tla-ts: ${actual.error ?? "ok"}`);
      }
      if (difference && isVerbose) {
        console.log(`  obligation ${difference.index + 1}`);
        console.log(
          `  tlapm ${difference.expected?.loc ?? "none"}:\n${difference.expected?.text ?? ""}`,
        );
        console.log(
          `  tla-ts ${difference.actual?.loc ?? "none"}:\n${difference.actual?.text ?? ""}`,
        );
      }
    }
    return { id: result.id, verdict, error: actual.error, difference };
  });
writeResults(RESULTS_PATH, results);
console.log("");
Map.groupBy(results, (result) => result.verdict).forEach((group, verdict) =>
  console.log(`${verdict}: ${group.length}`),
);
console.log(`modules: ${results.length} (${basename(RESULTS_PATH)} has the details)`);
