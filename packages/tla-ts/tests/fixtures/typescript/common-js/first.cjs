"use strict";
exports.done = false;
const second = require("./second.cjs");
exports.sawFirstDone = second.sawFirstDone;
exports.isSame = second.first === exports;
exports.done = true;
