/*---
description: Ported from TypeScript's tests/cases/compiler/classDeclarationCheckUsedBeforeDefinitionInFunctionDeclaration.ts.
outcome: success
source: tests/cases/compiler/classDeclarationCheckUsedBeforeDefinitionInFunctionDeclaration.ts
---*/
// @target: es2015
function f() {
    new C2(); // OK
}    
class C2 { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
