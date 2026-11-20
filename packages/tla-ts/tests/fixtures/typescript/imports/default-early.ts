import { seen } from "./defaulting.ts";

if (seen !== "reference") throw new Error(seen);
