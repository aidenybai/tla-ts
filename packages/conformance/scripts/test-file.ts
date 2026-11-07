import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { dump, load } from "js-yaml";
import { BACKEND_VERDICTS, getBackend, TLAPM_OUTCOME_EXITS } from "./tlapm";

export const SUITE_DIRECTORY = join(import.meta.dirname, "../test");

// What a test declares TLC does. Recording refuses any test that TLC's exit status contradicts, so
// a mistaken test can't become the expected behavior. tlc2/output/EC.java names the statuses.
export const OUTCOME_EXITS = {
  // A generated test only asks that every host behave as TLC does, whatever that is.
  any: [0, 10, 11, 12, 13, 14, 75, 76, 77, 150, 151, 152, 153, 255],
  success: [0],
  // TLC.main exits 1 when handleParameters rejects the command line.
  "usage-error": [1],
  "assumption-violation": [10],
  deadlock: [11],
  "safety-violation": [12],
  "liveness-violation": [13],
  "assertion-failure": [14],
  // An evaluation error exits differently by where it happens: 10 in an assumption, 75 to 77 in the
  // initial states, invariants and properties, and 255 in the next-state relation.
  "evaluation-failure": [10, 75, 76, 77, 255],
  "parse-error": [150],
  "config-error": [151],
  "state-space-too-large": [152],
  "system-error": [153],
  "tlc-error": [255],
};

export type Outcome = keyof typeof OUTCOME_EXITS;

export interface TestMetadata {
  description: string;
  outcome: string;
  // How a tlapm test runs tlapm: obligations, proof or encoding.
  mode?: string;
  ref?: string;
  source?: string;
  features?: string[];
  flags?: string[];
  // The evaluation contexts to run an expression test in, all of them by default.
  contexts?: string[];
  config?: string;
  args?: string[];
  includes?: string[];
}

export interface Recording {
  exit: number;
  transcript?: string;
}

export interface SuiteTest {
  id: string;
  // The oracle the test was recorded from: tlc or tlapm.
  suite: string;
  path: string;
  // The file a host reads: the module, or a backend's input.
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

const HEADER = /^\(\*---\n([\s\S]*?)\n---\*\)\n/;
const RECORDING = /\n\(\*--- recorded\n([\s\S]*?)\n---\*\)\n$/;
const MODULE_END = /^={4,}[ \t]*$/m;

// Every context shares this name, so a failure in one reads the same as in another.
const STATE = "conformance_state";

const getStateContext = (name: string, init: string, next: string, check: string) => ({
  name,
  appended: `VARIABLE ${STATE}\nInit == ${STATE} = ${init}\nNext == ${next}\nInv == ${check}`,
  config: "INIT Init\nNEXT Next\nINVARIANT Inv\n",
});

// test262 runs a test in strict and sloppy mode. TLC evaluates an expression along a different path
// in each of these places: Tool.eval, getInitStates, getNextStates and the invariant check, with
// the liveness tableau on top.
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
  const header = HEADER.exec(text);
  if (!header) return undefined;
  const recording = RECORDING.exec(text);
  const id = relative(SUITE_DIRECTORY, path).replace(/\.tla$/, "");
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

const listFiles = (directory: string): string[] =>
  readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? listFiles(path) : [path];
    });

// A file without a header is a fixture that a test includes.
export const findTests = (filters: string[]) =>
  listFiles(SUITE_DIRECTORY)
    .filter((path) => filters.length === 0 || filters.some((filter) => path.includes(filter)))
    .flatMap((path) => parseTest(path, readFileSync(path, "utf8")) ?? []);

// A backend test is the input itself, so the header and the recording are not part of it.
export const getBackendInput = (test: SuiteTest) => test.source.replace(HEADER, "");

// Whether a result is what the test declares, or undefined when the outcome is unknown.
export const isDeclaredOutcome = (test: SuiteTest, result: Recording) => {
  if (test.suite === "tlapm" && getBackend(test.path)) {
    if (test.metadata.outcome === "any") return true;
    if (!BACKEND_VERDICTS.includes(test.metadata.outcome)) return undefined;
    return result.transcript?.split("\n")[0] === test.metadata.outcome;
  }
  const exits: Record<string, number[]> =
    test.suite === "tlapm" ? TLAPM_OUTCOME_EXITS : OUTCOME_EXITS;
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

// Parses "2/8" into every eighth test starting from the third, for CI shards and samples.
export const getShard = <Item>(items: Item[], shard: string | undefined) => {
  if (!shard) return items;
  const parts = shard.split("/").map(Number);
  return items.filter((_, index) => index % parts[1] === parts[0]);
};

// Contexts that all recorded the same result share one entry under this key.
const ALL_CONTEXTS = "all";

export const formatYaml = (value: unknown) =>
  dump(value, { lineWidth: -1, noRefs: true }).trimEnd();

export const getRecording = (test: SuiteTest, context: string) =>
  test.recordings?.[context] ?? test.recordings?.[ALL_CONTEXTS];

const isSameRecording = (left: Recording, right: Recording) =>
  left.exit === right.exit && left.transcript === right.transcript;

export const writeRecordings = (test: SuiteTest, recordings: Record<string, Recording>) => {
  const entries = Object.values(recordings);
  const isUniform = entries.every((entry) => isSameRecording(entry, entries[0]));
  const stored = isUniform ? { [ALL_CONTEXTS]: entries[0] } : recordings;
  const block = formatYaml(stored);
  writeFileSync(test.path, `${test.source}\n(*--- recorded\n${block}\n---*)\n`);
};
