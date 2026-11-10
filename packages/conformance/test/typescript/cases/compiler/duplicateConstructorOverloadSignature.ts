/*---
description: Ported from TypeScript's tests/cases/compiler/duplicateConstructorOverloadSignature.ts.
outcome: success
source: tests/cases/compiler/duplicateConstructorOverloadSignature.ts
---*/
// @target: es2015
class C {
    constructor(x: number);
    constructor(x: number);
    constructor(x: any) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
