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
import { getBackend, TLAPM_OUTCOME_EXITS } from "./tlapm";
import {
  formatYaml,
  parseTest,
  SUITE_DIRECTORY,
  writeRecordings,
  type Recording,
  type TestMetadata,
} from "./test-file";

const WORKERS = Number(process.env.CONFORMANCE_WORKERS ?? Math.min(2, availableParallelism()));
const LIMITS = { milliseconds: 120_000, memoryBytes: 4 * 1024 ** 3 };
const IMPORT_DIRECTORY = join(SUITE_DIRECTORY, "tlapm/imported");
const MAX_RECORDING_BYTES = 1024 ** 2;

interface PendingTest {
  directory: string;
  sourceDirectory: string;
  fileName: string;
  metadata: TestMetadata;
  module: string;
  fixtures: string[];
  acceptedOutcomes?: string[];
}

const checkout = process.argv[2];
if (!checkout || !existsSync(join(checkout, "test")) || !existsSync(join(checkout, "zenon"))) {
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

const getFixtures = (directory: string, module: string, seen = new Set<string>()): string[] =>
  getReferencedModules(module).flatMap((name) => {
    const path = join(directory, `${name}.tla`);
    if (seen.has(name) || !existsSync(path)) return [];
    seen.add(name);
    return [`${name}.tla`, ...getFixtures(directory, readFileSync(path, "utf8"), seen)];
  });

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
    sourceDirectory: dirname(path),
    fileName: basename(path),
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

const getSoundnessTest = (path: string): PendingTest => {
  const trailer = splitTrailer(readFileSync(path, "utf8"));
  const flags = trailer.directives
    .filter((directive) => directive.key === "flags")
    .flatMap((directive) => directive.value.split(/\s+/));
  const known = trailer.directives.find((directive) => directive.key === "known");
  return {
    directory: "soundness_tests",
    sourceDirectory: dirname(path),
    fileName: basename(path),
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
        sourceDirectory: dirname(path),
        fileName: `${moduleName}.tla`,
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

const getSanyTest = (path: string): PendingTest => ({
  directory: relative(testDirectory, dirname(path)),
  sourceDirectory: dirname(path),
  fileName: basename(path),
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

const getBackendTreeTest = (path: string, metadata: TestMetadata, acceptedOutcome: string) => ({
  directory: relative(checkout, dirname(path)),
  sourceDirectory: dirname(path),
  fileName: basename(path),
  metadata,
  module: readFileSync(path, "utf8"),
  fixtures: path.endsWith(".tla") ? getFixtures(dirname(path), readFileSync(path, "utf8")) : [],
  acceptedOutcomes: [acceptedOutcome],
});

const getZenonTest = (path: string) =>
  getBackendTreeTest(
    path,
    {
      description: `Zenon's own test ${relative(checkout, path)}, which Zenon must prove.`,
      ref: relative(checkout, path),
      features: ["zenon-test"],
      outcome: "unsat",
    },
    "unsat",
  );

const getZenonRegressionTest = (path: string) =>
  getBackendTreeTest(
    path,
    {
      description: `Zenon's regression test ${relative(checkout, path)}, whose proofs tlapm must check with Zenon.`,
      ref: relative(checkout, path),
      features: ["zenon-test"],
      mode: "proof",
      outcome: "proved",
      args: ["--method", "zenon"],
    },
    "proved",
  );

const getIsabelleTest = (path: string) =>
  getBackendTreeTest(
    path,
    {
      description: `The theory ${relative(checkout, path)}, which a session in isabelle/ROOT checks.`,
      ref: relative(checkout, path),
      features: ["isabelle-test"],
      outcome: "unsat",
    },
    "unsat",
  );

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
  ...listFiles(join(checkout, "zenon/test"))
    .filter((path) => path.endsWith(".znn"))
    .map(getZenonTest),
  ...listFiles(join(checkout, "zenon/regression"))
    .filter((path) => path.endsWith(".tla"))
    .map(getZenonRegressionTest),
  ...["tests", "examples"].flatMap((directory) =>
    listFiles(join(checkout, "isabelle", directory))
      .filter((path) => path.endsWith(".thy"))
      .map(getIsabelleTest),
  ),
];

const getTestPath = (pending: PendingTest) =>
  join(IMPORT_DIRECTORY, pending.directory, pending.fileName);

const writePending = (pending: PendingTest, outcome: string) => {
  const metadata = {
    ...pending.metadata,
    outcome,
    ...(pending.fixtures.length > 0 ? { includes: pending.fixtures } : {}),
  };
  writeFileSync(getTestPath(pending), `(*---\n${formatYaml(metadata)}\n---*)\n${pending.module}`);
};

// A fixture can be a test too, so every file is written before any test runs and rewritten after
// all have run.
rmSync(IMPORT_DIRECTORY, { recursive: true, force: true });
const testPaths = new Set(pendingTests.map(getTestPath));
const fixturePaths = new Set(
  pendingTests.flatMap((pending) =>
    pending.fixtures.map((fixture) => join(IMPORT_DIRECTORY, pending.directory, fixture)),
  ),
);
pendingTests.forEach((pending) => {
  mkdirSync(join(IMPORT_DIRECTORY, pending.directory), { recursive: true });
  pending.fixtures
    .filter((fixture) => !testPaths.has(join(IMPORT_DIRECTORY, pending.directory, fixture)))
    .forEach((fixture) =>
      writeFileSync(
        join(IMPORT_DIRECTORY, pending.directory, fixture),
        readFileSync(join(pending.sourceDirectory, fixture)),
      ),
    );
});
pendingTests.forEach((pending) => writePending(pending, pending.metadata.outcome));

const host = getHost("tlapm");
const kept = new Map<PendingTest, { outcome: string; recording: Recording }>();

await runPool(pendingTests, WORKERS, async (pending) => {
  const path = getTestPath(pending);
  const test = parseTest(path, readFileSync(path, "utf8"));
  if (!test) return;
  const context = { name: "model", source: test.source, config: "" };
  const first = await runTest(host, test, context, LIMITS);
  const second = first.exceeded ? first : await runTest(host, test, context, LIMITS);
  const observed = getBackend(path)
    ? first.transcript.split("\n")[0]
    : Object.entries(TLAPM_OUTCOME_EXITS).find(
        (entry) => entry[0] !== "any" && entry[1].includes(first.exit),
      )?.[0];
  const reason = first.exceeded
    ? `exceeds the importer's ${first.exceeded} limit`
    : first.exit !== second.exit || first.transcript !== second.transcript
      ? "gives different results on two runs"
      : Buffer.byteLength(first.transcript) > MAX_RECORDING_BYTES
        ? "records more than 1 MB"
        : !observed || (pending.acceptedOutcomes && !pending.acceptedOutcomes.includes(observed))
          ? `${getBackend(path) ? `gives ${observed}` : `exits ${first.exit}`} here, not ${(pending.acceptedOutcomes ?? ["a tlapm outcome"]).join(" or ")}`
          : undefined;
  if (reason || !observed) {
    skipped.push(`${test.id}: ${reason}`);
    return;
  }
  kept.set(pending, {
    outcome: observed,
    recording: {
      exit: first.exit,
      ...(first.transcript === "" ? {} : { transcript: first.transcript }),
    },
  });
});

const keptFixturePaths = new Set(
  [...kept.keys()].flatMap((pending) =>
    pending.fixtures.map((fixture) => join(IMPORT_DIRECTORY, pending.directory, fixture)),
  ),
);
pendingTests.forEach((pending) => {
  const path = getTestPath(pending);
  const result = kept.get(pending);
  if (result) {
    writePending(pending, result.outcome);
    const test = parseTest(path, readFileSync(path, "utf8"));
    if (test) writeRecordings(test, { model: result.recording });
    return;
  }
  if (keptFixturePaths.has(path)) writeFileSync(path, pending.module);
  else rmSync(path, { force: true });
});
[...fixturePaths]
  .filter((path) => !testPaths.has(path) && !keptFixturePaths.has(path))
  .forEach((path) => rmSync(path, { force: true }));

skipped.sort().forEach((line) => console.log(`SKIPPED ${line}`));
console.log(
  `Imported ${kept.size} of ${pendingTests.length} tlapm tests, skipped ${skipped.length}`,
);
