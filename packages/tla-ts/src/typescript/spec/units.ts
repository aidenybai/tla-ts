import type { Expression } from "../../ast";
import {
  apply,
  boundIn,
  defineOperator,
  functionOf,
  ifThen,
  letIn,
  num,
  parenthesized,
  string,
  subscript,
  tuple,
} from "./code-tree";

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

// Whether a TLA+ string can hold each of a text's characters.
export const isTlaString = (text: string) =>
  [...text].every((character) => CHARACTERS.has(character.charCodeAt(0)));

// A file's text as the value of a TLA+ string of one character for each code unit, with "?" for
// each unit that a string can't hold, and those units by their positions, from 1.
export const getSourceString = (text: string) => {
  const patches: number[][] = [];
  const value = text.replace(/[^\t\n\f\r\x20-\x7e]/g, (character, position: number) => {
    patches.push([position + 1, character.charCodeAt(0)]);
    return "?";
  });
  return { value, patches };
};

// A file's units that its source string holds as "?", as a function from position to unit, joined
// in halves so that building it takes n log n rather than n^2 steps.
export const getPatches = (patches: number[][]): Expression =>
  patches.length === 0
    ? tuple([])
    : parenthesized(
        patches.length === 1
          ? apply(":>", [num(patches[0][0]), num(patches[0][1])])
          : apply("@@", [
              getPatches(patches.slice(0, patches.length >> 1)),
              getPatches(patches.slice(patches.length >> 1)),
            ]),
      );

// A text's code units as TLA+: those of its source string, with each unit that the string holds as
// "?" in its place. A long text reads in about one character a unit, where a tuple takes five.
export const getPatchedUnits = (text: string) => {
  const source = getSourceString(text);
  const units = apply("StringUnits", [string(source.value)]);
  return source.patches.length === 0
    ? units
    : letIn(
        [defineOperator("u", [], units), defineOperator("p", [], getPatches(source.patches))],
        functionOf(
          [boundIn("i", apply("DOMAIN", ["u"]))],
          ifThen(
            apply("\\in", ["i", apply("DOMAIN", ["p"])]),
            subscript("p", ["i"]),
            subscript("u", ["i"]),
          ),
        ),
      );
};
