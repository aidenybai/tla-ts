/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classExpressions/classExpressionES63.ts.
outcome: success
source: tests/cases/conformance/es6/classExpressions/classExpressionES63.ts
---*/
// @target: es6
let C = class extends class extends class { a = 1 } { b = 2 } { c = 3 };
let c = new C();
c.a;
c.b;
c.c;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
