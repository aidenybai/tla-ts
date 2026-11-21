import { fetchPrice } from "./prices";

type Item = "apple" | "pear";

let total = 0;

export const add = (item: Item) => {
  if (total > 4) return;
  const price = fetchPrice(item);
  total += price;
};

export const isNotNegative = () => total >= 0;
