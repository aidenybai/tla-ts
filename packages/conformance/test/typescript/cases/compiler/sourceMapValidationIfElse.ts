/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationIfElse.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationIfElse.ts
---*/
// @target: es2015
// @sourcemap: true
var i = 10;
if (i == 10) {
    i++;
} else
{
}
if (i == 10)
{
    i++;
}
else if (i == 20) {
    i--;
} else if (i == 30) {
    i += 70;
} else {
    i--;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
