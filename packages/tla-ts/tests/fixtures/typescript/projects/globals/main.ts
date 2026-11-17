import { wrap } from "declared";

const kind: string = typeof label;
const wrapped = wrap<string>(kind);
const seen = [wrapped.length, wrapped[0]].join();
if (seen !== "2,undefined") throw new Error("seen " + seen);
