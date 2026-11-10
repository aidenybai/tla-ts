/*---
description: Ported from TypeScript's tests/cases/compiler/asyncIIFE.ts.
outcome: success
source: tests/cases/compiler/asyncIIFE.ts
---*/
// @target: ES6

function f1() {
    (async () => {
        await 10
        throw new Error();
    })();

    var x = 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
