/*---
description: Ported from TypeScript's tests/cases/compiler/contextuallyTypingOrOperator3.ts.
outcome: success
source: tests/cases/compiler/contextuallyTypingOrOperator3.ts
---*/
// @target: es2015
// @strict: false
function foo<T, U extends T>(u: U) {
    var x3: U = u || u;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
