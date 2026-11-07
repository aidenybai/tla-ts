// Runs the suite against a host and compares each result with the oracle's recording.
// Usage: pnpm conformance [--host tla-ts|tlc|tlapm|"<command>"] [--shard <i>/<n>]
// [--time-limit <seconds>] [--memory-limit <MB>] [--update-baseline] [--verbose] [path filter]...
// The tlc and tlapm hosts are the oracles, and each runs only its own suite.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { dirname, join } from "node:path";
import { getHost, getSuiteCommand, HOSTS, runPool, runTest, type HostResult } from "./hosts";
import {
  findTests,
  getContexts,
  getRecording,
  getShard,
  type Recording,
  type SuiteTest,
} from "./test-file";
import { getBackend, getTlapmStatuses } from "./tlapm";
import { getMessageCodes } from "./transcript";

// From the coarsest difference to the finest, so a score can say how close a host is.
type Verdict =
  | "pass"
  | "text-mismatch"
  | "message-mismatch"
  | "exit-mismatch"
  | "time-limit"
  | "memory-limit"
  | "crash"
  | "unrecorded";

interface ResultEntry {
  id: string;
  verdict: Verdict;
  expected: Recording | undefined;
  actual: HostResult;
}

const WORKERS = Number(process.env.CONFORMANCE_WORKERS ?? Math.min(4, availableParallelism()));
const CRASH_EXIT = -1;

const args = process.argv.slice(2);
const getOption = (name: string) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args.splice(index, 2)[1];
};
const hasFlag = (name: string) => {
  const index = args.indexOf(name);
  if (index !== -1) args.splice(index, 1);
  return index !== -1;
};

const hostName = getOption("--host") ?? "tla-ts";
const shard = getOption("--shard");
const timeLimit = getOption("--time-limit");
const memoryLimit = getOption("--memory-limit");
const limits = {
  ...(timeLimit ? { milliseconds: Number(timeLimit) * 1000 } : {}),
  ...(memoryLimit ? { memoryBytes: Number(memoryLimit) * 1024 * 1024 } : {}),
};
const isUpdatingBaseline = hasFlag("--update-baseline");
const isVerbose = hasFlag("--verbose");
// A host given as a command has no baseline, and its results go in one file.
const hostLabel = hostName in HOSTS ? hostName : "custom";
const baselinePath = join(import.meta.dirname, "../baselines", `${hostLabel}.json`);
const baseline: Record<string, Verdict> = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, "utf8"))
  : {};

// The coarse part of a transcript: TLC's message codes, tlapm's obligation statuses, or a backend's
// verdict.
const getMessages = (test: SuiteTest, transcript: string) => {
  if (test.suite === "tlc") return getMessageCodes(transcript);
  return getBackend(test.path) ? transcript.split("\n")[0] : getTlapmStatuses(transcript);
};

const getVerdict = (
  test: SuiteTest,
  expected: Recording | undefined,
  actual: HostResult,
): Verdict => {
  if (!expected) return "unrecorded";
  if (actual.exceeded) return `${actual.exceeded}-limit`;
  if (actual.exit === CRASH_EXIT) return "crash";
  if (actual.exit !== expected.exit) return "exit-mismatch";
  const expectedTranscript = expected.transcript ?? "";
  if (getMessages(test, actual.transcript) !== getMessages(test, expectedTranscript))
    return "message-mismatch";
  return actual.transcript === expectedTranscript ? "pass" : "text-mismatch";
};

const host = getHost(hostName);
const tests = getShard(
  findTests(args).filter((test) => getSuiteCommand(host, test) !== undefined),
  shard,
);
const results: ResultEntry[] = [];

await runPool(tests, WORKERS, async (test) => {
  for (const context of getContexts(test)) {
    const actual = await runTest(host, test, context, limits);
    const expected = getRecording(test, context.name);
    results.push({
      id: context.name === "model" ? test.id : `${test.id}#${context.name}`,
      verdict: getVerdict(test, expected, actual),
      expected,
      actual,
    });
  }
  if (results.length % 500 < 5) console.log(`${results.length} runs`);
});
results.sort((left, right) => (left.id < right.id ? -1 : 1));

const resultsPath = join(import.meta.dirname, "../.results", `${hostLabel}.json`);
mkdirSync(dirname(resultsPath), { recursive: true });
writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);

const getTopic = (id: string) => id.split("/").slice(0, 3).join("/");
const topics = new Map<string, { passed: number; total: number }>();
results.forEach((result) => {
  const topic = topics.get(getTopic(result.id)) ?? { passed: 0, total: 0 };
  topic.total += 1;
  topic.passed += result.verdict === "pass" ? 1 : 0;
  topics.set(getTopic(result.id), topic);
});
[...topics.entries()]
  .sort((left, right) => (left[0] < right[0] ? -1 : 1))
  .forEach((entry) =>
    console.log(`${entry[0].padEnd(48)} ${String(entry[1].passed).padStart(6)}/${entry[1].total}`),
  );

const tally = results.reduce<Record<string, number>>((counts, result) => {
  counts[result.verdict] = (counts[result.verdict] ?? 0) + 1;
  return counts;
}, {});
const passed = tally.pass ?? 0;
console.log(
  `\n${hostLabel}: ${passed}/${results.length} pass (${results.length === 0 ? "no tests matched" : `${((passed / results.length) * 100).toFixed(1)}%`})`,
);
console.log(JSON.stringify(tally));

const failures = results.filter((result) => result.verdict !== "pass");
const regressions = failures.filter((result) => baseline[result.id] !== result.verdict);
const fixed = results.filter((result) => result.verdict === "pass" && result.id in baseline);

if (isVerbose) {
  failures.forEach((result) =>
    console.log(
      `\n--- ${result.id}: ${result.verdict}\nexpected exit ${result.expected?.exit}\n${result.expected?.transcript ?? ""}\nactual exit ${result.actual.exit}\n${result.actual.transcript}`,
    ),
  );
}

if (isUpdatingBaseline) {
  const isFiltered = args.length > 0 || shard !== undefined;
  const kept = isFiltered
    ? Object.entries(baseline).filter((entry) => !results.some((result) => result.id === entry[0]))
    : [];
  const updated = Object.fromEntries(
    [...kept, ...failures.map((result): [string, Verdict] => [result.id, result.verdict])].sort(
      (left, right) => (left[0] < right[0] ? -1 : 1),
    ),
  );
  mkdirSync(dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(updated).length} known failures to ${baselinePath}`);
  process.exit(0);
}

regressions.slice(0, 100).forEach((result) => console.log(`NEW ${result.verdict} ${result.id}`));
fixed.slice(0, 100).forEach((result) => console.log(`FIXED ${result.id}`));
console.log(`${regressions.length} not in the baseline, ${fixed.length} fixed since the baseline`);
process.exit(regressions.length === 0 && fixed.length === 0 ? 0 : 1);
