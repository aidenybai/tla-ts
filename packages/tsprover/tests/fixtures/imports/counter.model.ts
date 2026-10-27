import { isWithin, LIMIT, type Step } from "./shared";

let count = 0;

export const add = (step: Step) => {
  if (count + step > LIMIT) return;
  count += step;
};

export const isBounded = () => isWithin(count);
