import { getCast } from "./casts";

const seen = getCast();
if (seen !== "3,TC39,3") throw new Error("seen " + seen);
