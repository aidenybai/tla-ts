import "./cycle-values.ts";
import { early } from "./cycle-reader.ts";

if (early !== "3,4") throw new Error("seen " + early);
