import { applyAll, makeLazy } from "./lazies";

const applied = applyAll(makeLazy(10), [1, 2]);
if (applied.join() !== "11,12") throw new Error("applied");
