/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/IndexMemberDeclarations/parserIndexMemberDeclaration1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/IndexMemberDeclarations/parserIndexMemberDeclaration1.ts
---*/
// @target: es2015
class C {
   [a: string]: number
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
