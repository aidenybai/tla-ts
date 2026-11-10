/*---
description: Ported from TypeScript's tests/cases/compiler/functionReturningItself.ts.
outcome: success
source: tests/cases/compiler/functionReturningItself.ts
---*/
// @target: es2015
// @declaration: true
function somefn() {
    return somefn;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
