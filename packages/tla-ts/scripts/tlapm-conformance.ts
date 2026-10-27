import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { TlaUnsupportedError } from "../src/errors";
import { getObligations, type PrintedObligation } from "../src/obligations";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, getLibraryModules } from "./corpora";
import {
  collapseWhitespace,
  getDigest,
  TLAPM_PATH,
  TLAPM_TEXT_PATH,
  type TlapmDigest,
  type TlapmResult,
} from "./tlapm-digest";

type Verdict = "match" | "layout" | "mismatch" | "accepted" | "rejected" | "unsupported";

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".tlapm-results.json");

const libraryModules = getLibraryModules();

// tlapm searches the module's directory, then the -I library, then its own standard library.
const TLAPM_LIBRARY = join(CORPORA_DIRECTORY, "tlapm/library");

const readModule = (path: string | undefined) =>
  path !== undefined && existsSync(path)
    ? { file: path, source: readFileSync(path, "utf8") }
    : undefined;

interface Outcome {
  status: "ok" | "error" | "unsupported";
  error?: string;
  obligations: PrintedObligation[];
}

const analyze = (path: string): Outcome => {
  try {
    const results = getObligations(
      [{ file: path, source: readFileSync(path, "utf8") }],
      (name) =>
        readModule(join(dirname(path), `${name}.tla`)) ??
        readModule(libraryModules.get(name)) ??
        readModule(join(TLAPM_LIBRARY, `${name}.tla`)),
    );
    // A submodule reports its own obligations, before the module that contains it.
    return { status: "ok", obligations: results.flatMap((result) => result.obligations) };
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

// The first obligation whose location or text differs, with both texts when the full recording is
// available.
const findDifference = (expected: TlapmDigest, actual: Outcome, texts: TlapmResult | undefined) => {
  const expectedObligations = expected.obligations ?? [];
  const count = Math.max(expectedObligations.length, actual.obligations.length);
  for (let index = 0; index < count; index++) {
    const left = expectedObligations[index];
    const right = actual.obligations[index];
    const isSame =
      left !== undefined &&
      right !== undefined &&
      left.loc === right.location &&
      left.text === getDigest(collapseWhitespace(right.text));
    if (isSame) continue;
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
  if (expectedObligations.length !== actual.obligations.length) return "mismatch";
  const isTextSame = expectedObligations.every(
    (obligation, index) =>
      obligation.loc === actual.obligations[index].location &&
      obligation.text === getDigest(collapseWhitespace(actual.obligations[index].text)),
  );
  if (!isTextSame) return "mismatch";
  // The recording trims the end of each obligation.
  const isLayoutSame = expectedObligations.every(
    (obligation, index) =>
      obligation.layout === getDigest(actual.obligations[index].text.trimEnd()),
  );
  return isLayoutSame ? "match" : "layout";
};

const filter = process.argv.includes("--filter")
  ? process.argv[process.argv.indexOf("--filter") + 1]
  : undefined;
const isVerbose = process.argv.includes("--verbose");
const expected: TlapmDigest[] = JSON.parse(readFileSync(TLAPM_PATH, "utf8"));
const texts = new Map<string, TlapmResult>(
  existsSync(TLAPM_TEXT_PATH)
    ? (JSON.parse(readFileSync(TLAPM_TEXT_PATH, "utf8")) as TlapmResult[]).map((result) => [
        result.id,
        result,
      ])
    : [],
);
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
writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
const counts = new Map<Verdict, number>();
results.forEach((result) => counts.set(result.verdict, (counts.get(result.verdict) ?? 0) + 1));
console.log("");
counts.forEach((count, verdict) => console.log(`${verdict}: ${count}`));
console.log(`modules: ${results.length} (${basename(RESULTS_PATH)} has the details)`);
