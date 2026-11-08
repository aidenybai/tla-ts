// test262's harness/sta.js and harness/assert.js, typed so that tla-ts can compile them.

class Test262Error extends Error {}

// oxlint-disable-next-line no-unused-vars
function assert(mustBeTrue: unknown, message?: string) {
  if (mustBeTrue !== true) throw new Test262Error(message ?? "Expected true");
}

// oxlint-disable-next-line no-unused-vars
function $DONOTEVALUATE(): never {
  throw "Test262: This statement should not be evaluated.";
}

namespace assert {
  export function sameValue(actual: unknown, expected: unknown, message?: string) {
    if (!Object.is(actual, expected)) {
      throw new Test262Error(message ?? "Expected SameValue to be true");
    }
  }

  export function notSameValue(actual: unknown, unexpected: unknown, message?: string) {
    if (Object.is(actual, unexpected)) {
      throw new Test262Error(message ?? "Expected SameValue to be false");
    }
  }

  export function compareArray(
    actual: readonly unknown[],
    expected: readonly unknown[],
    message?: string,
  ) {
    if (
      actual.length !== expected.length ||
      actual.some((value, index) => !Object.is(value, expected[index]))
    ) {
      throw new Test262Error(message ?? "Expected the arrays to have the same contents");
    }
  }

  export function throws(
    expectedErrorConstructor: Function,
    func: () => unknown,
    message?: string,
  ) {
    try {
      func();
    } catch (thrown) {
      if (typeof thrown !== "object" || thrown === null) {
        throw new Test262Error(message ?? "Thrown value was not an object");
      }
      if (thrown.constructor !== expectedErrorConstructor) {
        throw new Test262Error(message ?? "Expected a different error constructor");
      }
      return;
    }
    throw new Test262Error(message ?? "Expected an exception to be thrown");
  }
}
