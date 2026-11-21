const HIGHLIGHT_COLORS = [
  "rgb(25, 133, 255)",
  "rgb(174, 97, 174)",
  "rgb(255, 97, 106)",
  "rgb(250, 192, 61)",
  "rgb(115, 192, 88)",
];

export const getHighlightColors = (names: string[]): Record<string, string> =>
  Object.fromEntries(
    [...new Set(names)].map((name, index) => [
      name,
      HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
    ]),
  );
