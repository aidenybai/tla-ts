// From the TypeScript compiler: createQueue in src/compiler/core.ts.
// The compiler compacts after 100 dequeues. Here it compacts after 1.
type Item = 1 | 2;

const COMPACT_AFTER = 1;

let elements: (Item | undefined)[] = [];
let headIndex = 0;
let expected: Item[] = [];

const isEmpty = () => headIndex === elements.length;

export const enqueue = (item: Item) => {
  if (elements.length - headIndex >= 3) return;
  elements.push(item);
  expected.push(item);
};

export const dequeue = () => {
  if (isEmpty()) return;
  elements[headIndex] = undefined;
  headIndex++;
  if (headIndex > COMPACT_AFTER && headIndex > elements.length >> 1) {
    elements = elements.slice(headIndex);
    headIndex = 0;
  }
  expected.shift();
};

export const firstInFirstOut = () =>
  expected.every((item, index) => elements[headIndex + index] === item) &&
  elements.length - headIndex === expected.length;
