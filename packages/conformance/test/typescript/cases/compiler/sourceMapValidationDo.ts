/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationDo.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationDo.ts
---*/
// @target: es2015
// @sourcemap: true
var i = 0;
do
{
    i++;
} while (i < 10);
do {
    i++;
} while (i < 20);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
