/*---
description: Ported from TypeScript's tests/cases/compiler/emptyArrayDestructuringExpressionVisitedByTransformer.ts.
outcome: success
source: tests/cases/compiler/emptyArrayDestructuringExpressionVisitedByTransformer.ts
---*/
// @target: es2015
var a = [] = [1].map(_ => _);
var b = [1].map(_ => _);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
