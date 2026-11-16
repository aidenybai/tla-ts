import { hoisted, late } from "./cycle-values.ts";

export const early = `${hoisted()},${late}`;
