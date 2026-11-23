const entry = require("./entry.cjs");
exports.sawBefore = entry.before;
exports.sawAfter = entry.after;
exports.loads = (exports.loads || 0) + 1;
exports.directory = __dirname;
