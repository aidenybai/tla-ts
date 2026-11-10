/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classExpressions/classExpression4.ts.
outcome: success
source: tests/cases/conformance/classes/classExpressions/classExpression4.ts
---*/
// @target: es2015
let C = class {
    foo() {
        return new C();
    }
};
let x = (new C).foo();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
