/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classDeclarations/classAbstractKeyword/classAbstractAsIdentifier.ts.
outcome: success
source: tests/cases/conformance/classes/classDeclarations/classAbstractKeyword/classAbstractAsIdentifier.ts
---*/
// @target: es2015
class abstract {
    foo() { return 1; }
}

new abstract;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
