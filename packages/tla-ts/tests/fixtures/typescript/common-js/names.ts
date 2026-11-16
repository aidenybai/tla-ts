import { name } from "./shapes.cjs";

const seen = [name].join();
if (seen !== "square") throw new Error("seen " + seen);
