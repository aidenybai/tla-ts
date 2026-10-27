// A port of Prisoners.tla from tlaplus/Examples.
type Prisoner = "p1" | "p2" | "p3" | "p4";
type OtherPrisoner = Exclude<Prisoner, typeof counter>;

const prisoners = new Set<Prisoner>(["p1", "p2", "p3", "p4"]);
const counter = "p1";
const otherPrisoners = new Set<OtherPrisoner>(["p2", "p3", "p4"]);

let switchAUp: boolean;
let switchBUp: boolean;
let timesSwitched: Record<OtherPrisoner, number> = { p2: 0, p3: 0, p4: 0 };
let count = 0;

const isDone = () => count === 2 * (prisoners.size - 1);

const sumTimesSwitched = (subset: Set<OtherPrisoner>): number => {
  const prisoner = subset.values().find(() => true);
  return prisoner === undefined
    ? 0
    : timesSwitched[prisoner] + sumTimesSwitched(subset.difference(new Set([prisoner])));
};

/** @fair */
export const counterStep = () => {
  if (switchAUp) {
    switchAUp = false;
    count += 1;
  } else {
    switchBUp = !switchBUp;
  }
};

/** @fair */
export const nonCounterStep = (prisoner: OtherPrisoner) => {
  if (!switchAUp && timesSwitched[prisoner] < 2) {
    switchAUp = true;
    timesSwitched[prisoner] += 1;
  } else {
    switchBUp = !switchBUp;
  }
};

export const typeOK = () =>
  Object.values(timesSwitched).every((times) => times >= 0 && times <= 2) &&
  count >= 0 &&
  count <= 2 * prisoners.size - 1;

export const countInvariant = () => {
  const totalSwitched = sumTimesSwitched(otherPrisoners);
  const oneIfUp = switchAUp ? 1 : 0;
  return count === totalSwitched - oneIfUp || count === totalSwitched - oneIfUp + 1;
};

/** @always */
export const safety = () => !isDone() || Object.values(timesSwitched).every((times) => times > 0);

/** @eventually */
export const liveness = () => isDone();
