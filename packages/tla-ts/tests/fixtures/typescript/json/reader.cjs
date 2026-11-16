const first = require("./data.json");
const second = require("./data.json");
exports.isSame = first === second;
exports.data = first;
exports.count = require("./count.json");
