import { count, increment, isStrict, kind, topThis } from "dual";
import { order } from "dual/order";

increment();
increment();
const seen = [kind, count, isStrict, topThis, order.join("+")].join();
if (seen !== "import,2,true,undefined,counter+index") throw new Error("seen " + seen);
