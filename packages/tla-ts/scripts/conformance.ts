import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ModelOutcome } from "./check-model";
import { CONFORMANCE_DIRECTORY, EXPECTED_PATH, findModels } from "./corpora";
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

const getArgument = (name: string) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const maximumTlcMilliseconds = Number(getArgument("--max-tlc-ms") ?? 20000);
const filter = getArgument("--filter");
const isUpdate = process.argv.includes("--update");

export const compareOutcome = (
  expected: ExpectedResult,
  actual: ModelOutcome,
): string | undefined => {
  if (expected.status === "error")
    return actual.status === "error" ? undefined : `expected an error, got ${actual.status}`;
  if (actual.status !== expected.status) {
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
    .filter((field) => !(field === "traceLength" && expected.status === "liveness-violation"))
    .filter((field) => expected[field] !== undefined && expected[field] !== actual[field])
    .map((field) => `${field}: expected ${expected[field]}, got ${actual[field]}`);
  return differences.length > 0 ? differences.join("; ") : undefined;
};

const runModel = (specPath: string, configPath: string) =>
  new Promise<ModelOutcome | undefined>((resolve) => {
    const child = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "--stack-size=8000",
        join(import.meta.dirname, "check-model.ts"),
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
const models = findModels().filter((model) => {
  const expected = expectedById.get(model.id);
  return (
    expected !== undefined &&
    expected.tlcMilliseconds <= maximumTlcMilliseconds &&
    (filter === undefined || model.id.includes(filter))
  );
});

const results: ConformanceResult[] = [];
const queue = { next: 0 };

const work = async () => {
  while (queue.next < models.length) {
    const model = models[queue.next++];
    const expected = expectedById.get(model.id);
    if (!expected) continue;
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
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, work));
results.sort((left, right) => (left.id < right.id ? -1 : 1));
writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);

const counts = results.reduce<Record<string, number>>((tally, result) => {
  tally[result.verdict] = (tally[result.verdict] ?? 0) + 1;
  return tally;
}, {});
console.log(
  `\n${Object.entries(counts)
    .map(([verdict, count]) => `${verdict}: ${count}`)
    .join(", ")}`,
);

if (isUpdate) {
  const passing = results.filter((result) => result.verdict === "match").map((result) => result.id);
  writeFileSync(PASSING_PATH, `${JSON.stringify(passing, null, 2)}\n`);
  console.log(`Wrote ${passing.length} passing models to ${PASSING_PATH}`);
}
