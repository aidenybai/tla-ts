import { examples } from "virtual:site-data";

const HIGHLIGHT_COLORS = [
  "rgb(25, 133, 255)",
  "rgb(174, 97, 174)",
  "rgb(255, 97, 106)",
  "rgb(250, 192, 61)",
  "rgb(115, 192, 88)",
];

const LABELS: Record<string, { article: string; label: string }> = {
  "counter.ts": { article: "a", label: "counter" },
  "overdraft.ts": { article: "a", label: "bank transfer" },
  "hour-clock.ts": { article: "a", label: "clock" },
};

export const EXAMPLES = examples.map((example) => ({
  ...example,
  ...LABELS[example.fileName],
  highlights: Object.fromEntries(
    example.highlightNames.map((name, index) => [
      name,
      HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
    ]),
  ),
}));
