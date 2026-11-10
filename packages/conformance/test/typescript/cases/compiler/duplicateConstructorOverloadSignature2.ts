/*---
description: Ported from TypeScript's tests/cases/compiler/duplicateConstructorOverloadSignature2.ts.
outcome: success
source: tests/cases/compiler/duplicateConstructorOverloadSignature2.ts
---*/
// @target: es2015
class C<T> {
    constructor(x: T);
    constructor(x: T);
    constructor(x: any) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
