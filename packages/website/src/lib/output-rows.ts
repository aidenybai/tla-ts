import type { RunResult } from "./run-worker";
import type { Mark, Token } from "./site-data";

// The definitions that every model has, which a reader looks for by name.
const MODEL_NAMES = ["Init", "Next", "Spec"];
const DEFINITION_NAME = /^(\w+)(?:\(.*\))? ==/;
// The lines that frame every module.
const MODULE_FRAME = /^(?:-{4}|={4}|EXTENDS\b|VARIABLES?\b)/;

export type OutputRow =
  | { kind: "line"; number: number; tokens: Token[] }
  | { kind: "comment"; text: string }
  | { kind: "fold"; name: string; lineCount: number; isOpen: boolean };

export interface OutputRowsInput {
  lines: Token[][];
  lineMarks: Mark[][];
  source: string;
  sourceMarks: Mark[];
  // The folds that the reader opened, each by its first line.
  openFolds: ReadonlySet<string>;
  // The lines that a run points at, whose folds open.
  pinnedLines: ReadonlySet<number>;
}

interface Block {
  name: string | undefined;
  start: number;
  end: number;
}

// The rows of a program's module as the playground shows it. ESCore's code of a program is mostly
// what every program needs to run, so the rows keep the definitions that the program's own code
// compiles to, under the TypeScript they came from, and the model's actions and checks. The rest
// folds away where it sits.
export const getOutputRows = (input: OutputRowsInput): OutputRow[] => {
  const texts = input.lines.map((tokens) => tokens.map((token) => token.content).join(""));
  const blocks = texts.reduce<Block[]>((found, text, index) => {
    const last = found.at(-1);
    if (last && /^\s/.test(text)) last.end = index + 1;
    else found.push({ name: DEFINITION_NAME.exec(text)?.[1], start: index, end: index + 1 });
    return found;
  }, []);
  const shownNames = new Set([...MODEL_NAMES, ...input.sourceMarks.map((mark) => mark.name)]);
  const getLines = (start: number, end: number): OutputRow[] =>
    input.lines
      .slice(start, end)
      .map((tokens, index) => ({ kind: "line", number: start + index + 1, tokens }));
  const commented = new Set<string>();
  const rows: OutputRow[] = [];
  let hidden: Block[] = [];
  const foldHidden = () => {
    const first = hidden.at(0);
    const last = hidden.at(-1);
    if (!first || !last) return;
    const isOpen =
      input.openFolds.has(texts[first.start]) ||
      [...input.pinnedLines].some((line) => line > first.start && line <= last.end);
    rows.push({
      kind: "fold",
      name: texts[first.start],
      lineCount: last.end - first.start,
      isOpen,
    });
    if (isOpen) rows.push(...getLines(first.start, last.end));
    hidden = [];
  };
  const isShown = blocks.map((block) => {
    if (block.name === undefined) return MODULE_FRAME.test(texts[block.start]) || undefined;
    return input.lineMarks[block.start]?.at(0) !== undefined || shownNames.has(block.name);
  });
  // A comment or a RECURSIVE line goes with the definition after it.
  for (let index = blocks.length - 1; index >= 0; index--)
    isShown[index] ??= isShown[index + 1] ?? false;
  for (const [index, block] of blocks.entries()) {
    const region = input.lineMarks[block.start]?.at(0)?.name;
    if (!isShown[index]) {
      hidden.push(block);
      continue;
    }
    foldHidden();
    const mark = input.sourceMarks.find((found) => found.name === region);
    if (mark && !commented.has(mark.name)) {
      commented.add(mark.name);
      const [first, ...rest] = input.source.slice(mark.start, mark.end).trim().split("\n");
      rows.push({ kind: "comment", text: `\\* ${first}${rest.length > 0 ? " ..." : ""}` });
    }
    rows.push(...getLines(block.start, block.end));
  }
  foldHidden();
  return rows;
};

// The lines that a run points at: its notes, the states it found, and the line it stopped on.
export const getRunLines = (result: RunResult | undefined): ReadonlySet<number> =>
  new Set([
    ...(result?.notes.map((note) => note.line) ?? []),
    ...(result?.search?.states.flatMap((state) => state.line ?? []) ?? []),
    ...(result?.activeLine === undefined ? [] : [result.activeLine]),
  ]);
