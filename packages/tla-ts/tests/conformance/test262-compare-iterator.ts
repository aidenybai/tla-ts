// test262's harness/compareIterator.js, typed so that tla-ts can compile it.

namespace assert {
  export function compareIterator<T>(
    iter: Iterator<T>,
    validators: ((value: T) => unknown)[],
    message?: string,
  ) {
    message = message || "";

    let i;
    let result;
    for (i = 0; i < validators.length; i++) {
      result = iter.next();
      assert(
        !result.done,
        "Expected " +
          i +
          " values(s). Instead iterator only produced " +
          (i - 1) +
          " value(s). " +
          message,
      );
      validators[i](result.value);
    }

    result = iter.next();
    assert(
      result.done,
      "Expected only " + i + " values(s). Instead iterator produced more. " + message,
    );
    assert.sameValue(
      result.value,
      undefined,
      "Expected value of `undefined` when iterator completes. " + message,
    );
  }
}
