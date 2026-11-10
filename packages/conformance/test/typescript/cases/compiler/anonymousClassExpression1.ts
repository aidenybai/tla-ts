/*---
description: Ported from TypeScript's tests/cases/compiler/anonymousClassExpression1.ts.
outcome: success
source: tests/cases/compiler/anonymousClassExpression1.ts
---*/
// @target: es2015
function f() {
    return typeof class {} === "function";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
