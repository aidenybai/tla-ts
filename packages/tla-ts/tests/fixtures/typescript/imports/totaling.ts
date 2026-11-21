import { add, getTotal } from "./total.ts";

export const step = () => {
  if (getTotal() < 3) add(1);
};

export const isSmall = () => getTotal() <= 3;
