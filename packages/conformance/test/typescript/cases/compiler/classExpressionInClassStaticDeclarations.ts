/*---
description: Ported from TypeScript's tests/cases/compiler/classExpressionInClassStaticDeclarations.ts.
outcome: success
source: tests/cases/compiler/classExpressionInClassStaticDeclarations.ts
---*/
// @target: es2015
// @declaration: true
class C {
    static D = class extends C {};
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
