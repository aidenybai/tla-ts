/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classDeclarations/classInsideBlock.ts.
outcome: success
source: tests/cases/conformance/classes/classDeclarations/classInsideBlock.ts
---*/
// @target: es2015
function foo() {
    class C { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
