/*---
description: Ported from TypeScript's tests/cases/compiler/doWhileLoop.ts.
outcome: success
source: tests/cases/compiler/doWhileLoop.ts
---*/
// @target: es2015
do { } while (false);
var n;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
