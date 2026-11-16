import late from "./late.cjs";

const seen = [late.getArea().isReplaced].join();
if (seen !== "true") throw new Error("seen " + seen);
