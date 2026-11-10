/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingAssignmentVsPrivateFieldsJsEmit1.ts.
outcome: success
source: tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingAssignmentVsPrivateFieldsJsEmit1.ts
---*/
// @strict: true
// @target: es2021

// https://github.com/microsoft/TypeScript/issues/61109

class Cls {
  #privateProp: number | undefined;

  problem() {
    this.#privateProp ??= false ? neverThis() : 20;
  }
}

function neverThis(): never {
  throw new Error("This should really really never happen!");
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
