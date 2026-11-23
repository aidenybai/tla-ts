import "./typing-values.ts";
import { kind } from "./typing-reader.ts";

if (kind !== "number") throw new Error("seen " + kind);
