/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/ClassDeclarations/parserClassDeclarationIndexSignature1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/ClassDeclarations/parserClassDeclarationIndexSignature1.ts
---*/
// @target: es2015
class C {
    [index:number]:number
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
