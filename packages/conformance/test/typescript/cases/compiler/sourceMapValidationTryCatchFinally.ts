/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationTryCatchFinally.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationTryCatchFinally.ts
---*/
// @target: es2015
// @sourcemap: true
var x = 10;
try {
    x = x + 1;
} catch (e) {
    x = x - 1;
} finally {
    x = x * 10;
}
try
{
    x = x + 1;
    throw new Error();
}
catch (e)
{
    x = x - 1;
}
finally
{
    x = x * 10;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
