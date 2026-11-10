/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperator12.ts.
outcome: success
source: tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperator12.ts
---*/
// @strict: true
// @target: ES2015

const obj: { arr: any[] } = { arr: [] };
for (const i of obj?.arr ?? []) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
