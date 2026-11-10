/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/IndexMemberDeclarations/parserIndexMemberDeclaration6.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/IndexMemberDeclarations/parserIndexMemberDeclaration6.ts
---*/
// @target: es2015
class C {
   static [x: string]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
