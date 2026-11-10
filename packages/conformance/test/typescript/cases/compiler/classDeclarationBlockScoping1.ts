/*---
description: Ported from TypeScript's tests/cases/compiler/classDeclarationBlockScoping1.ts.
outcome: success
source: tests/cases/compiler/classDeclarationBlockScoping1.ts
---*/
// @target: es2015
class C {
}

{
    class C {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
