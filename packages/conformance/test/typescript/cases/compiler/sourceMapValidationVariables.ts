/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationVariables.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationVariables.ts
---*/
// @target: es2015
// @sourcemap: true
var a = 10;
var b;
var c = 10, d, e;
var c2, d2 = 10;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
