/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithThisKeywordInES6.ts.
outcome: success
source: tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithThisKeywordInES6.ts
---*/
﻿// @target: es6
class B {
    x = 10;
    constructor() {
        this.x = 10;
    }
    static log(a: number) { }
    foo() {
        B.log(this.x);
    }

    get X() {
        return this.x;
    }

    set bX(y: number) {
        this.x = y;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
