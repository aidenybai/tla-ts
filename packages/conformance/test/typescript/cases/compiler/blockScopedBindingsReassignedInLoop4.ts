/*---
description: Ported from TypeScript's tests/cases/compiler/blockScopedBindingsReassignedInLoop4.ts.
outcome: success
source: tests/cases/compiler/blockScopedBindingsReassignedInLoop4.ts
---*/
// @target: es2015
function f1() {
    for (let x = 1, y = 2; x < y; ++x, --y) {
        let a = () => x++ + y++;
        if (x == 1) {
            return 1;
        }
        else {
            y = 5;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
