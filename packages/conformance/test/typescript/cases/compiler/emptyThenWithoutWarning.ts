/*---
description: Ported from TypeScript's tests/cases/compiler/emptyThenWithoutWarning.ts.
outcome: success
source: tests/cases/compiler/emptyThenWithoutWarning.ts
---*/
// @target: es2015
let a = 4;

if(a === 1 || a === 2 || a === 3) {
}
else {
    let message = "Ooops";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
