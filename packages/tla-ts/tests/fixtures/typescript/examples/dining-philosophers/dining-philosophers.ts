// A port of DiningPhilosophers.tla from tlaplus/Examples.
type Philosopher = 1 | 2 | 3 | 4 | 5;

const N = 5;
const philosopherSet = new Set<Philosopher>([1, 2, 3, 4, 5]);

let philosophers = new Map(
  philosopherSet.values().map((philosopher) => [philosopher, new Set<number>()]),
);
let forks = new Set<number>([1, 2, 3, 4, 5]);

const leftFork = (philosopher: Philosopher) => philosopher;
const rightFork = (philosopher: Philosopher) => (philosopher % N) + 1;

const canTakeLeft = (philosopher: Philosopher) =>
  (philosopher % 2 !== 0 || philosophers.get(philosopher)! === new Set([rightFork(philosopher)])) &&
  forks.has(leftFork(philosopher));

const canTakeRight = (philosopher: Philosopher) =>
  (philosopher % 2 !== 1 || philosophers.get(philosopher)! === new Set([leftFork(philosopher)])) &&
  forks.has(rightFork(philosopher));

const canRelease = (philosopher: Philosopher) =>
  philosophers.get(philosopher)! === new Set([leftFork(philosopher), rightFork(philosopher)]);

const takeLeft = (philosopher: Philosopher) => {
  forks.delete(leftFork(philosopher));
  philosophers.get(philosopher)!.add(leftFork(philosopher));
};

const takeRight = (philosopher: Philosopher) => {
  forks.delete(rightFork(philosopher));
  philosophers.get(philosopher)!.add(rightFork(philosopher));
};

const release = (philosopher: Philosopher) => {
  forks.add(leftFork(philosopher));
  forks.add(rightFork(philosopher));
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
  new Set(philosophers.keys()) === philosopherSet &&
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
