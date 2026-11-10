/*---
description: Ported from TypeScript's tests/cases/compiler/noCollisionThisExpressionAndVarInGlobal.ts.
outcome: success
source: tests/cases/compiler/noCollisionThisExpressionAndVarInGlobal.ts
---*/
// @target: es2015
var _this = 1;
var f = () => _this;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
