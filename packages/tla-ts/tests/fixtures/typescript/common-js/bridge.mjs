import conditional from "conditional";
import legacy from "./legacy.cjs";

export const viaImport = conditional.kind;
export const name = legacy.name;
export { legacy };
