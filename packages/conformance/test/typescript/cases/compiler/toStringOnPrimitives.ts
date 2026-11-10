/*---
description: Ported from TypeScript's tests/cases/compiler/toStringOnPrimitives.ts.
outcome: success
source: tests/cases/compiler/toStringOnPrimitives.ts
---*/
// @target: es2015
true.toString()
var aBool = false;
aBool.toString();
1..toString();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
