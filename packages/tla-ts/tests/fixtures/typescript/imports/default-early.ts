import { seen } from "./defaulting";

if (seen !== "reference") throw new Error(seen);
