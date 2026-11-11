import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ModelOutcome } from "./check-model";
import {
  CONFORMANCE_DIRECTORY,
  EXPECTED_PATH,
  findModels,
  getOption,
  runConcurrently,
  sortById,
  writeResults,
  type CorpusModel,
} from "./corpora";
import type { ExpectedResult } from "./record-tlc";

type Verdict = "match" | "mismatch" | "unsupported" | "crash";

interface ConformanceResult {
  id: string;
  verdict: Verdict;
  expected: ExpectedResult;
  actual: ModelOutcome | undefined;
  detail: string | undefined;
}

const CONCURRENCY = 4;
const PASSING_PATH = join(CONFORMANCE_DIRECTORY, "passing.json");
const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".results.json");

const maximumTlcMilliseconds = Number(getOption("--max-tlc-ms") ?? 20000);
const filter = getOption("--filter");

const EXIT_STATUSES: Record<string, string> = {
  "postcondition-violation": "assumption-violation",
};

const getExitStatus = (status: string) => EXIT_STATUSES[status] ?? status;

const compareOutcome = (expected: ExpectedResult, actual: ModelOutcome) => {
  if (expected.status === "error")
    return actual.status === "error" ? undefined : `expected an error, got ${actual.status}`;
  if (getExitStatus(actual.status) !== expected.status) {
    return `expected ${expected.status}, got ${actual.status}${actual.error ? ` (${actual.error})` : ""}`;
  }
  const fields = [
    "violation",
    "generatedStates",
    "distinctStates",
    "depth",
    "traceLength",
  ] as const;
  const differences = fields
    .filter((field) => expected[field] !== undefined && expected[field] !== actual[field])
    .map((field) => `${field}: expected ${expected[field]}, got ${actual[field]}`);
  return differences.length > 0 ? differences.join("; ") : undefined;
};

const runModel = (specPath: string, configPath: string) =>
  new Promise<ModelOutcome | undefined>((resolve) => {
    const child = spawn(
      process.execPath,
      [
        "--stack-size=8000",
        "--max-old-space-size=6144",
        join(import.meta.dirname, "check-model.js"),
        specPath,
        configPath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("close", () => {
      const output = Buffer.concat(chunks).toString("utf8");
      resolve(output.startsWith("{") ? JSON.parse(output) : undefined);
    });
  });

const expectedResults: ExpectedResult[] = JSON.parse(readFileSync(EXPECTED_PATH, "utf8"));
const expectedById = new Map(expectedResults.map((result) => [result.id, result]));
const isLarge = (model: CorpusModel) =>
  (expectedById.get(model.id)?.tlcMilliseconds ?? 0) > maximumTlcMilliseconds;

const models = findModels().filter((model) => {
  const expected = expectedById.get(model.id);
  return (
    expected !== undefined &&
    (expected.status !== "error" || !isLarge(model)) &&
    (filter === undefined || model.id.includes(filter))
  );
});

const results: ConformanceResult[] = [];

const checkModel = async (model: CorpusModel) => {
  const expected = expectedById.get(model.id);
  if (!expected) return;
  const actual = await runModel(model.specPath, model.configPath);
  const detail = actual ? compareOutcome(expected, actual) : "the checker crashed";
  const verdict: Verdict = !actual
    ? "crash"
    : actual.status === "unsupported"
      ? "unsupported"
      : detail
        ? "mismatch"
        : "match";
  results.push({ id: model.id, verdict, expected, actual, detail: detail ?? actual?.error });
  console.log(
    `[${results.length}/${models.length}] ${verdict.padEnd(11)} ${model.id}${verdict === "match" ? "" : `  ${detail ?? actual?.error ?? ""}`}`,
  );
};

await runConcurrently(
  models.filter((model) => !isLarge(model)),
  CONCURRENCY,
  checkModel,
);
await runConcurrently(models.filter(isLarge), 1, checkModel);
writeResults(RESULTS_PATH, sortById(results));

const counts = results.reduce<Record<string, number>>((tally, result) => {
  tally[result.verdict] = (tally[result.verdict] ?? 0) + 1;
  return tally;
}, {});
console.log(
  `\n${Object.entries(counts)
    .map(([verdict, count]) => `${verdict}: ${count}`)
    .join(", ")}`,
);

if (process.argv.includes("--update")) {
  const passing = results.filter((result) => result.verdict === "match").map((result) => result.id);
  writeResults(PASSING_PATH, passing);
  console.log(`Wrote ${passing.length} passing models to ${PASSING_PATH}`);
}
