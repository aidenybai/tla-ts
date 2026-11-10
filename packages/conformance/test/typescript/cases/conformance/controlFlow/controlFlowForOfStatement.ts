/*---
description: Ported from TypeScript's tests/cases/conformance/controlFlow/controlFlowForOfStatement.ts.
outcome: success
source: tests/cases/conformance/controlFlow/controlFlowForOfStatement.ts
---*/
// @target: es2015
let obj: number[];
let x: string | number | boolean | RegExp;

function a() {
    x = true;
    for (x of obj) {
        x = x.toExponential();
    }
    x; // string | boolean
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
