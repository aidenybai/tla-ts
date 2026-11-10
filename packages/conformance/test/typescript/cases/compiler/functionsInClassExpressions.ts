/*---
description: Ported from TypeScript's tests/cases/compiler/functionsInClassExpressions.ts.
outcome: success
source: tests/cases/compiler/functionsInClassExpressions.ts
---*/
// @target: es2015
let Foo = class {
    constructor() {
        this.bar++;
    }
    bar = 0;
    inc = () => {
        this.bar++;
    }
    m() { return this.bar; }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
