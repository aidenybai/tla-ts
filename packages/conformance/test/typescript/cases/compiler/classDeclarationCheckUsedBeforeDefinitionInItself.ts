/*---
description: Ported from TypeScript's tests/cases/compiler/classDeclarationCheckUsedBeforeDefinitionInItself.ts.
outcome: success
source: tests/cases/compiler/classDeclarationCheckUsedBeforeDefinitionInItself.ts
---*/
// @target: es6
class C3 { 
    static intance = new C3();  // ok
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
