/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithExtensionInES6.ts.
outcome: success
source: tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithExtensionInES6.ts
---*/
﻿// @target: es6
class B {
    baz(a: string, y = 10) { }
}
class C extends B {
    foo() { }
    baz(a: string, y:number) {
        super.baz(a, y);
    }
}
class D extends C {
    constructor() {
        super();
    }

    foo() {
        super.foo();
    }

    baz() {
        super.baz("hello", 10);
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
