// From Effect's Semaphore: packages/effect/src/Semaphore.ts.
// Two fibers share three permits. takeIfAvailable takes only what is free.
type Fiber = "a" | "b";
type Permits = 1 | 2;

const permits = 3;
let taken = 0;
let held = new Map<Fiber, number>([
  ["a", 0],
  ["b", 0],
]);

const getFree = () => permits - taken;

export const takeIfAvailable = (fiber: Fiber, n: Permits) => {
  if (held.get(fiber) !== 0) return;
  if (getFree() < n) return;
  taken += n;
  held.set(fiber, n);
};

export const release = (fiber: Fiber) => {
  const n = held.get(fiber) ?? 0;
  if (n === 0) return;
  taken -= n;
  held.set(fiber, 0);
};

export const neverOverdrawn = () => 0 <= taken && taken <= permits;

export const takenIsWhatFibersHold = () => taken === (held.get("a") ?? 0) + (held.get("b") ?? 0);
