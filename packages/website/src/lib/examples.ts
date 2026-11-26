import { examples } from "virtual:site-data";

const LABELS: Record<string, { article: string; label: string }> = {
  "likes.ts": { article: "a", label: "like button" },
  "search-box.ts": { article: "a", label: "React search box" },
  "hour-clock.ts": { article: "a", label: "TLA+ clock" },
};

export const EXAMPLES = examples.map((example) => ({
  ...example,
  ...LABELS[example.fileName],
}));
