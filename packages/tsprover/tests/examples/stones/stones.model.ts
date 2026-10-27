// A port of Stones.tla from tlaplus/Examples.
const w = 40;
const n = 4;

const getRange = (low: number, high: number) =>
  Array.from({ length: high - low + 1 }, (_, index) => low + index);

const weighs = (seq: number[], wt: number): boolean =>
  seq.length === 0 ? wt === 0 : [-1, 0, 1].some((coef) => weighs(seq.slice(1), wt - coef * seq[0]));

const hasSolution = (seq: number[], wt: number): boolean => {
  if (seq.length === n) return getRange(1, w).every((weight) => weighs(seq, weight));
  const r = n - seq.length;
  const max = seq.length === 0 ? wt : seq[0];
  return getRange(1, max).some(
    (x) => r - 1 <= wt - x && wt <= x * r && hasSolution([x, ...seq], wt - x),
  );
};

/** @assume */
export const isSolvable = () => hasSolution([], w);
