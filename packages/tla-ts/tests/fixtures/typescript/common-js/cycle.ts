import first from "./first.cjs";

const seen = [first.done, first.sawFirstDone, first.isSame].join();
if (seen !== "true,false,true") throw new Error("seen " + seen);
