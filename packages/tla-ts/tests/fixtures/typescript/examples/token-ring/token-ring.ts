// A port of TokenRing.tla (EWD426) from tlaplus/Examples, with five nodes where it checks six.
type Value = 0 | 1 | 2 | 3 | 4;
type Node = 0 | 1 | 2 | 3 | 4;

const N = 5;
const M = 5;

/** @noDeadlock */
let c!: [Value, Value, Value, Value, Value];

/** @fair */
export const createToken = () => {
  if (c[0] !== c[N - 1]) return;
  c[0] = ((c[N - 1] + 1) % M) as Value;
};

/** @fair */
export const passToken = (node: Node) => {
  if (node === 0 || c[node] === c[node - 1]) return;
  c[node] = c[node - 1];
};

export const typeOK = () => c.length === N && c.every((value) => value >= 0 && value < M);

/** @eventuallyAlways */
export const stab = () =>
  Array.from({ length: N + 1 }, (_, node) => node).some(
    (node) =>
      c.slice(0, node).every((value) => value === c[0]) &&
      c.slice(node).every((value) => value === (c[0] + M - 1) % M),
  );
