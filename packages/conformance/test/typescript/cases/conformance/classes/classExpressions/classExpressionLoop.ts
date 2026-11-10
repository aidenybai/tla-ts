/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classExpressions/classExpressionLoop.ts.
outcome: success
source: tests/cases/conformance/classes/classExpressions/classExpressionLoop.ts
---*/
// @target: es2015
let arr = [];
for (let i = 0; i < 10; ++i) {
    arr.push(class C {
        prop = i;
    });
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
