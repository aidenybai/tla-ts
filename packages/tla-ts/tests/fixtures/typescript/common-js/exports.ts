import shapes from "./shapes.cjs";

const seen = [shapes.name, shapes.sides, shapes.isThis, shapes.isReplaced].join();
if (seen !== "square,4,true,true") throw new Error("seen " + seen);
