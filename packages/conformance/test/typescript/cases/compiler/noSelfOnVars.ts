/*---
description: Ported from TypeScript's tests/cases/compiler/noSelfOnVars.ts.
outcome: success
source: tests/cases/compiler/noSelfOnVars.ts
---*/
// @target: es2015
function foo() {
    function bar() { }
    var x = bar;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
