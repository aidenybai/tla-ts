/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveInferenceBug.ts.
outcome: success
source: tests/cases/compiler/recursiveInferenceBug.ts
---*/
// @target: es2015
function f(x: number) {
    var z = f(x);
    return x;
}


var zz = {
    g: () =>{ },
    get f() { return "abc"; },
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
