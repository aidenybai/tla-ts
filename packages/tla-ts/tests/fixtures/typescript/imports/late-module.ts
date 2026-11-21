import { getLate } from "./early-reader.ts";

export const value = 1;

export const read = () => getLate().value;
