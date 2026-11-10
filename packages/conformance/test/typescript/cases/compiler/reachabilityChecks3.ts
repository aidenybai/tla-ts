/*---
description: Ported from TypeScript's tests/cases/compiler/reachabilityChecks3.ts.
outcome: success
source: tests/cases/compiler/reachabilityChecks3.ts
---*/
// @target: es2015
// @allowUnusedLabels: false

let x = 1;
loop: while (true) {
    if (x == 100) {
        break;
    }
    else {
        x++;
    }
}
{
    x: 100
}

var y = () => { f: 1 }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
