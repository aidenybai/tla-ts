import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { dump, load } from "js-yaml";

export const SUITE_DIRECTORY = join(import.meta.dirname, "../test");

export const OUTCOME_EXITS = {
  any: [0, 10, 11, 12, 13, 14, 75, 76, 77, 150, 151, 152, 153, 255],
  success: [0],
  "usage-error": [1],
  "assumption-violation": [10],
  deadlock: [11],
  "safety-violation": [12],
  "liveness-violation": [13],
  "assertion-failure": [14],
  "evaluation-failure": [10, 75, 76, 77, 255],
  "parse-error": [150],
  "config-error": [151],
  "state-space-too-large": [152],
  "system-error": [153],
  "tlc-error": [255],
};

export type Outcome = keyof typeof OUTCOME_EXITS;

// A TypeScript test's oracle prints success or throws, and a tla-ts host prints untranslatable where
// it can't compile or check the program.
export const TYPESCRIPT_OUTCOME_EXITS = { success: [0], throws: [1] };

export const UNTRANSLATABLE_EXIT = 2;

export interface TestMetadata {
  description: string;
  outcome: string;
  ref?: string;
  source?: string;
  features?: string[];
  flags?: string[];
  contexts?: string[];
  config?: string;
  args?: string[];
  includes?: string[];
  stack?: string;
  correct?: Record<string, Recording>;
  // A TypeScript test that checks a file of a codebase, rather than its own text.
  codebase?: string;
}

export interface Recording {
  exit: number;
  transcript?: string;
}

export interface SuiteTest {
  id: string;
  suite: string;
  path: string;
  fileName: string;
  moduleName: string;
  metadata: TestMetadata;
  source: string;
  recordings: Record<string, Recording> | undefined;
}

export interface TestContext {
  name: string;
  source: string;
  config: string;
}

// TLA+ tests keep their metadata in (*--- *) comments, and TypeScript tests in /*--- */ comments.
const COMMENTS = {
  ".tla": { open: "(*", close: "*)" },
  ".ts": { open: "/*", close: "*/" },
};

const escape = (text: string) => text.replace(/[*()/]/g, "\\$&");

const getComment = (path: string) => COMMENTS[extname(path) === ".ts" ? ".ts" : ".tla"];

const getHeader = (path: string) => {
  const comment = getComment(path);
  return new RegExp(`^${escape(comment.open)}---\\n([\\s\\S]*?)\\n---${escape(comment.close)}\\n`);
};

const getRecordingPattern = (path: string) => {
  const comment = getComment(path);
  return new RegExp(
    `\\n${escape(comment.open)}--- recorded\\n([\\s\\S]*?)\\n---${escape(comment.close)}\\n$`,
  );
};
const MODULE_END = /^={4,}[ \t]*$/m;

const STATE = "conformance_state";

const getStateContext = (name: string, init: string, next: string, check: string) => ({
  name,
  appended: `VARIABLE ${STATE}\nInit == ${STATE} = ${init}\nNext == ${next}\nInv == ${check}`,
  config: "INIT Init\nNEXT Next\nINVARIANT Inv\n",
});

const EXPRESSION_CONTEXTS = [
  { name: "assume", appended: "ASSUME Test", config: "" },
  getStateContext("init", "Test", `UNCHANGED ${STATE}`, STATE),
  getStateContext("next", "TRUE", `${STATE}' = Test`, STATE),
  getStateContext("invariant", "TRUE", `UNCHANGED ${STATE}`, `${STATE} /\\ Test`),
  {
    name: "property",
    appended: `VARIABLE ${STATE}\nSpec == ${STATE} = TRUE /\\ [][UNCHANGED ${STATE}]_${STATE}\nProp == [](${STATE} /\\ Test)`,
    config: "SPECIFICATION Spec\nPROPERTY Prop\n",
  },
];

const getLastModuleEnd = (source: string) => {
  const matches = [...source.matchAll(new RegExp(MODULE_END, "gm"))];
  return matches.at(-1)?.index;
};

const appendToModule = (source: string, text: string) => {
  const end = getLastModuleEnd(source);
  if (end === undefined) throw new Error("The test has no module end line");
  return `${source.slice(0, end)}${text}\n${source.slice(end)}`;
};

export const parseTest = (path: string, text: string): SuiteTest | undefined => {
  const header = getHeader(path).exec(text);
  if (!header) return undefined;
  const recording = getRecordingPattern(path).exec(text);
  const id = relative(SUITE_DIRECTORY, path).replace(/\.(tla|ts)$/, "");
  return {
    id,
    suite: id.split("/")[0],
    path,
    fileName: basename(path),
    moduleName: basename(path, extname(path)),
    metadata: load(header[1]) as TestMetadata,
    source: `${(recording ? text.slice(0, recording.index) : text).trimEnd()}\n`,
    recordings: recording ? (load(recording[1]) as Record<string, Recording>) : undefined,
  };
};

export const listFiles = (directory: string): string[] =>
  readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? listFiles(path) : [path];
    });

export const findTests = (filters: string[]) =>
  listFiles(SUITE_DIRECTORY)
    .filter((path) => filters.length === 0 || filters.some((filter) => path.includes(filter)))
    .flatMap((path) => parseTest(path, readFileSync(path, "utf8")) ?? []);

export const isDeclaredOutcome = (test: SuiteTest, result: Recording) => {
  const exits: Record<string, number[]> =
    test.suite === "typescript" ? TYPESCRIPT_OUTCOME_EXITS : OUTCOME_EXITS;
  return exits[test.metadata.outcome]?.includes(result.exit);
};

export const getContexts = (test: SuiteTest): TestContext[] =>
  test.suite === "tlc" && test.metadata.flags?.includes("expression")
    ? EXPRESSION_CONTEXTS.filter(
        (context) => !test.metadata.contexts || test.metadata.contexts.includes(context.name),
      ).map((context) => ({
        name: context.name,
        source: appendToModule(test.source, context.appended),
        config: `${context.config}${test.metadata.config ?? ""}`,
      }))
    : [{ name: "model", source: test.source, config: test.metadata.config ?? "" }];

export const getShard = <Item>(items: Item[], shard: string | undefined) => {
  if (!shard) return items;
  const parts = shard.split("/").map(Number);
  return items.filter((_, index) => index % parts[1] === parts[0]);
};

const ALL_CONTEXTS = "all";

export const formatYaml = (value: unknown) =>
  dump(value, { lineWidth: -1, noRefs: true }).trimEnd();

export const getRecording = (test: SuiteTest, context: string) =>
  test.recordings?.[context] ?? test.recordings?.[ALL_CONTEXTS];

export const getCorrection = (test: SuiteTest, context: string) =>
  test.metadata.correct?.[context] ?? test.metadata.correct?.[ALL_CONTEXTS];

export const keepCorrection = (
  existing: SuiteTest | undefined,
  metadata: TestMetadata,
  moduleText: string,
) =>
  existing?.metadata.correct && existing.source.endsWith(`---*)\n${moduleText}`)
    ? { ...metadata, correct: existing.metadata.correct }
    : metadata;

const isSameRecording = (left: Recording, right: Recording) =>
  left.exit === right.exit && left.transcript === right.transcript;

export const writeRecordings = (test: SuiteTest, recordings: Record<string, Recording>) => {
  const entries = Object.values(recordings);
  const isUniform = entries.every((entry) => isSameRecording(entry, entries[0]));
  const stored = isUniform ? { [ALL_CONTEXTS]: entries[0] } : recordings;
  const comment = getComment(test.path);
  writeFileSync(
    test.path,
    `${test.source}\n${comment.open}--- recorded\n${formatYaml(stored)}\n---${comment.close}\n`,
  );
};
