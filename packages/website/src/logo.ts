const LOGO_ROWS = [
  "....X....",
  "....X....",
  "....X..XX",
  "...XXXX..",
  "XXX.X....",
  "....X....",
  "....X....",
  "....X...X",
  "....XXXXX",
];

export const LOGO_PATH = LOGO_ROWS.flatMap((row, y) =>
  [...row].flatMap((cell, x) => (cell === "X" ? [`M${x} ${y}h1v1h-1z`] : [])),
).join("");
