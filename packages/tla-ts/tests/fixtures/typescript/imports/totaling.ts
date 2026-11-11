import { add, getTotal } from "./total";

export const step = () => {
  if (getTotal() < 3) add(1);
};

export const isSmall = () => getTotal() <= 3;
