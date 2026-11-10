/*---
description: Ported from TypeScript's tests/cases/conformance/controlFlow/controlFlowElementAccess.ts.
outcome: success
source: tests/cases/conformance/controlFlow/controlFlowElementAccess.ts
---*/
// @target: es2015
let x: { o: boolean } = { o: false }
if (x['o'] === false) {
    x['o'] = true
}

const y: [number, number] = [0, 0];
if (y[0] === 0) {
    y[0] = -1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
