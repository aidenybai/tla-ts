import { MAXIMUM } from "@limits/maximum";

let count = 0;

export const tick = () => {
  count = count === MAXIMUM ? 0 : count + 1;
};

export const isBounded = () => count <= MAXIMUM;
