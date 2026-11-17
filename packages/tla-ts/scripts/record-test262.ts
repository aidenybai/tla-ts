// Records a test262 run for the website's chart, from the runner's --verbose output.
// Usage: bun scripts/run.ts record-test262 <output files>

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONFORMANCE_DIRECTORY, listTest262Files } from "./corpora";

interface Test262Run {
  date: string;
  passed: number;
  total: number;
}

const RUNS_PATH = join(CONFORMANCE_DIRECTORY, "test262-runs.json");

const lines = process.argv.slice(2).flatMap((path) => readFileSync(path, "utf8").split("\n"));
const wrongCount = lines.filter((line) => line.startsWith("WRONG ")).length;
if (wrongCount > 0) {
  console.error(`Not recorded: ${wrongCount} tests are WRONG.`);
  process.exit(1);
}

const runs: Test262Run[] = JSON.parse(readFileSync(RUNS_PATH, "utf8"));
const run = {
  date: new Date().toISOString().slice(0, 10),
  passed: lines.filter((line) => line.startsWith("PASS ")).length,
  total: listTest262Files().length,
};
writeFileSync(RUNS_PATH, `${JSON.stringify([...runs, run], null, 2)}\n`);
console.log(`Recorded ${run.passed} of ${run.total} tests passing on ${run.date}.`);
