/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithNoBestCommonType2.ts.
outcome: success
source: tests/cases/compiler/functionWithNoBestCommonType2.ts
---*/
// @target: es2015
// @allowUnreachableCode: true

var v = function () {
   return true;
   return bar();
};

function bar(): void {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
