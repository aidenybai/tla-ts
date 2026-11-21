import { isOdd } from "./odd.mjs";

/** @param {number} value */
export function isEven(value) {
  return value === 0 ? true : isOdd(value - 1);
}
export const evenAtLoad = isOdd(3);
