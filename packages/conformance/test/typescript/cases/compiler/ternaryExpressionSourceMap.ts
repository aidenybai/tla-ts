/*---
description: Ported from TypeScript's tests/cases/compiler/ternaryExpressionSourceMap.ts.
outcome: success
source: tests/cases/compiler/ternaryExpressionSourceMap.ts
---*/
// @target: es2015
// @sourcemap: true

var x = 1;
var foo = x ? () => 0 : () => 0;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
