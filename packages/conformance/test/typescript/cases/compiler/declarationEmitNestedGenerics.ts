/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitNestedGenerics.ts.
outcome: success
source: tests/cases/compiler/declarationEmitNestedGenerics.ts
---*/
// @target: es2015
// @declaration: true
function f<T>(p: T) {
    let g: <T>(x: T) => typeof p = null as any;
    return g;
}

function g<T>(x: T) {
    let y: typeof x extends (infer T)[] ? T : typeof x = null as any;
    return y;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
