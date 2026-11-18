// Calls functions that make objects through a module's namespace object.
import * as Makers from "./makers";

const first = Makers.box(1);
const second = Makers.box(1);
first.size += 1;
const step = Makers.counting(5);
const result = [first.size, second.size, typeof step].join();
if (result !== "2,1,function") throw new Error("result " + result);
