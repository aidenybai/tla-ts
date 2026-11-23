// Exports another module's function through a const that its namespace object's export initializes.
import * as signs from "./signs.ts";

export const isPositive: (value: 1 | 2) => boolean = signs.isPositive;
export let count = 0;
export const step = () => {
  if (count < 2) count += 1;
};
