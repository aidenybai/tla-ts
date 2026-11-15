// test262's harness/assertRelativeDateMs.js, typed so that tla-ts can compile it.

// oxlint-disable-next-line no-unused-vars
function assertRelativeDateMs(date: Date, expectedMs: number) {
  const actualMs = date.valueOf();
  const localOffset = date.getTimezoneOffset() * 60000;

  if (actualMs - localOffset !== expectedMs) {
    throw new Test262Error(
      "Expected " + date + " to be " + expectedMs + " milliseconds from the Unix epoch",
    );
  }
}
