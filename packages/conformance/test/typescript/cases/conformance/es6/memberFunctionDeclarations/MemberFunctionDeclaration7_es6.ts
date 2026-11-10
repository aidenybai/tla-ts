/*---
description: Ported from TypeScript's tests/cases/conformance/es6/memberFunctionDeclarations/MemberFunctionDeclaration7_es6.ts.
outcome: success
source: tests/cases/conformance/es6/memberFunctionDeclarations/MemberFunctionDeclaration7_es6.ts
---*/
// @target: es6
class C {
   *foo<T>() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
