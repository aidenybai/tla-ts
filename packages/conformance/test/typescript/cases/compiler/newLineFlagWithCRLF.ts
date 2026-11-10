/*---
description: Ported from TypeScript's tests/cases/compiler/newLineFlagWithCRLF.ts.
outcome: success
source: tests/cases/compiler/newLineFlagWithCRLF.ts
---*/
// @target: es2015
// @newline: CRLF
var x=1;
x=2;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
