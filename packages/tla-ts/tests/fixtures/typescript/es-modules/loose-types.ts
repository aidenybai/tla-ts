import { keys } from "./loose-types.mjs";

const seen = keys();
if (seen !== "a,b,1") throw new Error("seen " + seen);
