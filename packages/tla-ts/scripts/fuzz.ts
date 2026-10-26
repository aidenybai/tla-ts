import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compareOutcome, runModel, type ModelOutcome } from "./check-model";
import {
  createCase,
  getSimplestTerm,
  isSameType,
  render,
  renderCase,
  type FuzzCase,
  type Term,
} from "./fuzz-generator";
import { getJarPath, runTlc, type TlcRun } from "./tlc";

type FindingKind = "status" | "counts" | "print" | "crash" | "slow";

interface Finding {
  kind: FindingKind;
  detail: string;
}

interface CaseRun {
  finding: Finding | undefined;
  tlc: TlcRun;
  actual: ModelOutcome | undefined;
}

interface Slot {
  get: (fuzzCase: FuzzCase) => Term;
  set: (fuzzCase: FuzzCase, term: Term) => FuzzCase;
}

const CONCURRENCY = 2;
const MINIMUM_LIMIT_MILLISECONDS = 10000;
const LIMIT_FACTOR = 20;
const FUZZ_DIRECTORY = join(import.meta.dirname, "../.fuzz");

const getArgument = (name: string) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const seed = Number(getArgument("--seed") ?? Math.floor(Math.random() * 2 ** 31));
const count = Number(getArgument("--count") ?? 100);
const depth = Number(getArgument("--depth") ?? 3);
const slowRatio = Number(getArgument("--slow-ratio") ?? 2);
const isShrinking = !process.argv.includes("--no-shrink");
const jarPath = getJarPath();

const findValueEnd = (text: string, start: number) => {
  const state = { depth: 0, isString: false };
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (state.isString) {
      if (character === "\\") index++;
      else if (character === '"') state.isString = false;
      continue;
    }
    if (character === '"') state.isString = true;
    else if (text.startsWith("<<", index)) {
      state.depth++;
      index++;
    } else if (text.startsWith(">>", index)) {
      if (state.depth === 0) return index;
      state.depth--;
      index++;
    } else if ("([{".includes(character)) state.depth++;
    else if (")]}".includes(character)) state.depth--;
  }
  return text.length;
};

const MARKER = '<<"@';

const isWhitespace = (character: string) =>
  character === " " || character === "\n" || character === "\r" || character === "\t";

// The values each ASSUME printed, without the line breaks TLC adds to wide values.
const getPrints = (output: string) => {
  const characters: string[] = [];
  for (const character of output) if (!isWhitespace(character)) characters.push(character);
  const text = characters.join("");
  const prints: string[] = [];
  for (let start = text.indexOf(MARKER); start !== -1; start = text.indexOf(MARKER, start + 1)) {
    const valueStart = text.indexOf(",", start) + 1;
    prints.push(text.slice(valueStart, findValueEnd(text, valueStart)));
  }
  return prints;
};

const getFinding = (tlc: TlcRun, actual: ModelOutcome | undefined): Finding | undefined => {
  if (!actual) return { kind: "crash", detail: "tla-ts crashed or ran past the time limit" };
  const difference = compareOutcome(tlc.result, actual);
  if (difference) {
    return { kind: difference.startsWith("expected ") ? "status" : "counts", detail: difference };
  }
  const expectedPrints = getPrints(tlc.output);
  const actualPrints = getPrints((actual.prints ?? []).join("\n"));
  const index = expectedPrints.findIndex((print, item) => print !== actualPrints[item]);
  if (index !== -1 || expectedPrints.length !== actualPrints.length) {
    const item = index === -1 ? expectedPrints.length : index;
    return {
      kind: "print",
      detail: `print ${item}: TLC printed ${expectedPrints[item] ?? "nothing"}, tla-ts printed ${actualPrints[item] ?? "nothing"}`,
    };
  }
  if (actual.milliseconds > slowRatio * tlc.result.tlcMilliseconds) {
    return {
      kind: "slow",
      detail: `tla-ts took ${actual.milliseconds} ms, TLC took ${tlc.result.tlcMilliseconds} ms`,
    };
  }
  return undefined;
};

const runCase = async (fuzzCase: FuzzCase, directory: string): Promise<CaseRun> => {
  mkdirSync(directory, { recursive: true });
  const rendered = renderCase(fuzzCase);
  const specPath = join(directory, "Fuzz.tla");
  const configPath = join(directory, "Fuzz.cfg");
  writeFileSync(specPath, rendered.spec);
  writeFileSync(configPath, rendered.config);
  const tlc = await runTlc({ id: directory, directory, specPath, configPath }, jarPath);
  const actual = await runModel(specPath, configPath, {
    isPrinting: true,
    limitMilliseconds: Math.max(
      MINIMUM_LIMIT_MILLISECONDS,
      LIMIT_FACTOR * tlc.result.tlcMilliseconds,
    ),
  });
  return { finding: getFinding(tlc, actual), tlc, actual };
};

const getPaths = (term: Term, path: number[] = []): number[][] => [
  path,
  ...term.children.flatMap((child, index) => getPaths(child, [...path, index])),
];

const getAt = (term: Term, path: number[]) =>
  path.reduce((current, index) => current.children[index], term);

const replaceAt = (term: Term, path: number[], replacement: Term): Term =>
  path.length === 0
    ? replacement
    : {
        ...term,
        children: term.children.map((child, index) =>
          index === path[0] ? replaceAt(child, path.slice(1), replacement) : child,
        ),
      };

const getSlots = (fuzzCase: FuzzCase): Slot[] => [
  ...fuzzCase.assumptions.map((_, index) => ({
    get: (current: FuzzCase) => current.assumptions[index],
    set: (current: FuzzCase, term: Term) => ({
      ...current,
      assumptions: current.assumptions.with(index, term),
    }),
  })),
  ...fuzzCase.init.map((_, index) => ({
    get: (current: FuzzCase) => current.init[index],
    set: (current: FuzzCase, term: Term) => ({ ...current, init: current.init.with(index, term) }),
  })),
  ...fuzzCase.actions.map((_, index) => ({
    get: (current: FuzzCase) => current.actions[index],
    set: (current: FuzzCase, term: Term) => ({
      ...current,
      actions: current.actions.with(index, term),
    }),
  })),
  ...(fuzzCase.invariant
    ? [
        {
          get: (current: FuzzCase) => current.invariant ?? getSimplestTerm({ kind: "Bool" }),
          set: (current: FuzzCase, term: Term) => ({ ...current, invariant: term }),
        },
      ]
    : []),
];

// Smaller variants of a case: fewer assumptions, actions, or invariants first, then each
// subterm replaced by the simplest term of its type or by one of its children of that type.
const getCandidates = (fuzzCase: FuzzCase): (() => FuzzCase)[] => [
  ...fuzzCase.assumptions.map((_, index) => () => ({
    ...fuzzCase,
    assumptions: fuzzCase.assumptions.toSpliced(index, 1),
  })),
  ...(fuzzCase.actions.length > 1
    ? fuzzCase.actions.map((_, index) => () => ({
        ...fuzzCase,
        actions: fuzzCase.actions.toSpliced(index, 1),
      }))
    : []),
  ...(fuzzCase.invariant ? [() => ({ ...fuzzCase, invariant: undefined })] : []),
  ...(fuzzCase.isDeadlockChecked ? [() => ({ ...fuzzCase, isDeadlockChecked: false })] : []),
  ...getSlots(fuzzCase).flatMap((slot) => {
    const term = slot.get(fuzzCase);
    return getPaths(term).flatMap((path) => {
      const node = getAt(term, path);
      return [
        getSimplestTerm(node.type),
        ...(node.isBinding
          ? []
          : node.children.filter((child) => isSameType(child.type, node.type))),
      ]
        .filter((replacement) => render(replacement) !== render(node))
        .map((replacement) => () => slot.set(fuzzCase, replaceAt(term, path, replacement)));
    });
  }),
];

const shrink = async (fuzzCase: FuzzCase, kind: FindingKind, directory: string) => {
  for (const getCandidate of getCandidates(fuzzCase)) {
    const candidate = getCandidate();
    const run = await runCase(candidate, directory);
    if (run.finding?.kind === kind) return shrink(candidate, kind, directory);
  }
  return fuzzCase;
};

const tally = new Map<string, number>();
const totals = { tlc: 0, tlaTs: 0 };
const queue = Array.from({ length: count }, (_, index) => seed + index);

const work = async () => {
  for (let caseSeed = queue.shift(); caseSeed !== undefined; caseSeed = queue.shift()) {
    const directory = join(FUZZ_DIRECTORY, String(caseSeed));
    const fuzzCase = createCase(caseSeed, depth);
    const run = await runCase(fuzzCase, directory);
    const outcome = run.finding?.kind ?? `${run.tlc.result.status}`;
    tally.set(outcome, (tally.get(outcome) ?? 0) + 1);
    totals.tlc += run.tlc.result.tlcMilliseconds;
    totals.tlaTs += run.actual?.milliseconds ?? 0;
    if (!run.finding) {
      rmSync(directory, { recursive: true, force: true });
      continue;
    }
    const isCorrectness = run.finding.kind !== "slow";
    const shrunk =
      isShrinking && isCorrectness ? await shrink(fuzzCase, run.finding.kind, directory) : fuzzCase;
    const final = await runCase(shrunk, directory);
    writeFileSync(
      join(directory, "finding.json"),
      `${JSON.stringify({ seed: caseSeed, ...final.finding, tlc: final.tlc.result, tlaTs: final.actual }, null, 2)}\n`,
    );
    console.log(
      `${run.finding.kind.padEnd(6)} ${directory}  ${final.finding?.detail ?? run.finding.detail}`,
    );
  }
};

console.log(`Fuzzing ${count} cases from seed ${seed}`);
await Promise.all(Array.from({ length: CONCURRENCY }, work));
console.log(
  `\n${[...tally].map(([outcome, total]) => `${outcome}: ${total}`).join(", ")}\nTLC ${totals.tlc} ms, tla-ts ${totals.tlaTs} ms`,
);
