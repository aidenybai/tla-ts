import { getSecond } from "./second";
import { log } from "./log";

const value = getSecond();
if (value !== 12 || log.join() !== "first,second") throw new Error("out of order");
