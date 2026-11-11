import { availableParallelism } from "node:os";
import { getHost, runPool, runTest } from "./hosts";
import {
  findTests,
  getContexts,
  getShard,
  isDeclaredOutcome,
  writeRecordings,
  type Recording,
} from "./test-file";

const WORKERS = Number(process.env.CONFORMANCE_WORKERS ?? Math.min(4, availableParallelism()));

const args = process.argv.slice(2);
const isMissingOnly = args.includes("--missing");
const shardIndex = args.indexOf("--shard");
const shard = shardIndex === -1 ? undefined : args.splice(shardIndex, 2)[1];
const tests = getShard(findTests(args.filter((arg) => arg !== "--missing")), shard).filter(
  (test) => !isMissingOnly || !test.recordings,
);
const oracles = new Map(
  [...new Set(tests.map((test) => test.suite))].map((suite) => [suite, getHost(suite)]),
);
const refused: string[] = [];
const progress = { done: 0, recorded: 0 };

await runPool(tests, WORKERS, async (test) => {
  const recordings: Record<string, Recording> = {};
  const host = oracles.get(test.suite);
  const refusals: string[] = host ? [] : [`${test.id}: no oracle for the ${test.suite} suite`];
  for (const context of host ? getContexts(test) : []) {
    const result = await runTest(host!, test, context);
    const isDeclared = isDeclaredOutcome(test, result);
    if (isDeclared === undefined)
      refusals.push(`${test.id}: unknown outcome ${test.metadata.outcome}`);
    if (isDeclared === false) {
      refusals.push(
        `${test.id} [${context.name}]: declares ${test.metadata.outcome}, ${test.suite} exited ${result.exit}\n${result.transcript}`,
      );
    }
    recordings[context.name] = {
      exit: result.exit,
      ...(result.transcript === "" ? {} : { transcript: result.transcript }),
    };
  }
  refused.push(...refusals);
  if (refusals.length === 0) {
    writeRecordings(test, recordings);
    progress.recorded += 1;
  }
  progress.done += 1;
  if (progress.done % 200 === 0) console.log(`${progress.done}/${tests.length}`);
});

refused.sort().forEach((line) => console.error(`REFUSED ${line}\n`));
console.log(`Recorded ${progress.recorded} of ${tests.length} tests`);
process.exit(refused.length === 0 ? 0 : 1);
