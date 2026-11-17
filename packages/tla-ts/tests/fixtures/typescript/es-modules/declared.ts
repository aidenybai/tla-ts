import { label, wrap, type Label } from "declared";

const kind: Label = label;
const wrapped = wrap<number>(1);
const seen = [kind, wrapped.length, wrapped[0]].join();
if (seen !== "import,2,1") throw new Error("seen " + seen);
