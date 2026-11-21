import { log } from "./log.ts";
import { getFirst } from "./first.ts";

const marks = { second: log.length };
log.push("second");

export const getSecond = () => {
  const first = getFirst();
  return marks.second * 10 + first;
};
