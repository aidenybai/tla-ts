import { check } from "./alpha";

export const isBeta = (value: string) => value === "beta";

export const checkSelf = () => check("beta");
