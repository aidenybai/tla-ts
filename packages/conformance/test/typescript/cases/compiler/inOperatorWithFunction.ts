/*---
description: Ported from TypeScript's tests/cases/compiler/inOperatorWithFunction.ts.
outcome: success
source: tests/cases/compiler/inOperatorWithFunction.ts
---*/
// @target: es2015
// @strict: false
var fn = function (val: boolean) { return val; }
fn("a" in { "a": true });

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
