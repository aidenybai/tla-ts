import { check } from "./alpha.ts";

export const isBeta = (value: string) => value === "beta";

export const checkSelf = () => check("beta");
