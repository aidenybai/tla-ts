/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithExtensionAndTypeArgumentInES6.ts.
outcome: success
source: tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithExtensionAndTypeArgumentInES6.ts
---*/
﻿// @target: es6
class B<T> {
    constructor(a: T) { }
}
class C extends B<string> { }
class D extends B<number> {
    constructor(a: any)
    constructor(b: number) {
        super(b);
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
