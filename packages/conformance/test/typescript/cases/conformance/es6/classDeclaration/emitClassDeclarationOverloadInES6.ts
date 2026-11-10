/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classDeclaration/emitClassDeclarationOverloadInES6.ts.
outcome: success
source: tests/cases/conformance/es6/classDeclaration/emitClassDeclarationOverloadInES6.ts
---*/
﻿// @target: es6
class C {
    constructor(y: any)
    constructor(x: number) {
    }
}

class D {
    constructor(y: any)
    constructor(x: number, z="hello") {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
