// The parts of OCaml's standard library whose exact order steers what tlapm prints.

export type OcamlValue = number | string | OcamlValue[];

// String.compare: byte by byte, on the UTF-8 bytes. Code units order the same way for the ASCII
// names tlapm compares.
export const compareStrings = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

// Stdlib.compare on ints, strings, and lists, where a list is smaller than any longer list it
// starts.
export const compareValues = (left: OcamlValue, right: OcamlValue): number => {
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "string" && typeof right === "string") return compareStrings(left, right);
  if (!Array.isArray(left) || !Array.isArray(right)) return 0;
  const index = left.findIndex(
    (item, position) => position >= right.length || compareValues(item, right[position]) !== 0,
  );
  if (index === -1) return left.length - right.length;
  if (index >= right.length) return 1;
  return compareValues(left[index], right[index]);
};
