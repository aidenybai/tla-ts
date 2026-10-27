import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { parseModule, TlaConfigError, TlaSyntaxError, TlaUnsupportedError } from "../src";
import { parseConfig } from "../src/config";
import { createEnvironment } from "../src/environment";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, LIBRARY_DIRECTORIES } from "./corpora";
import type { SanyResult } from "./record-sany";

type Verdict = "match" | "accepted" | "rejected" | "unsupported";

interface ParseOutcome {
  status: "ok" | "error" | "unsupported";
  error: string | undefined;
}

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".sany-results.json");

const readModule = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : undefined);

// tla-ts checks a module the way SANY does when it builds the environment, before it needs a model,
// so an error about the missing configuration means it accepted the module.
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
        [dirname(path), ...LIBRARY_DIRECTORIES]
          .map((directory) => readModule(join(directory, `${name}.tla`)))
          .find((module) => module !== undefined),
      print: () => {},
      files: { readFile: undefined, writeFile: undefined },
    });
    return { status: "ok", error: undefined };
  } catch (error) {
    if (error instanceof TlaConfigError) return { status: "ok", error: undefined };
    if (error instanceof TlaUnsupportedError)
      return { status: "unsupported", error: error.message };
    if (error instanceof TlaSyntaxError) return { status: "error", error: error.message };
    return {
      status: "error",
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }
};

const getVerdict = (expected: SanyResult, actual: ParseOutcome): Verdict => {
  if (actual.status === "unsupported") return "unsupported";
  if (actual.status === expected.status) return "match";
  return actual.status === "ok" ? "accepted" : "rejected";
};

const filter = process.argv[process.argv.indexOf("--filter") + 1];
const expected: SanyResult[] = JSON.parse(
  readFileSync(join(CONFORMANCE_DIRECTORY, "sany.json"), "utf8"),
);
const results = expected
  .filter((result) => !process.argv.includes("--filter") || result.id.includes(filter))
  .map((result) => {
    const actual = analyze(join(CORPORA_DIRECTORY, result.id));
    const verdict = getVerdict(result, actual);
    if (verdict !== "match") {
      console.log(`${verdict.padEnd(11)} ${result.id}`);
      console.log(
        `  SANY:   ${(result.error ?? "ok").split("\n").find((line) => line.trim()) ?? ""}`,
      );
      console.log(`  tla-ts: ${actual.error ?? "ok"}`);
    }
    return { id: result.id, verdict, expected: result.error, actual: actual.error };
  });
writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
const counts = new Map<Verdict, number>();
results.forEach((result) => counts.set(result.verdict, (counts.get(result.verdict) ?? 0) + 1));
console.log("");
counts.forEach((count, verdict) => console.log(`${verdict}: ${count}`));
console.log(`modules: ${results.length} (${basename(RESULTS_PATH)} has the details)`);
