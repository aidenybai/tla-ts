/*---
description: Ported from TypeScript's tests/cases/compiler/blockScopedBindingsReassignedInLoop2.ts.
outcome: success
source: tests/cases/compiler/blockScopedBindingsReassignedInLoop2.ts
---*/
// @target: es2015
for (let x = 1, y = 2; x < y; ++x, --y) {
    let a = () => x++ + y++;
    if (x == 1) {
        break;
    }
    else {
        y = 5;
    }
}

for (let x = 1, y = 2; x < y; ++x, --y) {
    let a = () => x++ + y++;
    if (x == 1) {
        continue;
    }
    else {
        y = 5;
    }
}

loop:
for (let x = 1, y = 2; x < y; ++x, --y) {
    let a = () => x++ + y++;
    if (x == 1) {
        break loop;
    }
    else {
        y = 5;
    }
}

loop:
for (let x = 1, y = 2; x < y; ++x, --y) {
    let a = () => x++ + y++;
    if (x == 1) {
        continue loop;
    }
    else {
        y = 5;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
