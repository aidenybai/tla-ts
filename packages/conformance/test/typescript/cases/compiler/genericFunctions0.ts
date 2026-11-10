/*---
description: Ported from TypeScript's tests/cases/compiler/genericFunctions0.ts.
outcome: success
source: tests/cases/compiler/genericFunctions0.ts
---*/
// @target: es2015
// @declaration: true
function foo<T > (x: T) { return x; }

var x = foo<number>(5); // 'x' should be number

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
