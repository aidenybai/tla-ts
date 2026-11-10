/*---
description: Ported from TypeScript's tests/cases/compiler/newLineFlagWithLF.ts.
outcome: success
source: tests/cases/compiler/newLineFlagWithLF.ts
---*/
// @target: es2015
// @newline: LF
var x=1;
x=2;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
