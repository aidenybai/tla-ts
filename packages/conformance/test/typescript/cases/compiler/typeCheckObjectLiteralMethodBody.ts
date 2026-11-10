/*---
description: Ported from TypeScript's tests/cases/compiler/typeCheckObjectLiteralMethodBody.ts.
outcome: success
source: tests/cases/compiler/typeCheckObjectLiteralMethodBody.ts
---*/
// @target: es2015
//@noImplicitAny: true
var foo = { bar() { return undefined } };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
