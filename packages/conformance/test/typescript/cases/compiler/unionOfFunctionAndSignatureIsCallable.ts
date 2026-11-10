/*---
description: Ported from TypeScript's tests/cases/compiler/unionOfFunctionAndSignatureIsCallable.ts.
outcome: success
source: tests/cases/compiler/unionOfFunctionAndSignatureIsCallable.ts
---*/
// @target: es2015
function f1(c1: Function, c2: () => object,  callable: typeof c1 | typeof c2) {
    const a = c1();
    const b = c2();
    const c = callable();
}

function f2(fetcherParams: object | (() => object)) {
    const data = typeof fetcherParams === 'function'
        ? fetcherParams()
        : fetcherParams
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
