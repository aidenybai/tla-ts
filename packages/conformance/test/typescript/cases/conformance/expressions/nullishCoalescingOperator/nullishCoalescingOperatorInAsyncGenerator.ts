/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperatorInAsyncGenerator.ts.
outcome: success
source: tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperatorInAsyncGenerator.ts
---*/
// @strict: false
// @target: esnext,es2015,es5
// @lib: esnext
// @noEmitHelpers: true
// @noTypesAndSymbols: true

// https://github.com/microsoft/TypeScript/issues/37686
async function* f(a: { b?: number }) {
    let c = a.b ?? 10;
    while (c) {
        yield c--;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
