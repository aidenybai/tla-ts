/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitDestructuringArrayPattern4.ts.
outcome: success
source: tests/cases/compiler/declarationEmitDestructuringArrayPattern4.ts
---*/
// @target: es2015
// @declaration: true
var [...a5] = [1, 2, 3];
var [x14, ...a6] = [1, 2, 3];
var [x15, y15, ...a7] = [1, 2, 3];
var [x16, y16, z16, ...a8] = [1, 2, 3];

var [...a9] = [1, "hello", true];
var [x17, ...a10] = [1, "hello", true];
var [x18, y18, ...a12] = [1, "hello", true];
var [x19, y19, z19, ...a13] = [1, "hello", true];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
