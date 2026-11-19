import { getView } from "./view";

const seen = getView("x");
if (seen !== "jsx:b(children=x)") throw new Error("seen " + seen);
