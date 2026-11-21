// Calls a function through a const that another module's function initializes.
import * as Effect from "./alias-effect.ts";

const box = { tag: 1 };
const results = [Effect.isTagged(box), Effect.isTagged(2)].join();
if (results !== "true,false") throw new Error("results " + results);
