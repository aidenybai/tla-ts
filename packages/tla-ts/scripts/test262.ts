// Runs test262 through the TypeScript compiler. Tests that Node fails or that aren't valid
// TypeScript are skipped, not blamed on the compiler.
// Usage: bun scripts/run.ts test262 [--verbose] [test path prefixes]

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { runInNewContext, Script } from "node:vm";
import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../src/errors";
import { check } from "../src/parallel";
import { compile } from "../src/typescript/compile";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, listFiles } from "./corpora";

type Outcome = "pass" | "wrong" | "untranslatable" | "skipped";

interface TestRun {
  id: string;
  outcome: Outcome;
  reason: string;
}

interface Metadata {
  includes: string[];
  flags: string[];
  isNegative: boolean;
  isSyntaxError: boolean;
}

const TEST_DIRECTORY = join(CORPORA_DIRECTORY, "test262", "test");

const HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-harness.ts"), "utf8");

// Compiled TypeScript is a strict mode module.
const SKIPPED_FLAGS = new Set(["noStrict", "raw", "module", "async"]);
// Includes that the harness already defines, as compareArray.js is now part of assert.js.
const HARNESS_INCLUDES = new Set(["compareArray.js"]);

const getMetadata = (source: string): Metadata => {
  const frontmatter = /\/\*---([\s\S]*?)---\*\//.exec(source)?.[1] ?? "";
  const getList = (key: string) => {
    const inline = new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, "m").exec(frontmatter);
    if (inline !== null) {
      return inline[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    const block = new RegExp(`^${key}:\\s*\\n((?:\\s+-.*\\n?)*)`, "m").exec(frontmatter);
    return block === null ? [] : [...block[1].matchAll(/-\s*(\S+)/g)].map((match) => match[1]);
  };
  return {
    includes: getList("includes"),
    flags: getList("flags"),
    isNegative: /^negative:/m.test(frontmatter),
    isSyntaxError: /^negative:\s*\n\s*phase:\s*(parse|early)\s*\n\s*type:\s*SyntaxError\s*$/m.test(
      frontmatter,
    ),
  };
};

const getSkipReason = (metadata: Metadata) => {
  if (metadata.isNegative && !metadata.isSyntaxError) return "negative test";
  const flag = metadata.flags.find((candidate) => SKIPPED_FLAGS.has(candidate));
  if (flag !== undefined) return `flag ${flag}`;
  const includes = metadata.includes.filter((include) => !HARNESS_INCLUDES.has(include));
  return includes.length > 0 ? `includes ${includes.join(", ")}` : undefined;
};

const getNodeError = (source: string) => {
  try {
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ESNext,
        moduleDetection: ts.ModuleDetectionKind.Force,
      },
    }).outputText;
    runInNewContext(output, { exports: {} });
    return undefined;
  } catch (error) {
    return String(error);
  }
};

const getFirstLine = (text: string) => text.split("\n")[0];

// TLC stops when a value has no TLA+ form, which only a run finds, rather than giving a different
// answer than Node.
const UNREPRESENTABLE = [
  "Overflow when computing",
  "TLC can't handle a number this big",
  "TLA+ sequences can't have holes",
  "tla-ts can't compare objects by identity",
];

const getFailedRun = (id: string, reason: string): TestRun => ({
  id,
  outcome: UNREPRESENTABLE.some((text) => reason.includes(text)) ? "untranslatable" : "wrong",
  reason: reason.replaceAll("\n", " "),
});

// TypeScript's syntax and grammar errors, and its semantic errors that ECMAScript makes early
// errors, such as a redeclared let.
const EARLY_ERRORS = new Set([
  2300, 2335, 2337, 2357, 2364, 2392, 2406, 2451, 2462, 2481, 2487, 2523, 2524, 2660, 2777, 2779,
  2804, 2815, 5076, 6188, 6189, 18006, 18011, 18012, 18013, 18016, 18026, 18037, 18041, 18061,
]);

const isEarlyError = (code: number) =>
  (code >= 1000 && code < 2000) || (code >= 17000 && code < 18000) || EARLY_ERRORS.has(code);

const isNodeSyntaxError = (source: string) => {
  try {
    new Script(source);
    return false;
  } catch (error) {
    return error instanceof SyntaxError;
  }
};

// A test that expects a SyntaxError passes when tla-ts rejects the program with one.
const runSyntaxTest = (id: string, source: string, metadata: Metadata): TestRun => {
  const strict = metadata.flags.includes("onlyStrict") ? '"use strict";\n' : "";
  if (!isNodeSyntaxError(`${strict}${source}`)) {
    return { id, outcome: "skipped", reason: "Node accepts it" };
  }
  const program = `${HARNESS}\n${source}`;
  try {
    compile(program, "test262.ts");
  } catch (error) {
    if (!(error instanceof TlaTypeScriptError)) return getFailedRun(id, String(error));
    const codes = [...error.message.matchAll(/(?:error|message) TS(\d+):/g)].map((match) =>
      Number(match[1]),
    );
    const reason = getFirstLine(error.message);
    if (codes.some(isEarlyError) || reason.includes(" SyntaxError: ")) {
      return { id, outcome: "pass", reason: "" };
    }
    return codes.length > 0
      ? { id, outcome: "skipped", reason: `type error: ${reason}` }
      : { id, outcome: "untranslatable", reason };
  }
  const isModule =
    spawnSync(process.execPath, ["--input-type=module", "--check"], { input: source }).status === 0;
  return isModule
    ? {
        id,
        outcome: "skipped",
        reason: "a SyntaxError only in scripts, and tla-ts compiles modules",
      }
    : { id, outcome: "wrong", reason: "Compiled a program with a SyntaxError" };
};

const runTest = async (path: string): Promise<TestRun> => {
  const id = relative(TEST_DIRECTORY, path);
  const source = readFileSync(path, "utf8");
  const metadata = getMetadata(source);
  const skipReason = getSkipReason(metadata);
  if (skipReason !== undefined) return { id, outcome: "skipped", reason: skipReason };
  if (metadata.isSyntaxError) return runSyntaxTest(id, source, metadata);
  const program = `${HARNESS}\n${source}`;
  const nodeError = getNodeError(program);
  if (nodeError !== undefined) {
    return { id, outcome: "skipped", reason: `Node fails: ${getFirstLine(nodeError)}` };
  }
  try {
    const result = await check({ ...compile(program, "test262.ts"), onPrint: () => {} });
    if (result.status === "success" || result.status === "deadlock") {
      return { id, outcome: "pass", reason: "" };
    }
    return getFailedRun(id, result.failure?.message ?? result.status);
  } catch (error) {
    if (!(error instanceof TlaTypeScriptError)) {
      return getFailedRun(id, String(error));
    }
    const reason = getFirstLine(error.message);
    return /: (?:error|message) TS\d+: /.test(reason)
      ? { id, outcome: "skipped", reason: `type error: ${reason}` }
      : { id, outcome: "untranslatable", reason };
  }
};

const getReasonKind = (reason: string) =>
  reason
    .replace(/^type error: \S+\(\d+,\d+\): /, "type ")
    .replace(/^\S+:\d+:\d+ /, "")
    .split(": ")[0];

const isVerbose = process.argv.includes("--verbose");
const prefixes = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const paths = listFiles(TEST_DIRECTORY)
  .filter((path) => path.endsWith(".js") && !path.includes("_FIXTURE"))
  .filter((path) => {
    const id = relative(TEST_DIRECTORY, path);
    return prefixes.length === 0 || prefixes.some((prefix) => id.startsWith(prefix));
  })
  .sort();

const runs: TestRun[] = [];
for (const path of paths) {
  const run = await runTest(path);
  runs.push(run);
  if (isVerbose || run.outcome === "wrong") {
    console.log(`${run.outcome.toUpperCase()} ${run.id}${run.reason ? ` ${run.reason}` : ""}`);
  }
}

const countBy = (items: string[]) =>
  [...Map.groupBy(items, (item) => item)].map((entry) => ({
    key: entry[0],
    count: entry[1].length,
  }));

const outcomes = countBy(runs.map((run) => run.outcome));
console.log(
  `${runs.length} tests: ${outcomes.map((entry) => `${entry.count} ${entry.key}`).join(", ")}`,
);
for (const outcome of ["untranslatable", "skipped"]) {
  console.log(`Most common reasons a test is ${outcome}:`);
  countBy(runs.filter((run) => run.outcome === outcome).map((run) => getReasonKind(run.reason)))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10)
    .forEach((entry) => console.log(`  ${entry.count} ${entry.key}`));
}
process.exit(runs.some((run) => run.outcome === "wrong") ? 1 : 0);
