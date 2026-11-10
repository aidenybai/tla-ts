/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classExpressions/classExpression5.ts.
outcome: success
source: tests/cases/conformance/classes/classExpressions/classExpression5.ts
---*/
// @target: es2015
new class {
    hi() {
        return "Hi!";
    }
}().hi();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
