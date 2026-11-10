/*---
description: Ported from TypeScript's tests/cases/compiler/declFileForVarList.ts.
outcome: success
source: tests/cases/compiler/declFileForVarList.ts
---*/
// @target: es2015
// @declaration: true

var x, y, z = 1;
var x1 = 1, y2 = 2, z2 = 3;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
