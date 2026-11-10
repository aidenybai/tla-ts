/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserEnumDeclaration5.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserEnumDeclaration5.ts
---*/
// @target: es2015
enum E {
    A = 1,
    B,
    C = 2,
    D
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
