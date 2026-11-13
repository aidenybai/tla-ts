import { examples } from "virtual:site-data";
import { getHighlightColors } from "./highlight-colors";

const LABELS: Record<string, { article: string; label: string }> = {
  "likes.ts": { article: "a", label: "like button" },
  "overdraft.ts": { article: "a", label: "bank transfer" },
  "hour-clock.ts": { article: "a", label: "clock" },
};

export const EXAMPLES = examples.map((example) => ({
  ...example,
  ...LABELS[example.fileName],
  highlights: getHighlightColors(example.highlightNames),
}));
