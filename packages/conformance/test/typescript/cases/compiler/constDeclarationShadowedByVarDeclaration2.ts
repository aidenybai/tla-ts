/*---
description: Ported from TypeScript's tests/cases/compiler/constDeclarationShadowedByVarDeclaration2.ts.
outcome: success
source: tests/cases/compiler/constDeclarationShadowedByVarDeclaration2.ts
---*/
// @target: ES6

// No errors, const declaration is not shadowed
function outer() {
    const x = 0;
    function inner() {
        var x = "inner";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
