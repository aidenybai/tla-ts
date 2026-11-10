/*---
description: Ported from TypeScript's tests/cases/compiler/typeCheckReturnExpression.ts.
outcome: success
source: tests/cases/compiler/typeCheckReturnExpression.ts
---*/
// @target: es2015
//@noImplicitAny: true
var foo = () => undefined;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
