/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classExpressions/classExpression2.ts.
outcome: success
source: tests/cases/conformance/classes/classExpressions/classExpression2.ts
---*/
// @target: es2015
class D { }
var v = class C extends D {};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
