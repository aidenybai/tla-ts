// test262's harness/fnGlobalObject.js, typed so that tla-ts can compile it. The original reads the
// global object through Function, which tla-ts doesn't support, and globalThis names the same object.

const __globalObject = globalThis;
// oxlint-disable-next-line no-unused-vars
function fnGlobalObject() {
  return __globalObject;
}
