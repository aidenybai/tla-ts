import { getSecond } from "./second.ts";
import { log } from "./log.ts";

const value = getSecond();
if (value !== 12 || log.join() !== "first,second") throw new Error("out of order");
