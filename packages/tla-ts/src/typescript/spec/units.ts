// The characters that a TLA+ string can hold, as a string spells each, by code unit.
export const CHARACTERS = new Map([
  [9, "\\t"],
  [10, "\\n"],
  [12, "\\f"],
  [13, "\\r"],
  ...Array.from(
    { length: 95 },
    (_, index) =>
      [
        index + 32,
        index + 32 === 34 ? '\\"' : index + 32 === 92 ? "\\\\" : String.fromCharCode(index + 32),
      ] as const,
  ),
]);

// A text as a TLA+ string, if a string can hold each of its characters.
export const getTlaString = (text: string) =>
  [...text].every((character) => CHARACTERS.has(character.charCodeAt(0)))
    ? `"${[...text].map((character) => CHARACTERS.get(character.charCodeAt(0))).join("")}"`
    : undefined;

// A file's text as a TLA+ string of one character for each code unit, with "?" for each unit that a
// string can't hold, and those units by their positions, from 1.
export const getSourceString = (text: string) => {
  const patches: number[][] = [];
  // Every code unit but a printable one that a string spells as itself.
  const spelled = text.replace(/[^\x20\x21\x23-\x5b\x5d-\x7e]/g, (character, index: number) => {
    const unit = character.charCodeAt(0);
    const spelling = CHARACTERS.get(unit);
    if (spelling === undefined) patches.push([index + 1, unit]);
    return spelling ?? "?";
  });
  return { text: `"${spelled}"`, patches };
};

// A file's units that its source string holds as "?", as a function from position to unit, joined
// in halves so that building it takes n log n rather than n^2 steps.
export const getPatches = (patches: number[][]): string =>
  patches.length === 0
    ? "<<>>"
    : patches.length === 1
      ? `(${patches[0][0]} :> ${patches[0][1]})`
      : `(${getPatches(patches.slice(0, patches.length >> 1))} @@ ${getPatches(patches.slice(patches.length >> 1))})`;

// A text's code units as TLA+: those of its source string, with each unit that the string holds as
// "?" in its place. A long text reads in about one character a unit, where a tuple takes five.
export const getPatchedUnits = (text: string) => {
  const source = getSourceString(text);
  return source.patches.length === 0
    ? `StringUnits(${source.text})`
    : `LET u == StringUnits(${source.text}) p == ${getPatches(source.patches)} IN [i \\in DOMAIN u |-> IF i \\in DOMAIN p THEN p[i] ELSE u[i]]`;
};
