import { evenAtLoad, isEven } from "./even.mjs";
import { thisType } from "./bare.mjs";

let checks = 0;
const isEvenChecked = (value: number) => {
  checks += 1;
  return isEven(value);
};
const seen = [isEvenChecked(4), isEvenChecked(3), evenAtLoad, thisType, checks].join();
if (seen !== "true,false,true,undefined,2") throw new Error("seen " + seen);
