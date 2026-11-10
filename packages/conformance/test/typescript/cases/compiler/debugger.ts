/*---
description: Ported from TypeScript's tests/cases/compiler/debugger.ts.
outcome: success
source: tests/cases/compiler/debugger.ts
---*/
// @target: es2015
debugger;

function foo() {
    debugger;

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
