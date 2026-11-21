import { makeHook } from "./ambient-global-hook.ts";

const shared = { hook: makeHook() };
let caught = "none";
try {
  caught = String(hookX);
} catch (error) {
  caught = error instanceof ReferenceError ? "reference" : "other";
}
shared.hook.count = caught.length;
if (caught !== "reference") throw new Error("caught " + caught);
