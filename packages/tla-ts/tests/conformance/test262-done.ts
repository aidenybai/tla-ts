// test262's harness/doneprintHandle.js, typed so that tla-ts can compile it. An async test passes
// once it calls $DONE with no error, which a timer checks after the test's jobs finish.

declare function setTimeout(callback: () => void): void;

let isAsyncTestComplete = false;
let isAsyncTestFailed = false;

// oxlint-disable-next-line no-unused-vars
function $DONE(error?: unknown): void {
  const isFalsy =
    error === undefined ||
    error === null ||
    error === false ||
    error === 0 ||
    error === "" ||
    (typeof error === "number" && error !== error);
  if (isFalsy) {
    isAsyncTestComplete = true;
  } else {
    isAsyncTestFailed = true;
  }
}

setTimeout(() => {
  if (isAsyncTestFailed || !isAsyncTestComplete) {
    throw new Test262Error("Test262:AsyncTestFailure");
  }
});
