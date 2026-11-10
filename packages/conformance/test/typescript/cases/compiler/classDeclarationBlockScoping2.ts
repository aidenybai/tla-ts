/*---
description: Ported from TypeScript's tests/cases/compiler/classDeclarationBlockScoping2.ts.
outcome: success
source: tests/cases/compiler/classDeclarationBlockScoping2.ts
---*/
// @target: es2015
function f() {
    class C {}
    var c1 = C;
    {
        class C {}
        var c2 = C;
    }
    return C === c1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
