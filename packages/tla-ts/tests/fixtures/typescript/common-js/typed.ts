import type { Sides } from "typed";

let sides: Sides = 3;
sides = 4;
const seen = [sides, "sides"].join();
if (seen !== "4,sides") throw new Error("seen " + seen);
