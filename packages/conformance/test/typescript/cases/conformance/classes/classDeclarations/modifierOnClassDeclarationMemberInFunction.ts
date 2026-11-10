/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classDeclarations/modifierOnClassDeclarationMemberInFunction.ts.
outcome: success
source: tests/cases/conformance/classes/classDeclarations/modifierOnClassDeclarationMemberInFunction.ts
---*/
﻿// @target: es2015
// @declaration: true

function f() {
    class C {
        public baz = 1;
        static foo() { }
        public bar() { }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
