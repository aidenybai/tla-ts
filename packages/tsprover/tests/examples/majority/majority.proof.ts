// A port of MCMajority.tla from tlaplus/Examples.
/** @noDeadlock */
type Value = "A" | "B" | "C";
type BoundedSeq =
  | []
  | [Value]
  | [Value, Value]
  | [Value, Value, Value]
  | [Value, Value, Value, Value]
  | [Value, Value, Value, Value, Value];

const values = new Set<Value>(["A", "B", "C"]);

let seq!: BoundedSeq;
let i = 0;
let cand: Value;
let cnt = 0;

/** @fair */
export const next = () => {
  if (i >= seq.length) return;
  const value = seq[i];
  i++;
  if (cnt === 0) {
    cand = value;
    cnt = 1;
  } else if (cand === value) {
    cnt++;
  } else {
    cnt--;
  }
};

const occurrencesBefore = (value: Value, end: number) =>
  seq.slice(0, end).filter((element) => element === value).length;

export const typeOK = () => i >= 0 && i <= seq.length && values.has(cand) && cnt >= 0;

export const correct = () =>
  i < seq.length ||
  [...values].every(
    (value) => 2 * occurrencesBefore(value, seq.length) <= seq.length || value === cand,
  );

export const inv = () =>
  cnt <= occurrencesBefore(cand, i) &&
  2 * (occurrencesBefore(cand, i) - cnt) <= i - cnt &&
  [...values].every((value) => value === cand || 2 * occurrencesBefore(value, i) <= i - cnt);
