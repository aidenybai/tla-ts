/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/ConstructorDeclarations/parserConstructorDeclaration5.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/ConstructorDeclarations/parserConstructorDeclaration5.ts
---*/
// @target: es2015
class C {
  private constructor() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
