import { log } from "./log";
import { getFirst } from "./first";

const marks = { second: log.length };
log.push("second");

export const getSecond = () => {
  const first = getFirst();
  return marks.second * 10 + first;
};
