/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitDestructuringArrayPattern5.ts.
outcome: success
source: tests/cases/compiler/declarationEmitDestructuringArrayPattern5.ts
---*/
// @target: es2015
// @declaration: true
var [, , z] = [1, 2, 4];
var [, a, , ] = [3, 4, 5];
var [, , [, b, ]] = [3,5,[0, 1]];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
