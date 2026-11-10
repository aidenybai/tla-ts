/*---
description: Ported from TypeScript's tests/cases/compiler/randomSemicolons1.ts.
outcome: success
source: tests/cases/compiler/randomSemicolons1.ts
---*/
// @target: es2015
; ;
var a = 1;
;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
