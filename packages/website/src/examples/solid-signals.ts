// From Solid's signals: markNode and the flags in packages/signals/src/core.
// Three computeds in a chain, where each one subscribes to the one before it.
type Node = 0 | 1 | 2;

const REACTIVE_NONE = 0;
const REACTIVE_CHECK = 1 << 0;
const REACTIVE_DIRTY = 1 << 1;

let flags = [REACTIVE_NONE, REACTIVE_NONE, REACTIVE_NONE];

const markNode = (node: number, newState: number) => {
  let el = node;
  let state = newState;
  while (el < flags.length) {
    if ((flags[el] & (REACTIVE_CHECK | REACTIVE_DIRTY)) >= state) return;
    flags[el] = (flags[el] & ~(REACTIVE_CHECK | REACTIVE_DIRTY)) | state;
    el += 1;
    state = REACTIVE_CHECK;
  }
};

export const write = (node: Node) => {
  markNode(node, REACTIVE_DIRTY);
};

export const recompute = (node: Node) => {
  if (node > 0 && flags[node - 1] !== REACTIVE_NONE) return;
  flags[node] = REACTIVE_NONE;
};

export const staleReachesSubscribers = () =>
  flags.every(
    (flag, node) => node === 0 || flags[node - 1] === REACTIVE_NONE || flag !== REACTIVE_NONE,
  );
