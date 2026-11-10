/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitInferredTypeAlias8.ts.
outcome: success
source: tests/cases/compiler/declarationEmitInferredTypeAlias8.ts
---*/
// @target: es2015
// @declaration: true

type Foo<T> = T | { x: Foo<T> };
var x: Foo<number[]>;

function returnSomeGlobalValue() {
    return x;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
