const { list } = require("listing");
const seen = list(1, 2);
if (seen !== "a=1+b=2;children") throw new Error("seen " + seen);
