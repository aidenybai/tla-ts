// test262's harness/isConstructor.js, typed so that tla-ts can compile it.

// oxlint-disable-next-line no-unused-vars
function isConstructor(f: unknown) {
  if (typeof f !== "function") {
    throw new Test262Error("isConstructor invoked with a non-function value");
  }
  try {
    Reflect.construct(function () {}, [], f);
  } catch {
    return false;
  }
  return true;
}
