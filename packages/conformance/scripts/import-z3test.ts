// Ports z3test's SMT-LIB regressions into test/tlapm/backends/z3/z3test, recorded from the pinned
// Z3. z3test checks a regression by comparing all that Z3 prints with its .expected.out file, so a
// test is kept only if Z3 prints exactly that, and does so on two runs.
// Usage: bun scripts/run.ts import-z3test <z3test checkout>

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { availableParallelism } from "node:os";
import { dirname, join, relative } from "node:path";
import { getHost, runPool, runTest } from "./hosts";
import { BACKEND_VERDICTS } from "./tlapm";
import { formatYaml, parseTest, SUITE_DIRECTORY, writeRecordings } from "./test-file";

const WORKERS = Number(process.env.CONFORMANCE_WORKERS ?? Math.min(2, availableParallelism()));
// z3test gives each regression 60 seconds (scripts/test_benchmark.py).
const LIMITS = { milliseconds: 60_000, memoryBytes: 4 * 1024 ** 3 };
const IMPORT_DIRECTORY = join(SUITE_DIRECTORY, "tlapm/backends/z3/z3test");
// The directories z3test's harness reads as SMT-LIB regressions. The others hold API tests in C++,
// C# and Python, which no SMT backend runs.
const REGRESSION_DIRECTORIES = ["regressions", "old-regressions"];
// A script that sets a time limit can print a different answer on a slower machine.
const TIME_DEPENDENT = /:timeout|\btimeout=|\btry-for\b|:soft_timeout/;

const checkout = process.argv[2];
if (!checkout || !existsSync(join(checkout, "regressions"))) {
  console.error("Usage: bun scripts/run.ts import-z3test <z3test checkout>");
  process.exit(1);
}

const listFiles = (directory: string): string[] =>
  readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? listFiles(path) : [path];
    });

const getExpectedOutput = (path: string) =>
  readFileSync(path.replace(/\.smt2$/, ".expected.out"), "utf8")
    .replaceAll("\r\n", "\n")
    .trimEnd();

const scripts = REGRESSION_DIRECTORIES.flatMap((directory) =>
  listFiles(join(checkout, directory)).filter(
    (path) => path.endsWith(".smt2") && existsSync(path.replace(/\.smt2$/, ".expected.out")),
  ),
);
const skipped: string[] = [];
const getTestPath = (script: string) => join(IMPORT_DIRECTORY, relative(checkout, script));

rmSync(IMPORT_DIRECTORY, { recursive: true, force: true });
const pendingScripts = scripts.filter((script) => {
  if (!TIME_DEPENDENT.test(readFileSync(script, "utf8"))) return true;
  skipped.push(`${relative(checkout, script)}: sets a time limit`);
  return false;
});
pendingScripts.forEach((script) => {
  const firstLine = getExpectedOutput(script).split("\n")[0];
  const metadata = {
    description: `z3test's regression ${relative(checkout, script)}.`,
    ref: relative(checkout, script),
    features: ["z3test"],
    outcome: BACKEND_VERDICTS.includes(firstLine) ? firstLine : "any",
  };
  mkdirSync(dirname(getTestPath(script)), { recursive: true });
  writeFileSync(
    getTestPath(script),
    `(*---\n${formatYaml(metadata)}\n---*)\n${readFileSync(script, "utf8")}`,
  );
});

const host = getHost("tlapm");
const keptCount = { value: 0 };

await runPool(pendingScripts, WORKERS, async (script) => {
  const path = getTestPath(script);
  const test = parseTest(path, readFileSync(path, "utf8"));
  if (!test) return;
  const context = { name: "model", source: test.source, config: "" };
  const first = await runTest(host, test, context, LIMITS);
  const second = first.exceeded ? first : await runTest(host, test, context, LIMITS);
  const reason = first.exceeded
    ? `exceeds the importer's ${first.exceeded} limit`
    : first.transcript !== second.transcript
      ? "gives different results on two runs"
      : first.transcript !== getExpectedOutput(script)
        ? "Z3 prints other output than z3test expects"
        : undefined;
  if (reason) {
    skipped.push(`${relative(checkout, script)}: ${reason}`);
    rmSync(path);
    return;
  }
  writeRecordings(test, {
    model: {
      exit: first.exit,
      ...(first.transcript === "" ? {} : { transcript: first.transcript }),
    },
  });
  keptCount.value++;
});

skipped.sort().forEach((line) => console.log(`SKIPPED ${line}`));
console.log(`Imported ${keptCount.value} of ${scripts.length} z3test regressions`);
