import { LIMIT, MAXIMUM } from "./barrel";

let count = 0;

export const tick = () => {
  count = count === LIMIT ? 0 : count + 1;
};

export const isBounded = () => count <= MAXIMUM;
