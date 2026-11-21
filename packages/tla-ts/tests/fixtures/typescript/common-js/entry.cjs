exports.before = "early";
const helper = require("./helper.cjs");
exports.after = "late";
const seen = [
  helper.sawBefore,
  helper.sawAfter,
  helper.loads,
  require("./helper.cjs") === helper,
  typeof __filename,
  __dirname === helper.directory,
  this === exports,
].join();
if (seen !== "early,,1,true,string,true,true") throw new Error("seen " + seen);
