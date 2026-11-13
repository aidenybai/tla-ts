import { getHost, runPool, runTest, WORKERS } from "./hosts";
import {
  findTests,
  getContexts,
  getShard,
  isDeclaredOutcome,
  writeRecordings,
  type Recording,
} from "./test-file";

const args = process.argv.slice(2);
const isMissingOnly = args.includes("--missing");
const shardIndex = args.indexOf("--shard");
const shard = shardIndex === -1 ? undefined : args.splice(shardIndex, 2)[1];
const tests = getShard(findTests(args.filter((arg) => arg !== "--missing")), shard).filter(
  (test) => !isMissingOnly || !test.recordings,
);
const refused: string[] = [];
let doneCount = 0;
let recordedCount = 0;

await runPool(tests, WORKERS, async (test) => {
  const recordings: Record<string, Recording> = {};
  const host = getHost(test.suite);
  const refusals: string[] = [];
  for (const context of getContexts(test)) {
    const result = await runTest(host, test, context);
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
    recordedCount += 1;
  }
  doneCount += 1;
  if (doneCount % 200 === 0) console.log(`${doneCount}/${tests.length}`);
});

refused.sort().forEach((line) => console.error(`REFUSED ${line}\n`));
console.log(`Recorded ${recordedCount} of ${tests.length} tests`);
process.exit(refused.length === 0 ? 0 : 1);
