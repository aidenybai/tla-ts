/*---
description: Ported from TypeScript's tests/cases/compiler/superCallInsideObjectLiteralExpression.ts.
outcome: success
source: tests/cases/compiler/superCallInsideObjectLiteralExpression.ts
---*/
// @target: es2015
class A {
    foo() {
    }
}

class B extends A {
    constructor() {
        var x = {
            x: super()
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
