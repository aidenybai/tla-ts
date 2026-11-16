import { getLate } from "./early-reader";

export const value = 1;

export const read = () => getLate().value;
