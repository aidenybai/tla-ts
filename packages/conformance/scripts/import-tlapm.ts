// Ports tlapm's own tests into test/tlapm/imported, recorded from the pinned tlapm. Each test
// declares the outcome its tlapm harness checks. A test that needs what the suite can't express, such
// as two runs or a shell pipeline, is skipped, and so is one that doesn't reproduce here.
// Usage: bun scripts/run.ts import-tlapm <tlapm checkout>

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
import { basename, dirname, join, relative } from "node:path";
import { getHost, runPool, runTest } from "./hosts";
import { TLAPM_OUTCOME_EXITS } from "./tlapm";
import {
  formatYaml,
  parseTest,
  SUITE_DIRECTORY,
  writeRecordings,
  type TestMetadata,
} from "./test-file";

const WORKERS = Number(process.env.CONFORMANCE_WORKERS ?? Math.min(2, availableParallelism()));
const LIMIT_MILLISECONDS = 120_000;
const IMPORT_DIRECTORY = join(SUITE_DIRECTORY, "tlapm/imported");

interface PendingTest {
  directory: string;
  moduleName: string;
  metadata: TestMetadata;
  module: string;
  // Fixture modules beside the test that it EXTENDS or INSTANCEs.
  fixtures: string[];
  // The outcomes that agree with what tlapm's harness checks. The test records the one tlapm
  // reaches. Without this list, tlapm's harness checks nothing that fixes the outcome.
  acceptedOutcomes?: string[];
}

const checkout = process.argv[2];
if (!checkout || !existsSync(join(checkout, "test"))) {
  console.error("Usage: bun scripts/run.ts import-tlapm <tlapm checkout>");
  process.exit(1);
}
const testDirectory = join(checkout, "test");

const listFiles = (directory: string): string[] =>
  readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? listFiles(path) : [path];
    });

// The text after the last ==== holds the harness's directives, one `key: value` per line.
const splitTrailer = (text: string) => {
  const lines = text.split("\n");
  const end = lines.findLastIndex((line) => /^={4,}/.test(line));
  return {
    module: `${lines.slice(0, end + 1).join("\n")}\n`,
    directives: lines.slice(end + 1).flatMap((line) => {
      const directive = /^\s*([a-z*]+):\s?(.*)$/.exec(line);
      return directive ? [{ key: directive[1], value: directive[2].trim() }] : [];
    }),
  };
};

const getReferencedModules = (module: string) =>
  [...module.matchAll(/\b(?:EXTENDS|INSTANCE)\s+([\w\s,]+?)(?:\n|WITH|$)/g)].flatMap((match) =>
    match[1]
      .split(",")
      .map((name) => name.trim())
      .filter((name) => /^\w+$/.test(name)),
  );

// The fixtures beside a test that it reaches through EXTENDS and INSTANCE, transitively.
const getFixtures = (directory: string, module: string, seen = new Set<string>()): string[] =>
  getReferencedModules(module).flatMap((name) => {
    const path = join(directory, `${name}.tla`);
    if (seen.has(name) || !existsSync(path)) return [];
    seen.add(name);
    return [`${name}.tla`, ...getFixtures(directory, readFileSync(path, "utf8"), seen)];
  });

// The flags of a `command: ${TLAPM} <flags> ${FILE}` line, less those the suite always sets.
const getCommandFlags = (command: string) => {
  const match = /^\$\{TLAPM\}(.*)\$\{FILE\}\s*$/.exec(command);
  if (!match) return undefined;
  const tokens = match[1].trim().split(/\s+/).filter(Boolean);
  const flags: string[] = [];
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index] === "--toolbox") index += 2;
    else if (!["--nofp", "--strict"].includes(tokens[index])) flags.push(tokens[index]);
  }
  return flags;
};

const RESULT_OUTCOMES: Record<string, string> = {
  "3": "rejected",
  "11": "incomplete",
  "12": "empty-target",
};

const getHarnessTest = (path: string): PendingTest | string => {
  const text = readFileSync(path, "utf8");
  const trailer = splitTrailer(text);
  const commands = trailer.directives.filter((directive) => directive.key === "command");
  if (commands.length > 1) return "runs tlapm more than once";
  const flags = commands.length === 1 ? getCommandFlags(commands[0].value) : [];
  if (!flags) return `runs a command the suite can't express: ${commands[0].value}`;
  const stretch = trailer.directives.find((directive) => directive.key === "stretch");
  const result = trailer.directives.find((directive) => directive.key === "result")?.value;
  const checks = trailer.directives.filter((directive) => /std/.test(directive.key));
  const isFailing = checks.some(
    (check) =>
      check.key.startsWith("std") &&
      /status:failed|reason:false|obligations? failed/.test(check.value),
  );
  const outcome =
    result && RESULT_OUTCOMES[result] ? RESULT_OUTCOMES[result] : isFailing ? "failed" : "proved";
  // Without --strict, tlapm exits 0 when it omits a step, and the suite's --strict makes that 11.
  const isStrict = flags.includes("--strict");
  const acceptedOutcomes =
    result === "0" && checks.length > 0 && !isStrict
      ? undefined
      : outcome === "proved" && !isStrict
        ? ["proved", "incomplete"]
        : [outcome];
  const directory = relative(testDirectory, dirname(path));
  return {
    directory,
    moduleName: basename(path, ".tla"),
    metadata: {
      description: `tlapm's own test ${relative(testDirectory, path)}${checks.length > 0 ? `, which checks ${checks.map((check) => `${check.key} ${check.value}`).join("; ")}` : ""}.`,
      ref: `test/${relative(testDirectory, path)}`,
      features: ["tlapm-test"],
      mode: "proof",
      outcome,
      ...(flags.length + (stretch ? 1 : 0) > 0
        ? { args: [...flags, ...(stretch ? ["--stretch", stretch.value] : [])] }
        : {}),
    },
    module: trailer.module,
    fixtures: getFixtures(dirname(path), trailer.module),
    acceptedOutcomes,
  };
};

// A soundness test states a false theorem, so some obligation must fail, unless `known:` marks a
// bug that still proves it (test/TOOLS/do_soundness_tests).
const getSoundnessTest = (path: string): PendingTest => {
  const trailer = splitTrailer(readFileSync(path, "utf8"));
  const flags = trailer.directives
    .filter((directive) => directive.key === "flags")
    .flatMap((directive) => directive.value.split(/\s+/));
  const known = trailer.directives.find((directive) => directive.key === "known");
  return {
    directory: "soundness_tests",
    moduleName: basename(path, ".tla"),
    metadata: {
      description: known
        ? `tlapm's soundness test ${basename(path)} states a false theorem, and tlapm still proves it: ${known.value}.`
        : `tlapm's soundness test ${basename(path)} states a false theorem, so an obligation must fail.`,
      ref: `test/soundness_tests/${basename(path)}`,
      features: known ? ["tlapm-test", "tlapm-bug"] : ["tlapm-test"],
      mode: "proof",
      outcome: known ? "proved" : "failed",
      ...(flags.length > 0 ? { args: flags } : {}),
    },
    module: trailer.module,
    fixtures: getFixtures(dirname(path), trailer.module),
    acceptedOutcomes: [known ? "proved" : "failed"],
  };
};

const toSnakeCase = (text: string) =>
  text
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

// Each case of the tree-sitter syntax corpus is a module with its expected parse tree. The suite can
// see only whether tlapm accepts the module.
const getCorpusTests = (path: string): PendingTest[] => {
  const text = readFileSync(path, "utf8");
  const cases = [...text.matchAll(/={3,}\|\|\|\n(.+)\n={3,}\|\|\|\n([\s\S]*?)\n-{3,}\|\|\|\n/g)];
  const corpus = basename(path, ".txt");
  return cases.flatMap((match) => {
    const moduleName = `${toSnakeCase(corpus)}_${toSnakeCase(match[1])}`;
    const module = match[2]
      .trim()
      .replace(/-{4,}\s*MODULE\s+\w+\s*-{4,}/, `---- MODULE ${moduleName} ----`);
    if (!module.includes(`MODULE ${moduleName}`)) return [];
    return [
      {
        directory: `parser/${toSnakeCase(corpus)}`,
        moduleName,
        metadata: {
          description: `The syntax corpus case "${match[1]}" in ${corpus}.txt, which tlapm's parser tests read.`,
          ref: `test/parser/syntax_corpus/${basename(path)}`,
          features: ["tlapm-test", "syntax-corpus"],
          mode: "obligations",
          outcome: "proved",
        },
        module: `${module}\n`,
        fixtures: [],
      },
    ];
  });
};

// SANY's equivalence modules, which tlapm's tests parse with both parsers.
const getSanyTest = (path: string): PendingTest => ({
  directory: relative(testDirectory, dirname(path)),
  moduleName: basename(path, ".tla"),
  metadata: {
    description: `The module ${relative(testDirectory, path)}, which tlapm's tests parse with tlapm's parser and with SANY.`,
    ref: `test/${relative(testDirectory, path)}`,
    features: ["tlapm-test"],
    mode: "obligations",
    outcome: "proved",
  },
  module: readFileSync(path, "utf8"),
  fixtures: getFixtures(dirname(path), readFileSync(path, "utf8")),
});

const files = listFiles(testDirectory).filter((path) => !path.includes(".tlaps/"));
const skipped: string[] = [];
const pendingTests: PendingTest[] = [
  ...files
    .filter((path) => path.endsWith("_test.tla"))
    .flatMap((path) => {
      const pending = getHarnessTest(path);
      if (typeof pending === "string") skipped.push(`${relative(testDirectory, path)}: ${pending}`);
      return typeof pending === "string" ? [] : [pending];
    }),
  ...files.filter((path) => path.endsWith("_stest.tla")).map(getSoundnessTest),
  ...files.filter((path) => path.includes("/sany/") && path.endsWith(".tla")).map(getSanyTest),
  ...files
    .filter((path) => path.includes("/syntax_corpus/") && path.endsWith(".txt"))
    .flatMap(getCorpusTests),
];

const writePending = (pending: PendingTest) => {
  const directory = join(IMPORT_DIRECTORY, pending.directory);
  mkdirSync(directory, { recursive: true });
  pending.fixtures.forEach((fixture) =>
    writeFileSync(
      join(directory, fixture),
      readFileSync(join(testDirectory, pending.directory, fixture)),
    ),
  );
  const metadata =
    pending.fixtures.length > 0
      ? { ...pending.metadata, includes: pending.fixtures }
      : pending.metadata;
  const path = join(directory, `${pending.moduleName}.tla`);
  writeFileSync(path, `(*---\n${formatYaml(metadata)}\n---*)\n${pending.module}`);
  return path;
};

rmSync(IMPORT_DIRECTORY, { recursive: true, force: true });
const host = getHost("tlapm");
const kept = { count: 0 };

// A test is kept only if two runs agree, since a proof near a time limit can go either way.
await runPool(pendingTests, WORKERS, async (pending) => {
  const path = writePending(pending);
  const test = parseTest(path, readFileSync(path, "utf8"));
  if (!test) return;
  const context = { name: "model", source: test.source, config: "" };
  const first = await runTest(host, test, context, LIMIT_MILLISECONDS);
  const second = first.exit === -1 ? first : await runTest(host, test, context, LIMIT_MILLISECONDS);
  const observed = Object.entries(TLAPM_OUTCOME_EXITS).find(
    (entry) => entry[0] !== "any" && entry[1].includes(first.exit),
  )?.[0];
  const reason =
    first.exit === -1
      ? `takes longer than ${LIMIT_MILLISECONDS} ms`
      : first.exit !== second.exit || first.transcript !== second.transcript
        ? "gives different results on two runs"
        : !observed || (pending.acceptedOutcomes && !pending.acceptedOutcomes.includes(observed))
          ? `exits ${first.exit} here, not ${(pending.acceptedOutcomes ?? ["a tlapm outcome"]).join(" or ")}`
          : undefined;
  if (reason || !observed) {
    skipped.push(`${test.id}: ${reason}`);
    rmSync(path, { force: true });
    return;
  }
  const recorded =
    observed === pending.metadata.outcome
      ? test
      : (parseTest(
          writePending({ ...pending, metadata: { ...pending.metadata, outcome: observed } }),
          readFileSync(path, "utf8"),
        ) ?? test);
  writeRecordings(recorded, {
    model: {
      exit: first.exit,
      ...(first.transcript === "" ? {} : { transcript: first.transcript }),
    },
  });
  kept.count += 1;
});

skipped.sort().forEach((line) => console.log(`SKIPPED ${line}`));
console.log(
  `Imported ${kept.count} of ${pendingTests.length} tlapm tests, skipped ${skipped.length}`,
);
