/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithSuperMethodCall01.ts.
outcome: success
source: tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithSuperMethodCall01.ts
---*/
﻿//@target: es6

class Parent {
    foo() {
    }
}

class Foo extends Parent {
    foo() {
        var x = () => super.foo();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
