// A port of CoffeeCan.tla from tlaplus/Examples, with MaxBeanCount = 100.
type UpTo<N extends number, Counts extends number[] = []> = Counts["length"] extends N
  ? N | Counts[number]
  : UpTo<N, [...Counts, Counts["length"]]>;

const maxBeanCount = 100;

let can: { black: UpTo<typeof maxBeanCount>; white: UpTo<typeof maxBeanCount> };

const beanCount = () => can.black + can.white;

/** @initially */
export const startsWithBeans = () => beanCount() >= 1 && beanCount() <= maxBeanCount;

/** @fair */
export const pickSameColorWhite = () => {
  if (beanCount() <= 1 || can.white < 2) return;
  can.black += 1;
  can.white -= 2;
};

/** @fair */
export const pickSameColorBlack = () => {
  if (beanCount() <= 1 || can.black < 2) return;
  can.black -= 1;
};

/** @fair */
export const pickDifferentColor = () => {
  if (beanCount() <= 1 || can.black < 1 || can.white < 1) return;
  can.black -= 1;
};

export const termination = () => {
  if (beanCount() !== 1) return;
  can = { ...can };
};

/** @always */
export const monotonicDecrease = (before: { can: typeof can }) =>
  can.black + can.white < before.can.black + before.can.white;

/** @eventually */
export const eventuallyTerminates = () => beanCount() === 1;

/** @always */
export const loopInvariant = (before: { can: typeof can }) =>
  (before.can.white % 2 === 0) === (can.white % 2 === 0);

/** @eventually */
export const terminationHypothesis = () =>
  can.white % 2 === 0 ? can.black === 1 && can.white === 0 : can.black === 0 && can.white === 1;

export const typeInvariant = () =>
  can.black >= 0 && can.black <= maxBeanCount && can.white >= 0 && can.white <= maxBeanCount;
