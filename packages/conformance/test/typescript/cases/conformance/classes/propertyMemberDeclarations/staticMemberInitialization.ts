/*---
description: Ported from TypeScript's tests/cases/conformance/classes/propertyMemberDeclarations/staticMemberInitialization.ts.
outcome: success
source: tests/cases/conformance/classes/propertyMemberDeclarations/staticMemberInitialization.ts
---*/
// @target: es2015
class C {
    static x = 1;
}

var c = new C();
var r = C.x;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
