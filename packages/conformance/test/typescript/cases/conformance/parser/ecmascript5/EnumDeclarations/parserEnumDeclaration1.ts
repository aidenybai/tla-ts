/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserEnumDeclaration1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserEnumDeclaration1.ts
---*/
// @target: es2015
enum E {
  Foo = 1,
  Bar
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
