/*---
description: Ported from TypeScript's tests/cases/compiler/commaOperatorInConditionalExpression.ts.
outcome: success
source: tests/cases/compiler/commaOperatorInConditionalExpression.ts
---*/
// @target: es2015
function f (m: string) {
    [1, 2, 3].map(i => {
        return true? { [m]: i } : { [m]: i + 1 }
    })
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
