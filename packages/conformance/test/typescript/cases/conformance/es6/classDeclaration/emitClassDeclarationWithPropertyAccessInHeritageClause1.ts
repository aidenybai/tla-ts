/*---
description: Ported from TypeScript's tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithPropertyAccessInHeritageClause1.ts.
outcome: success
source: tests/cases/conformance/es6/classDeclaration/emitClassDeclarationWithPropertyAccessInHeritageClause1.ts
---*/
// @target: es2015
class B {}
function foo() {
    return {B: B};
}
class C extends (foo()).B {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
