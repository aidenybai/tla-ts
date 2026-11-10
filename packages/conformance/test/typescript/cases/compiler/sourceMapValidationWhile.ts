/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationWhile.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationWhile.ts
---*/
// @target: es2015
// @sourcemap: true
var a = 10;
while (a == 10) {
    a++;
}
while (a == 10)
{
    a++;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
