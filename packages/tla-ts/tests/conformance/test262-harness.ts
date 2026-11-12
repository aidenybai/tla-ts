// test262's harness/sta.js and harness/assert.js, typed so that tla-ts can compile them.

class Test262Error extends Error {}

// TypeScript's lib types new Object() as Object, which primitives also have, and which has no
// properties to write, and Object() as any. Both give an object back, and wrap a primitive.
// Object.assign gives its target, which TypeScript types as the intersection of its arguments, and
// Object.getOwnPropertyDescriptors an object of descriptors, which it types as another.
declare global {
  interface ObjectConstructor {
    assign<T extends object>(target: T, ...sources: unknown[]): T;
    getOwnPropertyDescriptors(value: unknown): { [key: string | symbol]: PropertyDescriptor };
    new (value?: null): { [key: string]: unknown };
    new <T extends object>(value: T): T;
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    new (value: string): String;
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    new (value: number): Number;
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    new (value: boolean): Boolean;
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    new (value: symbol): Symbol;
    (value?: null): { [key: string]: unknown };
    <T extends object>(value: T): T;
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    (value: string): String;
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    (value: number): Number;
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    (value: boolean): Boolean;
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    (value: symbol): Symbol;
  }
}

// oxlint-disable-next-line no-unused-vars
function assert(mustBeTrue: unknown, message?: string) {
  if (mustBeTrue !== true) throw new Test262Error(message ?? "Expected true");
}

// compareArray.js's compareArray, whose isSameValue is Object.is.
// oxlint-disable-next-line no-unused-vars
function compareArray(a: ArrayLike<unknown>, b: ArrayLike<unknown>) {
  if (b.length !== a.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(b[i], a[i])) return false;
  }
  return true;
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
