const counter = require("./counter.cjs");
counter.loads += 1;
{
  function inner() {
    return "inner";
  }
}
module.exports = { inner: inner() };
