import { log } from "./log";

log.push("first");

export const getFirst = () => log.length;
