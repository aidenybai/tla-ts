/*---
description: Ported from TypeScript's tests/cases/compiler/noCollisionThisExpressionAndClassInGlobal.ts.
outcome: success
source: tests/cases/compiler/noCollisionThisExpressionAndClassInGlobal.ts
---*/
// @target: es2015
class _this {
}
var f = () => _this;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
