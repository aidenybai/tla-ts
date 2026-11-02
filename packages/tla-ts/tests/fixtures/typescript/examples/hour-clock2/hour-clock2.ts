// A port of HourClock2.tla from Specifying Systems in tlaplus/Examples.
type Hour = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

let hr: Hour;

export const tick = () => {
  hr = hr !== 12 ? ((hr + 1) as Hour) : 1;
};

/** @always */
export const isHour = () => hr >= 1 && hr <= 12;

/** @always */
export const ticksModulo12 = (before: { hr: Hour }) => hr === (before.hr % 12) + 1;
