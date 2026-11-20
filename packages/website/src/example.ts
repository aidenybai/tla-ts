import { examples } from "virtual:site-data";
import { getHighlightColors } from "./highlight-colors";

const LABELS: Record<string, { article: string; label: string }> = {
  "search-box.ts": { article: "a", label: "React search box" },
  "likes.ts": { article: "a", label: "like button" },
  "hour-clock.ts": { article: "a", label: "clock" },
};

export const EXAMPLES = examples.map((example) => ({
  ...example,
  ...LABELS[example.fileName],
  highlights: getHighlightColors(example.highlightNames),
}));
