"use strict";
if (process.env.NODE_ENV === "production") {
  module.exports = require("./production.cjs");
} else {
  module.exports = require("./development.cjs");
}
module.exports.processType = typeof process;
