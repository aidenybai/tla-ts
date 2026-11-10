/*---
description: Ported from TypeScript's tests/cases/compiler/promiseAllOnAny01.ts.
outcome: success
source: tests/cases/compiler/promiseAllOnAny01.ts
---*/
// @target: es2015
// @noEmit: true
// @lib: es5,es2015.promise

async function foo(x: any) {
    let abc = await Promise.all(x);
    let result: any[] = abc;
    return result;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
