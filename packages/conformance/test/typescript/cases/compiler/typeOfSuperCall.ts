/*---
description: Ported from TypeScript's tests/cases/compiler/typeOfSuperCall.ts.
outcome: success
source: tests/cases/compiler/typeOfSuperCall.ts
---*/
// @target: es2015
class C {
}

class D extends C {
    constructor() {
        var x: void = super();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
