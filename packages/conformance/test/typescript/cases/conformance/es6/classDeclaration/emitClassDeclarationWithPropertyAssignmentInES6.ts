/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithPropertyAssignmentInES6.ts.
outcome: success
source: tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithPropertyAssignmentInES6.ts
---*/
﻿// @target:es6
class C {
    x: string = "Hello world";
}

class D {
    x: string = "Hello world";
    y: number;
    constructor() {
        this.y = 10;
    }
}

class E extends D{
    z: boolean = true;
}

class F extends D{
    z: boolean = true;
    j: string;
    constructor() {
        super();
        this.j = "HI";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
