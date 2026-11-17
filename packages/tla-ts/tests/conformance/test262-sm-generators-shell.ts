// test262's harness/sm/non262-generators-shell.js, typed so that tla-ts can compile it.

function assertIteratorResult(result: IteratorResult<unknown>, value: unknown, done: boolean) {
  assert.sameValue(result.value, value);
  assert.sameValue(result.done, done);
}

// oxlint-disable-next-line no-unused-vars
function assertIteratorNext(iter: Iterator<unknown>, value: unknown) {
  assertIteratorResult(iter.next(), value, false);
}

// oxlint-disable-next-line no-unused-vars
function assertIteratorDone(iter: Iterator<unknown>, value?: unknown) {
  assertIteratorResult(iter.next(), value, true);
}
