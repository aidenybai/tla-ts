// test262's harness/sta.js and harness/assert.js, typed so that tla-ts can compile them.

class Test262Error extends Error {
  static thrower(message?: string): never {
    throw new Test262Error(message);
  }
}

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
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    new (value: bigint): BigInt;
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
    // oxlint-disable-next-line typescript/no-wrapper-object-types
    (value: bigint): BigInt;
  }
}

// assert.js takes a message of any type, which it converts to a string.
function getMessage(message: unknown, fallback: string) {
  return message === undefined ? fallback : String(message);
}

// oxlint-disable-next-line no-unused-vars
function assert(mustBeTrue: unknown, message?: unknown) {
  if (mustBeTrue !== true) {
    throw new Test262Error(getMessage(message, "Expected true"));
  }
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
  export function sameValue(actual: unknown, expected: unknown, message?: unknown) {
    if (!Object.is(actual, expected)) {
      throw new Test262Error(getMessage(message, "Expected SameValue to be true"));
    }
  }

  export function notSameValue(actual: unknown, unexpected: unknown, message?: unknown) {
    if (Object.is(actual, unexpected)) {
      throw new Test262Error(getMessage(message, "Expected SameValue to be false"));
    }
  }

  // assert.js rejects primitives, and then compares as compareArray.js does.
  export function compareArray(actual: unknown, expected: unknown, message?: unknown) {
    if (
      !actual ||
      (typeof actual !== "object" && typeof actual !== "function") ||
      !expected ||
      (typeof expected !== "object" && typeof expected !== "function")
    ) {
      throw new Test262Error(getMessage(message, "Expected the arguments not to be primitives"));
    }
    const actualElements = actual as ArrayLike<unknown>;
    const expectedElements = expected as ArrayLike<unknown>;
    if (expectedElements.length !== actualElements.length) {
      throw new Test262Error(getMessage(message, "Expected the arrays to have the same length"));
    }
    // The length of an object that isn't array-like is undefined, which < converts to NaN.
    const length: unknown = actualElements.length;
    for (let index = 0; length !== undefined && index < Number(length as unknown); index++) {
      if (!Object.is(expectedElements[index], actualElements[index])) {
        throw new Test262Error(
          getMessage(message, "Expected the arrays to have the same contents"),
        );
      }
    }
  }

  export function throws(
    expectedErrorConstructor: Function,
    func: () => unknown,
    message?: unknown,
  ) {
    try {
      func();
    } catch (thrown) {
      if (typeof thrown !== "object" || thrown === null) {
        throw new Test262Error(getMessage(message, "Thrown value was not an object"));
      }
      if (thrown.constructor !== expectedErrorConstructor) {
        throw new Test262Error(getMessage(message, "Expected a different error constructor"));
      }
      return;
    }
    throw new Test262Error(getMessage(message, "Expected an exception to be thrown"));
  }
}
