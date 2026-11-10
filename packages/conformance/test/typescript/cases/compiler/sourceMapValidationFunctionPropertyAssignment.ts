/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationFunctionPropertyAssignment.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationFunctionPropertyAssignment.ts
---*/
// @target: es2015
// @sourcemap: true
var x = { n() { } };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
