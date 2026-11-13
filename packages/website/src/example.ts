import { examples } from "virtual:site-data";
import { getHighlightColors } from "./highlight-colors";
import type { LineNote } from "./run-worker";

interface Label {
  article: string;
  label: string;
  hints: LineNote[];
}

const LABELS: Record<string, Label> = {
  "likes.ts": {
    article: "a",
    label: "like button",
    hints: [
      { line: 1, text: "the state", tone: "hint" },
      { line: 3, text: "called in every order", tone: "hint" },
      { line: 7, text: "this one too", tone: "hint" },
      { line: 11, text: "checked after every call", tone: "hint" },
    ],
  },
  "overdraft.ts": { article: "a", label: "bank transfer", hints: [] },
  "hour-clock.ts": { article: "a", label: "clock", hints: [] },
};

export const EXAMPLES = examples.map((example) => ({
  ...example,
  ...LABELS[example.fileName],
  highlights: getHighlightColors(example.highlightNames),
}));
