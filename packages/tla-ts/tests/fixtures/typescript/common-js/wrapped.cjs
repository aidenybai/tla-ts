"use strict";
"production" !== process.env.NODE_ENV &&
  (function () {
    function describe() {
      return "wrapped:" + counter.loads;
    }
    const counter = require("./counter.cjs"),
      sloppy = require("./sloppy.cjs");
    counter.loads += 1;
    exports.description = describe();
    exports.inner = sloppy.inner;
    exports.isCached = (function () {
      return require("./counter.cjs") === counter;
    })();
  })();
