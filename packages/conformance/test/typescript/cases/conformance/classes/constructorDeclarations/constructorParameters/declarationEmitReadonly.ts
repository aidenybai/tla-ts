/*---
description: Ported from TypeScript's tests/cases/conformance/classes/constructorDeclarations/constructorParameters/declarationEmitReadonly.ts.
outcome: success
source: tests/cases/conformance/classes/constructorDeclarations/constructorParameters/declarationEmitReadonly.ts
---*/
// @target: es2015
// @declaration: true

class C {
    constructor(readonly x: number) {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
