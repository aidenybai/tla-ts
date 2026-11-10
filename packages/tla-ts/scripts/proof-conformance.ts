import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  type Module,
  parseModule,
  TlaConfigError,
  TlaEvaluationError,
  TlaSyntaxError,
  TlaUnsupportedError,
} from "../src";
import { parseConfig } from "../src/config";
import { createEnvironment } from "../src/environment";
import {
  CONFORMANCE_DIRECTORY,
  CORPORA_DIRECTORY,
  getLibraryModules,
  getOption,
  reportModuleResults,
} from "./corpora";
import { digestParsed, type ModuleDigest } from "./proof-digest";
import type { SanyResult } from "./record-sany";

type Verdict = "match" | "accepted" | "rejected" | "unsupported" | "digest";

interface ParseOutcome {
  status: "ok" | "error" | "unsupported";
  error: string | undefined;
  module?: ModuleDigest;
}

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".sany-results.json");

const readModule = (path: string | undefined) =>
  path !== undefined && existsSync(path) ? readFileSync(path, "utf8") : undefined;

const libraryModules = getLibraryModules();

const getDigest = (module: Module) => {
  const digest = digestParsed(module);
  return digest.units.length === 0 && digest.modules.length === 0 ? undefined : digest;
};

const getRangeStart = (range: string | undefined) =>
  (range ?? "0:0").split("-")[0].split(":").map(Number);

const sortUnits = (digest: ModuleDigest): ModuleDigest => ({
  name: digest.name,
  units: [...digest.units].sort((left, right) => {
    const [leftLine, leftColumn] = getRangeStart(left.range);
    const [rightLine, rightColumn] = getRangeStart(right.range);
    return leftLine - rightLine || leftColumn - rightColumn;
  }),
  modules: digest.modules.map(sortUnits),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const findDifference = (expected: unknown, actual: unknown, path: string): string | undefined => {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return undefined;
  if (!isRecord(expected) || !isRecord(actual)) {
    const describe = (value: unknown) => JSON.stringify(value)?.slice(0, 200);
    return `${path}: SANY ${describe(expected)}, tla-ts ${describe(actual)}`;
  }
  return [...new Set([...Object.keys(expected), ...Object.keys(actual)])]
    .map((key) => findDifference(expected[key], actual[key], `${path}.${key}`))
    .find((difference) => difference !== undefined);
};

const getDigestDifference = (expected: SanyResult, actual: ParseOutcome) =>
  findDifference(
    expected.module && JSON.parse(JSON.stringify(sortUnits(expected.module))),
    actual.module && JSON.parse(JSON.stringify(sortUnits(actual.module))),
    "module",
  );

const analyze = (path: string): ParseOutcome => {
  const source = readFileSync(path, "utf8");
  try {
    const moduleName = parseModule(source).name;
    if (moduleName !== basename(path, ".tla")) {
      return {
        status: "error",
        error: `File name '${basename(path, ".tla")}' does not match the name '${moduleName}' of the top level module it contains.`,
      };
    }
    createEnvironment(parseConfig(""), {
      source,
      loadModule: (name) =>
        readModule(join(dirname(path), `${name}.tla`)) ?? readModule(libraryModules.get(name)),
      print: () => {},
      files: { readFile: undefined, writeFile: undefined },
    });
  } catch (error) {
    if (error instanceof TlaUnsupportedError)
      return { status: "unsupported", error: error.message };
    if (error instanceof TlaSyntaxError) return { status: "error", error: error.message };
    if (!(error instanceof TlaConfigError) && !(error instanceof TlaEvaluationError))
      return {
        status: "error",
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      };
  }
  return { status: "ok", error: undefined, module: getDigest(parseModule(source)) };
};

const getVerdict = (expected: SanyResult, actual: ParseOutcome): Verdict => {
  if (actual.status === "unsupported") return "unsupported";
  if (actual.status === "ok" && expected.status === "ok" && getDigestDifference(expected, actual)) {
    return "digest";
  }
  if (actual.status === expected.status) return "match";
  return actual.status === "ok" ? "accepted" : "rejected";
};

const filter = getOption("--filter");
const expected: SanyResult[] = JSON.parse(
  readFileSync(join(CONFORMANCE_DIRECTORY, "sany.json"), "utf8"),
);
const results = expected
  .filter((result) => filter === undefined || result.id.includes(filter))
  .map((result) => {
    const actual = analyze(join(CORPORA_DIRECTORY, result.id));
    const verdict = getVerdict(result, actual);
    const difference = verdict === "digest" ? getDigestDifference(result, actual) : undefined;
    if (verdict !== "match") console.log(`${verdict.padEnd(11)} ${result.id}`);
    if (difference) console.log(`  ${difference}`);
    if (verdict !== "match" && !difference) {
      console.log(
        `  SANY:   ${(result.error ?? "ok").split("\n").find((line) => line.trim()) ?? ""}`,
      );
      console.log(`  tla-ts: ${actual.error ?? "ok"}`);
    }
    return { id: result.id, verdict, expected: result.error, actual: actual.error, difference };
  });
reportModuleResults(RESULTS_PATH, results);
