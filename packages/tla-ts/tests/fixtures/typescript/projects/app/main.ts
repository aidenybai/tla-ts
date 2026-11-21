import { getArea } from "../shapes/area";

const seen = String(getArea(3, 4));
if (seen !== "12") throw new Error("seen " + seen);
