/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithStaticPropertyAssignmentInES6.ts.
outcome: success
source: tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithStaticPropertyAssignmentInES6.ts
---*/
﻿// @target:es6
class C {
    static z: string = "Foo";
}

class D {
    x = 20000;
    static b = true;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
