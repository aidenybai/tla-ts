// Records a test262 run from the runner's --verbose output: the count for the website's chart, and
// the tests that pass. A test that passed in the last recorded run and no longer does stops the
// record, unless the corpus dropped it.
// Usage: bun scripts/run.ts record-test262 <output files>

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { CONFORMANCE_DIRECTORY, listTest262Files, TEST262_DIRECTORY } from "./corpora";

interface Test262Run {
  date: string;
  passed: number;
  total: number;
}

const RUNS_PATH = join(CONFORMANCE_DIRECTORY, "test262-runs.json");
const PASSING_PATH = join(CONFORMANCE_DIRECTORY, "test262-passing.txt");

const lines = process.argv.slice(2).flatMap((path) => readFileSync(path, "utf8").split("\n"));
const wrongCount = lines.filter((line) => line.startsWith("WRONG ")).length;
if (wrongCount > 0) {
  console.error(`Not recorded: ${wrongCount} tests are WRONG.`);
  process.exit(1);
}

const tests = new Set(listTest262Files().map((path) => relative(TEST262_DIRECTORY, path)));
const passing = new Set(
  lines.filter((line) => line.startsWith("PASS ")).map((line) => line.slice("PASS ".length)),
);
const lost = existsSync(PASSING_PATH)
  ? readFileSync(PASSING_PATH, "utf8")
      .split("\n")
      .filter((id) => tests.has(id) && !passing.has(id))
  : [];
if (lost.length > 0) {
  console.error(`Not recorded: ${lost.length} tests passed in the last run and no longer do.`);
  lost.forEach((id) => console.error(`  ${id}`));
  process.exit(1);
}

const runs: Test262Run[] = JSON.parse(readFileSync(RUNS_PATH, "utf8"));
const run = {
  date: new Date().toISOString().slice(0, 10),
  passed: passing.size,
  total: tests.size,
};
writeFileSync(RUNS_PATH, `${JSON.stringify([...runs, run], null, 2)}\n`);
writeFileSync(PASSING_PATH, `${[...passing].sort().join("\n")}\n`);
console.log(`Recorded ${run.passed} of ${run.total} tests passing on ${run.date}.`);
