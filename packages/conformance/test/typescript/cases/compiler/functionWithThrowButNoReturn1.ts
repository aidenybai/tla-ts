/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithThrowButNoReturn1.ts.
outcome: success
source: tests/cases/compiler/functionWithThrowButNoReturn1.ts
---*/
// @target: es2015
function fn(): number {
  throw new Error('NYI');
  var t;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
