/*---
description: Ported from TypeScript's tests/cases/conformance/controlFlow/controlFlowIteration.ts.
outcome: success
source: tests/cases/conformance/controlFlow/controlFlowIteration.ts
---*/
// @target: es2015
// @strictNullChecks: true

let cond: boolean;

function ff() {
    let x: string | undefined;
    while (true) {
        if (cond) {
            x = "";
        }
        else {
            if (x) {
                x.length;
            }
            if (x) {
                x.length;
            }
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
