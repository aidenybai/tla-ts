import { kind } from "loose";

const seen = kind();
if (seen !== "string") throw new Error("seen " + seen);
