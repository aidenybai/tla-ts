import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { dirname, join, relative } from "node:path";
import ts from "@typescript/typescript6";
import { createProgram } from "../../tla-ts/src/typescript/program";
import { getHost, runPool, runTest } from "./hosts";
import { formatYaml, listFiles, parseTest, SUITE_DIRECTORY, type TestMetadata } from "./test-file";
import { CODEBASES, findProject, TYPESCRIPT_DIRECTORY } from "./typescript";

const LIMIT_MILLISECONDS = 10_000;
const WORKERS = Number(process.env.CONFORMANCE_WORKERS ?? Math.min(4, availableParallelism()));

const importDirectory = join(SUITE_DIRECTORY, "typescript");
const casesDirectory = join(TYPESCRIPT_DIRECTORY, "tests/cases");

if (!existsSync(casesDirectory)) {
  console.error("Run `pnpm fetch-typescript` first");
  process.exit(1);
}

// Cases in several files, and options that change what a program does where it runs.
const UNPORTABLE_CASE = [
  /^\s*\/\/\s*@filename\s*:/im,
  /^\s*\/\/\/\s*<reference/m,
  /^\s*\/\/\s*@(jsx|allowJs|checkJs|experimentalDecorators|emitDecoratorMetadata|useDefineForClassFields)\b/im,
];

// A case's imports, exports and ambient declarations name what only a host gives it, and tla-ts
// reads its exported functions as a spec's actions and checks.
const isScript = (sourceFile: ts.SourceFile) => {
  const isOutside = (node: ts.Node) =>
    ts.isImportDeclaration(node) ||
    ts.isImportEqualsDeclaration(node) ||
    ts.isExportDeclaration(node) ||
    ts.isExportAssignment(node) ||
    (ts.canHaveModifiers(node) &&
      (ts.getModifiers(node) ?? []).some(
        (modifier) =>
          modifier.kind === ts.SyntaxKind.ExportKeyword ||
          modifier.kind === ts.SyntaxKind.DeclareKeyword,
      ));
  // Some cases nest expressions deeper than a recursive walk's stack.
  const pending: ts.Node[] = [sourceFile];
  for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
    if (isOutside(node)) return false;
    ts.forEachChild(node, (child) => {
      pending.push(child);
    });
  }
  return true;
};

// A case that tla-ts's type checker rejects has no program for tla-ts to check. Its early errors
// stay, as Node shows whether the program parses.
const hasTypeErrors = (path: string, text: string) => {
  const failure = (() => {
    try {
      createProgram(text, path);
      return undefined;
    } catch (error) {
      return String(error);
    }
  })();
  return failure !== undefined && /error TS\d+:/.test(failure);
};

interface Pending {
  path: string;
  text: string;
  isOutcomeObserved: boolean;
}

const renderTest = (metadata: TestMetadata, text: string) =>
  `/*---\n${formatYaml(metadata)}\n---*/\n${text}`;

const getCases = (): Pending[] =>
  ["compiler", "conformance"]
    .flatMap((part) => listFiles(join(casesDirectory, part)))
    .filter((path) => path.endsWith(".ts") && !path.endsWith(".d.ts"))
    .flatMap((path) => {
      const text = readFileSync(path, "utf8");
      if (UNPORTABLE_CASE.some((pattern) => pattern.test(text))) return [];
      const source = relative(TYPESCRIPT_DIRECTORY, path);
      if (!isScript(ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true))) return [];
      if (hasTypeErrors(path, text)) return [];
      return [
        {
          path: join(importDirectory, "cases", relative(casesDirectory, path)),
          text: renderTest(
            { description: `Ported from TypeScript's ${source}.`, outcome: "success", source },
            text,
          ),
          isOutcomeObserved: true,
        },
      ];
    });

const getCodebaseFiles = (): Pending[] =>
  Object.entries(CODEBASES).flatMap((entry) =>
    entry[1].sources
      .flatMap((directory) => listFiles(join(entry[1].root, directory)))
      .filter(
        (path) =>
          path.endsWith(".ts") &&
          !path.endsWith(".d.ts") &&
          findProject(path, entry[1].root) !== undefined,
      )
      .map((path) => {
        const source = relative(entry[1].root, path);
        return {
          path: join(importDirectory, "codebases", entry[0], source),
          text: renderTest(
            {
              description: `tla-ts model checks ${entry[0]}'s ${source}.`,
              outcome: "success",
              codebase: entry[0],
              source,
            },
            "",
          ),
          isOutcomeObserved: false,
        };
      }),
  );

const pendingTests = [...getCases(), ...getCodebaseFiles()];
rmSync(importDirectory, { recursive: true, force: true });

const oracle = getHost("typescript");
const skipped: string[] = [];
const kept = { count: 0 };

await runPool(pendingTests, WORKERS, async (pending) => {
  const test = parseTest(pending.path, pending.text);
  if (!test) return;
  const result = await runTest(
    oracle,
    test,
    { name: "model", source: test.source, config: "" },
    { milliseconds: LIMIT_MILLISECONDS },
  );
  if (result.exceeded || result.exit > 1) {
    skipped.push(`${test.id}: ${result.exceeded ? "takes too long" : result.transcript}`);
    return;
  }
  if (!pending.isOutcomeObserved && result.exit !== 0) {
    skipped.push(`${test.id}: ${result.transcript}`);
    return;
  }
  mkdirSync(dirname(pending.path), { recursive: true });
  writeFileSync(
    pending.path,
    pending.isOutcomeObserved && result.exit === 1
      ? pending.text.replace("\noutcome: success\n", "\noutcome: throws\n")
      : pending.text,
  );
  kept.count += 1;
  if (kept.count % 200 === 0) console.log(`${kept.count}/${pendingTests.length}`);
});

skipped.sort().forEach((line) => console.log(`SKIPPED ${line}`));
console.log(`Ported ${kept.count} tests and skipped ${skipped.length}`);
