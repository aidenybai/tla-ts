/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classDeclarations/classDeclarationLoop.ts.
outcome: success
source: tests/cases/conformance/classes/classDeclarations/classDeclarationLoop.ts
---*/
// @target: es2015
const arr = [];
for (let i = 0; i < 10; ++i) {
    class C {
        prop = i;
    }
    arr.push(C);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
