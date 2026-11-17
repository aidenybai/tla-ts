// test262's harness/sm/assertThrowsValue.js, typed so that tla-ts can compile it.

// oxlint-disable-next-line no-unused-vars
function assertThrowsValue(f: () => unknown, val: unknown, msg?: string) {
  try {
    f();
  } catch (exc) {
    assert.sameValue(exc, val, msg);
    return;
  }

  let fullmsg = "Assertion failed: expected exception, no exception thrown";
  if (msg !== undefined) {
    fullmsg += " - " + msg;
  }
  throw new Test262Error(fullmsg);
}
