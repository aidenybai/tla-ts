import * as boxes from "./boxes";
import { box } from "./boxes";

let log = "";
log += boxes.limit;
log += boxes.getNext();
boxes.bump();
log += boxes.box.value;
boxes.box.value = 7;
log += box.value;
const counter = new boxes.Counter();
counter.step();
log += counter.count;
log += box === boxes.box;
if (log !== "34274true") throw new Error(log);
