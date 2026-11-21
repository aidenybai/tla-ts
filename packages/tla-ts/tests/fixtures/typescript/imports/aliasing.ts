import { getShared } from "./aliased.ts";

let count = 0;

export const step = () => {
  count = getShared();
};

export const isShared = () => count !== 1;
