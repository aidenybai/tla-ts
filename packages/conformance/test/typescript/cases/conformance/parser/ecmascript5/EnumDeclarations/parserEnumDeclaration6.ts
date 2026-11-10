/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserEnumDeclaration6.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserEnumDeclaration6.ts
---*/
// @target: es2015
enum E {
    A = 1,
    B,
    C = 1 << 1,
    D,
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
