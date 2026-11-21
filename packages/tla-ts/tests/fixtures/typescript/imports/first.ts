import { log } from "./log.ts";

log.push("first");

export const getFirst = () => log.length;
