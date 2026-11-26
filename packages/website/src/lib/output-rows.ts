import type { RunResult } from "./run-worker";
import type { Mark, Token } from "./site-data";

const MODEL_NAMES = ["Init", "Next", "Spec"];
const DEFINITION_NAME = /^(\w+)(?:\(.*\))? ==/;
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

interface Run {
  isShown: boolean;
  blocks: Block[];
}

// Most of a program's module is what every program needs to run. The rows keep the lines that
// carry a mark, under the TypeScript the mark came from, and the model. The rest folds away.
export const getOutputRows = (input: OutputRowsInput): OutputRow[] => {
  const texts = input.lines.map((tokens) => tokens.map((token) => token.content).join(""));
  const blocks = texts.reduce<Block[]>((found, text, index) => {
    const last = found.at(-1);
    if (last && /^\s/.test(text)) last.end = index + 1;
    else found.push({ name: DEFINITION_NAME.exec(text)?.[1], start: index, end: index + 1 });
    return found;
  }, []);
  const sourceMarks = new Map(input.sourceMarks.map((mark) => [mark.name, mark]));
  const isShown = blocks.map((block) => {
    if (block.name === undefined) return MODULE_FRAME.test(texts[block.start]) || undefined;
    return (
      input.lineMarks[block.start]?.at(0) !== undefined ||
      MODEL_NAMES.includes(block.name) ||
      sourceMarks.has(block.name)
    );
  });
  // A comment or a RECURSIVE line goes with the definition after it.
  for (let index = blocks.length - 1; index >= 0; index--)
    isShown[index] ??= isShown[index + 1] ?? false;
  const runs = blocks.reduce<Run[]>((found, block, index) => {
    const last = found.at(-1);
    if (last && last.isShown === isShown[index]) last.blocks.push(block);
    else found.push({ isShown: isShown[index] ?? false, blocks: [block] });
    return found;
  }, []);
  const getLines = (start: number, end: number): OutputRow[] =>
    input.lines
      .slice(start, end)
      .map((tokens, index) => ({ kind: "line", number: start + index + 1, tokens }));
  const commented = new Set<string>();
  return runs.flatMap((run): OutputRow[] => {
    const start = run.blocks[0].start;
    const end = run.blocks[run.blocks.length - 1].end;
    if (run.isShown)
      return run.blocks.flatMap((block) => [
        ...(input.lineMarks[block.start] ?? []).flatMap((lineMark): OutputRow[] => {
          const mark = sourceMarks.get(lineMark.name);
          if (!mark || commented.has(mark.name)) return [];
          commented.add(mark.name);
          const [first, ...rest] = input.source.slice(mark.start, mark.end).trim().split("\n");
          return [{ kind: "comment", text: `\\* ${first}${rest.length > 0 ? " ..." : ""}` }];
        }),
        ...getLines(block.start, block.end),
      ]);
    const isOpen =
      input.openFolds.has(texts[start]) ||
      [...input.pinnedLines].some((line) => line > start && line <= end);
    return [
      { kind: "fold", name: texts[start], lineCount: end - start, isOpen },
      ...(isOpen ? getLines(start, end) : []),
    ];
  });
};

export const getRunLines = (result: RunResult | undefined): ReadonlySet<number> =>
  new Set([
    ...(result?.notes.map((note) => note.line) ?? []),
    ...(result?.search?.states.flatMap((state) => state.line ?? []) ?? []),
    ...(result?.activeLine === undefined ? [] : [result.activeLine]),
  ]);
