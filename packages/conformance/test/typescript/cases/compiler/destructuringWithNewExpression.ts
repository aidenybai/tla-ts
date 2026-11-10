/*---
description: Ported from TypeScript's tests/cases/compiler/destructuringWithNewExpression.ts.
outcome: success
source: tests/cases/compiler/destructuringWithNewExpression.ts
---*/
// @target: es2015
class C {
    x = 0;
}

var { x } = new C;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
