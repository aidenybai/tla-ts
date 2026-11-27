import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import subsetFont from "subset-font";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
const GENERATED_DIRECTORY = join(PACKAGE_DIRECTORY, "src/generated");

const getText = (ranges: number[][]) =>
  ranges
    .map(([from, to]) =>
      Array.from({ length: to - from + 1 }, (_code, index) =>
        String.fromCodePoint(from + index),
      ).join(""),
    )
    .join("");

// Each font with only the text the site sets in it. The full font stays declared behind the
// smaller one, so any other character or weight still loads it.
const FONTS = [
  {
    family: "Allo",
    fileName: "allo.woff2",
    source: "node_modules/allo-font/fonts/webfonts/AlloVariableFriendly.woff2",
    // English letters, punctuation, and a few arrows and signs, from the regular weight up.
    text: getText([
      [0x20, 0x7e],
      [0xa0, 0xa0],
      [0xd7, 0xd7],
      [0x2010, 0x2027],
      [0x2030, 0x203a],
      [0x20ac, 0x20ac],
      [0x2122, 0x2122],
      [0x2190, 0x2193],
      [0x21b5, 0x21b5],
      [0x2212, 0x2212],
      [0x2318, 0x2318],
    ]),
    weight: "400 900",
    variationAxes: { wght: { min: 400, max: 900 } },
  },
  {
    family: "Caveat",
    fileName: "caveat.woff2",
    source: "node_modules/@fontsource/caveat/files/caveat-latin-600-normal.woff2",
    text: "Click me!",
    weight: "600",
    variationAxes: undefined,
  },
];

mkdirSync(GENERATED_DIRECTORY, { recursive: true });
for (const font of FONTS) {
  writeFileSync(
    join(GENERATED_DIRECTORY, font.fileName),
    await subsetFont(readFileSync(join(PACKAGE_DIRECTORY, font.source)), font.text, {
      targetFormat: "woff2",
      // Browsers draw the glyphs a touch lighter when the font has lost their names.
      glyphNames: true,
      variationAxes: font.variationAxes,
    }),
  );
}
writeFileSync(
  join(GENERATED_DIRECTORY, "fonts.css"),
  FONTS.map(
    (font) => `@font-face {
  font-family: "${font.family}";
  src: url("./${font.fileName}") format("woff2");
  font-weight: ${font.weight};
  font-style: normal;
  font-display: swap;
  unicode-range: ${[...new Set(font.text)]
    .map((character) => `U+${character.codePointAt(0)?.toString(16)}`)
    .join(", ")};
}
`,
  ).join("\n"),
);
