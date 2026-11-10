/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classExpressions/classExpressionES62.ts.
outcome: success
source: tests/cases/conformance/es6/classExpressions/classExpressionES62.ts
---*/
// @target: es6
class D { }
var v = class C extends D {};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
