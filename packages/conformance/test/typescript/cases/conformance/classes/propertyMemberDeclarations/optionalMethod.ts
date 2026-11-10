/*---
description: Ported from TypeScript's tests/cases/conformance/classes/propertyMemberDeclarations/optionalMethod.ts.
outcome: success
source: tests/cases/conformance/classes/propertyMemberDeclarations/optionalMethod.ts
---*/
// @target: esnext
// @noTypesAndSymbols: true
class Base {
    method?() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
