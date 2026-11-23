// A port of DiningPhilosophers.tla from tlaplus/Examples.
type Philosopher = 1 | 2 | 3 | 4 | 5;

const N = 5;
const philosopherSet = new Set<Philosopher>([1, 2, 3, 4, 5]);

let philosophers = new Map(
  philosopherSet.values().map((philosopher) => [philosopher, new Set<number>()]),
);
let forks = new Set<number>([1, 2, 3, 4, 5]);

// Whether two sets hold the same forks, as TLA+'s = compares them.
const isSameSet = (left: ReadonlySet<number>, right: ReadonlySet<number>) =>
  left.isSubsetOf(right) && right.isSubsetOf(left);

const leftFork = (philosopher: Philosopher) => philosopher;
const rightFork = (philosopher: Philosopher) => (philosopher % N) + 1;

const canTakeLeft = (philosopher: Philosopher) =>
  (philosopher % 2 !== 0 ||
    isSameSet(philosophers.get(philosopher)!, new Set([rightFork(philosopher)]))) &&
  forks.has(leftFork(philosopher));

const canTakeRight = (philosopher: Philosopher) =>
  (philosopher % 2 !== 1 ||
    isSameSet(philosophers.get(philosopher)!, new Set([leftFork(philosopher)]))) &&
  forks.has(rightFork(philosopher));

const canRelease = (philosopher: Philosopher) =>
  isSameSet(
    philosophers.get(philosopher)!,
    new Set([leftFork(philosopher), rightFork(philosopher)]),
  );

// A Set keeps its elements in the order they were added, which TLA+'s sets don't have, so each set
// keeps its forks sorted.
const getSorted = (values: Iterable<number>) =>
  new Set([...values].sort((left, right) => left - right));

const takeLeft = (philosopher: Philosopher) => {
  forks.delete(leftFork(philosopher));
  philosophers.set(
    philosopher,
    getSorted([...philosophers.get(philosopher)!, leftFork(philosopher)]),
  );
};

const takeRight = (philosopher: Philosopher) => {
  forks.delete(rightFork(philosopher));
  philosophers.set(
    philosopher,
    getSorted([...philosophers.get(philosopher)!, rightFork(philosopher)]),
  );
};

const release = (philosopher: Philosopher) => {
  forks = getSorted([...forks, leftFork(philosopher), rightFork(philosopher)]);
  philosophers.set(philosopher, new Set());
};

/** @strongFair */
export const dine = (philosopher: Philosopher) => {
  if (canTakeLeft(philosopher)) takeLeft(philosopher);
  else if (canTakeRight(philosopher)) takeRight(philosopher);
  else if (canRelease(philosopher)) release(philosopher);
};

const isEating = (philosopher: Philosopher) => philosophers.get(philosopher)!.size === 2;

export const typeOK = () =>
  isSameSet(new Set(philosophers.keys()), philosopherSet) &&
  philosophers.values().every((held) => held.isSubsetOf(philosopherSet)) &&
  forks.isSubsetOf(philosopherSet);

export const noDeadlock = () =>
  philosopherSet
    .values()
    .some(
      (philosopher) =>
        canTakeLeft(philosopher) || canTakeRight(philosopher) || canRelease(philosopher),
    );

/** @alwaysEventually */
export const noLivelock = () => philosopherSet.values().some(isEating);

/** @alwaysEventually */
export const noStarvation = (philosopher: Philosopher) => isEating(philosopher);
