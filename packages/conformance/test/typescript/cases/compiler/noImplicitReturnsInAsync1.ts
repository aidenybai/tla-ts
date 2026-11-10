/*---
description: Ported from TypeScript's tests/cases/compiler/noImplicitReturnsInAsync1.ts.
outcome: success
source: tests/cases/compiler/noImplicitReturnsInAsync1.ts
---*/
// @target: es6
// @noImplicitReturns: true

async function test(isError: boolean = false) {
    if (isError === true) {
        return;
    }
    let x = await Promise.resolve("The test is passed without an error.");
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
