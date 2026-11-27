const HIGHLIGHT_COLORS = [
  "oklch(70% 0.17 255)",
  "oklch(70% 0.14 325)",
  "oklch(70% 0.17 20)",
  "oklch(70% 0.14 85)",
  "oklch(70% 0.17 142)",
];

export const getHighlightColors = (names: string[]): Record<string, string> =>
  Object.fromEntries(
    [...new Set(names)].map((name, index) => [
      name,
      HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
    ]),
  );
