import { isEven } from "./even.mjs";

/** @param {number} value */
export function isOdd(value) {
  return value === 0 ? false : isEven(value - 1);
}
