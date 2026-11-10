/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperator6.ts.
outcome: success
source: tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperator6.ts
---*/
// @target: es2015
// @strict: true

function foo(foo: string, bar = foo ?? "bar") { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
