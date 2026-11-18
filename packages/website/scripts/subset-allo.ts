import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import subsetFont from "subset-font";

// Writes Allo with only the text the site sets: Latin letters, punctuation, and a few arrows and
// signs, from its regular weight up. The full font stays declared behind this one, so any other
// character or a lighter weight still loads it.
const RANGES = [
  [0x20, 0x7e],
  [0xa0, 0x17f],
  [0x2010, 0x2027],
  [0x2030, 0x203a],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2190, 0x2193],
  [0x21b5, 0x21b5],
  [0x2212, 0x2212],
  [0x2318, 0x2318],
];
const WEIGHTS = { min: 400, max: 900 };
const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
const GENERATED_DIRECTORY = join(PACKAGE_DIRECTORY, "src/generated");

mkdirSync(GENERATED_DIRECTORY, { recursive: true });
writeFileSync(
  join(GENERATED_DIRECTORY, "allo.woff2"),
  await subsetFont(
    readFileSync(
      join(PACKAGE_DIRECTORY, "node_modules/allo-font/fonts/webfonts/AlloVariableFriendly.woff2"),
    ),
    RANGES.map(([from, to]) =>
      Array.from({ length: to - from + 1 }, (_code, index) =>
        String.fromCodePoint(from + index),
      ).join(""),
    ).join(""),
    // Browsers draw the glyphs a touch lighter when the font has lost their names.
    { targetFormat: "woff2", glyphNames: true, variationAxes: { wght: WEIGHTS } },
  ),
);
writeFileSync(
  join(GENERATED_DIRECTORY, "allo.css"),
  `@font-face {
  font-family: "Allo";
  src: url("./allo.woff2") format("woff2");
  font-weight: ${WEIGHTS.min} ${WEIGHTS.max};
  font-style: normal;
  font-display: swap;
  unicode-range: ${RANGES.map(([from, to]) => `U+${from.toString(16)}-${to.toString(16)}`).join(", ")};
}
`,
);
