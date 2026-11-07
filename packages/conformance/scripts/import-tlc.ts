// Ports the tests of TLC and SANY from a checkout of tlaplus/tlaplus into test/imported.
// Usage: bun scripts/import-tlc.ts <checkout>
//
// Each ported test keeps the upstream test's spec, config, flags and declared exit status, and the
// recording replaces the upstream Java assertions.

import {
  cpSync,
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
import {
  formatYaml,
  isDeclaredOutcome,
  type Outcome,
  OUTCOME_EXITS,
  parseTest,
  SUITE_DIRECTORY,
  type TestMetadata,
} from "./test-file";

const TOOLS_PATH = "tlatools/org.lamport.tlatools";
const LIMIT_MILLISECONDS = 30_000;
const WORKERS = Number(process.env.CONFORMANCE_WORKERS ?? Math.min(4, availableParallelism()));

const checkout = process.argv[2];
const toolsDirectory = join(checkout, TOOLS_PATH);
const modelDirectory = join(toolsDirectory, "test-model");
const importDirectory = join(SUITE_DIRECTORY, "tlc/imported");

const EXIT_OUTCOMES: Record<string, Outcome> = {
  SUCCESS: "success",
  VIOLATION_ASSUMPTION: "assumption-violation",
  VIOLATION_DEADLOCK: "deadlock",
  VIOLATION_SAFETY: "safety-violation",
  VIOLATION_LIVENESS: "liveness-violation",
  VIOLATION_ASSERT: "assertion-failure",
  FAILURE_SPEC_EVAL: "evaluation-failure",
  FAILURE_SAFETY_EVAL: "evaluation-failure",
  FAILURE_LIVENESS_EVAL: "evaluation-failure",
  ERROR_SPEC_PARSE: "parse-error",
  ERROR_CONFIG_PARSE: "config-error",
  ERROR_STATESPACE_TOO_LARGE: "state-space-too-large",
  ERROR_SYSTEM: "system-error",
  ERROR: "tlc-error",
};

// These need a running debugger, TLC's distribution, a prior run's state, or a file left behind.
const UNPORTABLE_ARGUMENTS = new Set([
  "-debugger",
  "-recover",
  "-checkpoint",
  "-distributed",
  "-generateSpecTE",
  "-teSpecOutDir",
  "-dumpTrace",
  "-dump",
  "-userFile",
  "-coverage",
]);

interface PendingTest {
  directory: string;
  moduleName: string;
  moduleText: string;
  metadata: TestMetadata;
  fixtures: { from: string; as: string }[];
  isOutcomeObserved: boolean;
}

const skipped: string[] = [];

const listFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

const getOutcomeForExit = (exit: number) =>
  (Object.keys(OUTCOME_EXITS) as Outcome[]).find((outcome) =>
    OUTCOME_EXITS[outcome].includes(exit),
  );

const renderTest = (metadata: TestMetadata, moduleText: string) =>
  `(*---\n${formatYaml(metadata)}\n---*)\n${moduleText}`;

// The constructor's arguments, split at the top level.
const getConstructorArguments = (java: string) => {
  const start = java.search(/\bsuper\s*\(/);
  if (start === -1) return undefined;
  const open = java.indexOf("(", start);
  const scan = { depth: 0, isString: false, current: "", parts: [] as string[] };
  for (let index = open; index < java.length; index += 1) {
    const character = java[index];
    if (scan.isString) {
      scan.current += character;
      if (character === '"' && java[index - 1] !== "\\") scan.isString = false;
      continue;
    }
    if (character === '"') scan.isString = true;
    if ("({".includes(character)) scan.depth += 1;
    if (")}".includes(character)) scan.depth -= 1;
    if (scan.depth === 0) {
      scan.parts.push(scan.current.trim());
      return scan.parts;
    }
    if (character === "," && scan.depth === 1) {
      scan.parts.push(scan.current.trim());
      scan.current = "";
      continue;
    }
    if (!(index === open)) scan.current += character;
  }
  return undefined;
};

const getStringLiteral = (text: string) => /^"([^"]*)"$/.exec(text)?.[1];

const getDependencies = (directory: string, moduleName: string, seen = new Set<string>()) => {
  const path = join(directory, `${moduleName}.tla`);
  if (seen.has(moduleName) || !existsSync(path)) return seen;
  seen.add(moduleName);
  const text = readFileSync(path, "utf8");
  const extended = [
    ...text.matchAll(/\bEXTENDS\s+([\w\s,]+?)(?=\n\s*\n|\n\s*[A-Z(\\-]|$)/g),
  ].flatMap((match) => match[1].split(",").map((name) => name.trim()));
  const instantiated = [...text.matchAll(/\bINSTANCE\s+(\w+)/g)].map((match) => match[1]);
  [...extended, ...instantiated].forEach((name) => getDependencies(directory, name, seen));
  return seen;
};

const getDataFiles = (directory: string) =>
  readdirSync(directory).filter((entry) => /\.(json|ndjson|csv|txt|class|vl|bin)$/i.test(entry));

const portModelTest = (javaPath: string): PendingTest | undefined => {
  const java = readFileSync(javaPath, "utf8");
  const className = basename(javaPath, ".java");
  const relativePackage = relative(join(toolsDirectory, "test/tlc2/tool"), dirname(javaPath));
  const skip = (reason: string) => {
    skipped.push(`${className}: ${reason}`);
    return undefined;
  };
  if (
    /System\.setProperty|getResolver|TLCGlobals\.|runWithDebugger\(\)\s*\{\s*return true/.test(java)
  )
    return skip("sets internal TLC state");
  const isSuite = /extends\s+SuiteTestCase|extends\s+SuiteETestCase/.test(java);
  if (!isSuite && !/extends\s+ModelCheckerTestCase/.test(java))
    return skip("not a plain model checking test");
  if (/abstract class/.test(java)) return undefined;
  if (/@Ignore/.test(java)) return skip("upstream ignores this test");
  const parts = getConstructorArguments(java) ?? [];
  const specName = isSuite
    ? className.replace(/^ETest/, "etest").replace(/^Test/, "test")
    : parts[0]?.includes("MODEL_CHECK_FILE_BASENAME")
      ? "MC"
      : getStringLiteral(parts[0] ?? "");
  if (!specName) return skip("constructor has no literal spec name");
  const rest = isSuite ? parts : parts.slice(1);
  const pathArgument = rest.find((part) => getStringLiteral(part) !== undefined);
  if (rest.filter((part) => getStringLiteral(part) !== undefined).length > 1)
    return skip("constructor has an unknown shape");
  const arrayArgument = rest.find((part) => part.startsWith("new String[]"));
  const exitArgument = rest.find((part) => /ExitStatus\.\w+/.test(part));
  if (rest.some((part) => part !== pathArgument && part !== arrayArgument && part !== exitArgument))
    return skip("constructor has an unknown shape");
  const flags = [...(arrayArgument ?? "").matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  const elementCount = (arrayArgument ?? "").split(",").length;
  if (arrayArgument && flags.length !== elementCount) return skip("flags are computed at run time");
  if (flags.some((flag) => UNPORTABLE_ARGUMENTS.has(flag))) return skip(`uses ${flags.join(" ")}`);
  const configIndex = flags.indexOf("-config");
  const configName = configIndex === -1 ? `${specName}.cfg` : basename(flags[configIndex + 1]);
  // -config Spec.tla reads the configuration embedded in the module, which the test must keep.
  const isEmbeddedConfig = configName.endsWith(".tla");
  const args = [
    ...flags.filter(
      (_flag, index) =>
        configIndex === -1 ||
        isEmbeddedConfig ||
        (index !== configIndex && index !== configIndex + 1),
    ),
    ...(isSuite || /checkDeadLock\(\)\s*\{\s*return\s+true/.test(java) ? [] : ["-deadlock"]),
  ];
  const subdirectory = isSuite ? "suite" : (getStringLiteral(pathArgument ?? "") ?? "");
  const directory = join(modelDirectory, subdirectory);
  const specPath = join(directory, `${specName}.tla`);
  if (!existsSync(specPath)) return skip(`no spec at ${relative(modelDirectory, specPath)}`);
  const configPath = join(directory, configName);
  const exitName = /ExitStatus\.(\w+)/.exec(exitArgument ?? "")?.[1] ?? "SUCCESS";
  const outcome = EXIT_OUTCOMES[exitName];
  if (!outcome) return skip(`unknown exit ${exitName}`);
  const dependencies = [...getDependencies(directory, specName)].filter(
    (name) => name !== specName,
  );
  const dataFiles = subdirectory === "" ? [] : getDataFiles(directory);
  const fixtures = [
    ...dependencies.map((name) => ({
      from: join(directory, `${name}.tla`),
      as: `${name}.tla`,
    })),
    ...dataFiles.map((name) => ({ from: join(directory, name), as: name })),
  ];
  const moduleText = readFileSync(specPath, "utf8");
  const metadata: TestMetadata = {
    description: `Ported from TLC's ${className}.`,
    source: `${TOOLS_PATH}/${relative(toolsDirectory, javaPath)}`,
    features: [isSuite ? "tlc-suite" : "tlc-regression"],
    ...(moduleText.includes("AssertError(") ? { flags: ["exit-only"] } : {}),
    outcome,
    ...(!isEmbeddedConfig && existsSync(configPath)
      ? { config: readFileSync(configPath, "utf8") }
      : {}),
    ...(args.length > 0 ? { args } : {}),
    ...(fixtures.length > 0 ? { includes: fixtures.map((fixture) => fixture.as) } : {}),
  };
  return {
    directory: join(importDirectory, "tlc", relativePackage.split("/")[0] || "tool", className),
    moduleName: specName,
    moduleText,
    metadata,
    fixtures,
    isOutcomeObserved: false,
  };
};

const portSemanticCorpus = () =>
  listFiles(join(toolsDirectory, "test/tla2sany/semantic/corpus"))
    .filter((path) => path.endsWith(".tla"))
    .map((path): PendingTest => ({
      directory: join(importDirectory, "sany/semantic"),
      moduleName: basename(path, ".tla"),
      moduleText: readFileSync(path, "utf8"),
      metadata: {
        description: `Ported from SANY's semantic corpus: ${basename(path)}.`,
        source: `${TOOLS_PATH}/${relative(toolsDirectory, path)}`,
        features: ["sany-semantic"],
        outcome: "success",
      },
      fixtures: [],
      isOutcomeObserved: true,
    }));

const portErrorCorpus = () =>
  listFiles(join(toolsDirectory, "test/tla2sany/semantic/error_corpus"))
    .filter((path) => /[EW]\d+.*_Test\.tla$/.test(path))
    .map((path): PendingTest => {
      const moduleName = basename(path, ".tla");
      const isWarning = moduleName.startsWith("W");
      return {
        directory: join(importDirectory, "sany/errors", moduleName.split("_")[0]),
        moduleName,
        moduleText: readFileSync(path, "utf8"),
        metadata: {
          description: `SANY reports ${moduleName.split("_")[0]}. Ported from SANY's error corpus.`,
          source: `${TOOLS_PATH}/${relative(toolsDirectory, path)}`,
          features: ["sany-errors"],
          outcome: isWarning ? "success" : "parse-error",
        },
        fixtures: [],
        // SANY's corpus tests ask only for the code, so a warning's module may fail for its own reason.
        isOutcomeObserved: isWarning,
      };
    });

const getSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

// A corpus file holds cases as a title between lines of =, the module, a line of -, and a parse tree.
// Only the syntax parser sees them upstream, so TLC's full front end decides their outcome here.
const portParserCorpus = () =>
  listFiles(join(toolsDirectory, "test/tla2sany/corpus"))
    .filter((path) => path.endsWith(".txt"))
    .flatMap((path) => {
      const area = basename(path, ".txt");
      const cases = readFileSync(path, "utf8")
        .split(/^={3,}\|\|\|\s*$/m)
        .slice(1);
      const pairs = cases.flatMap((text, index) =>
        index % 2 === 0 ? [{ title: text.trim(), body: cases[index + 1] }] : [],
      );
      const seen = new Set<string>();
      return pairs.flatMap((pair): PendingTest[] => {
        const moduleText = pair.body?.split(/^-{3,}\|\|\|\s*$/m)[0]?.trim();
        const title = pair.title.split("\n")[0].trim();
        const slug = `${getSlug(area)}_${getSlug(title)}`;
        if (!moduleText || seen.has(slug) || !/^-{4,}\s*MODULE\s+Test\b/m.test(moduleText))
          return [];
        seen.add(slug);
        return [
          {
            directory: join(importDirectory, "sany/syntax", area),
            moduleName: slug,
            moduleText: `${moduleText.replace(/^(-{4,}\s*MODULE\s+)Test\b/m, `$1${slug}`)}\n`,
            metadata: {
              description: `${title}. Ported from SANY's syntax corpus.`,
              source: `${TOOLS_PATH}/${relative(toolsDirectory, path)}`,
              features: ["sany-syntax"],
              outcome: "success",
            },
            fixtures: [],
            isOutcomeObserved: true,
          },
        ];
      });
    });

const writePending = (pending: PendingTest) => {
  mkdirSync(pending.directory, { recursive: true });
  pending.fixtures.forEach((fixture) => {
    const target = join(pending.directory, fixture.as);
    if (fixture.from.endsWith(".tla")) {
      writeFileSync(target, readFileSync(fixture.from));
      return;
    }
    cpSync(fixture.from, target);
  });
  const path = join(pending.directory, `${pending.moduleName}.tla`);
  writeFileSync(path, renderTest(pending.metadata, pending.moduleText));
  return path;
};

const pendingTests = [
  ...portSemanticCorpus(),
  ...portErrorCorpus(),
  ...portParserCorpus(),
  ...listFiles(join(toolsDirectory, "test/tlc2"))
    .filter((path) => /Test\d*\.java$|ETest\d+\.java$/.test(path))
    .flatMap((path) => portModelTest(path) ?? []),
];

rmSync(importDirectory, { recursive: true, force: true });

const command = getHost("tlc");
const kept = { count: 0 };

await runPool(pendingTests, WORKERS, async (pending) => {
  const path = writePending(pending);
  const test = parseTest(path, readFileSync(path, "utf8"));
  if (!test) return;
  const result = await runTest(
    command,
    test,
    { name: "model", source: test.source, config: test.metadata.config ?? "" },
    { milliseconds: LIMIT_MILLISECONDS },
  );
  if (result.exit === -1) {
    skipped.push(`${test.id}: takes longer than ${LIMIT_MILLISECONDS} ms`);
    rmSync(path, { force: true });
    return;
  }
  const observed = getOutcomeForExit(result.exit);
  // The Java test may rely on what the suite can't set, such as a classpath or a JVM property.
  if (!pending.isOutcomeObserved && !isDeclaredOutcome(test, result)) {
    skipped.push(`${test.id}: exits ${result.exit} here, not ${pending.metadata.outcome}`);
    rmSync(path, { force: true });
    return;
  }
  if (pending.isOutcomeObserved && observed) {
    writeFileSync(path, renderTest({ ...pending.metadata, outcome: observed }, pending.moduleText));
  }
  kept.count += 1;
  if (kept.count % 100 === 0) console.log(`${kept.count}/${pendingTests.length}`);
});

skipped.sort().forEach((line) => console.log(`SKIPPED ${line}`));
console.log(`Ported ${kept.count} tests and skipped ${skipped.length}`);
