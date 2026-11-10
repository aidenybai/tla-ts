/*---
description: Ported from TypeScript's tests/cases/compiler/unreachableFlowAfterFinally.ts.
outcome: success
source: tests/cases/compiler/unreachableFlowAfterFinally.ts
---*/
// @target: es2015
// @noImplicitReturns: true

function f() {
    let x = 100;
    try {
        throw "WAT"
    }
    catch (e) {

    }
    finally {
        return x;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
