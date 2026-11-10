/*---
description: Ported from TypeScript's tests/cases/compiler/blockScopedBindingsReassignedInLoop5.ts.
outcome: success
source: tests/cases/compiler/blockScopedBindingsReassignedInLoop5.ts
---*/
// @target: es2015
for (let x = 1, y = 2; x < y; ++x, --y) {
    let a = () => x++ + y++;
    if (x == 1) 
        break;
    else 
        y = 5;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
