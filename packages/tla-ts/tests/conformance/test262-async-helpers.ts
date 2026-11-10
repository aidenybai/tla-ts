// test262's harness/asyncHelpers.js, typed so that tla-ts can compile it. Test functions are always
// functions, which the original checks first.

// oxlint-disable-next-line no-unused-vars
function asyncTest(testFunc: () => Promise<unknown>) {
  testFunc().then(
    () => {
      $DONE();
    },
    (error: unknown) => {
      $DONE(error);
    },
  );
}

namespace assert {
  // Rejects unless the promise that func gives rejects with an object that the constructor made.
  export async function throwsAsync(
    expectedErrorConstructor: Function,
    func: () => unknown,
    message?: string,
  ) {
    let result: unknown = undefined;
    try {
      result = func();
    } catch {
      throw new Test262Error(message ?? "Expected the function to throw asynchronously");
    }
    try {
      await result;
    } catch (thrown) {
      if (typeof thrown !== "object" || thrown === null) {
        throw new Test262Error(message ?? "Thrown value was not an object");
      }
      if (thrown.constructor !== expectedErrorConstructor) {
        throw new Test262Error(message ?? "Expected a different error constructor");
      }
      return;
    }
    throw new Test262Error(message ?? "Expected an exception to be thrown asynchronously");
  }
}
