/*---
description: Ported from TypeScript's tests/cases/compiler/staticMemberAccessOffDerivedType1.ts.
outcome: success
source: tests/cases/compiler/staticMemberAccessOffDerivedType1.ts
---*/
// @target: es2015
class SomeBase {
    static GetNumber() {
        return 2;
    }
}
class P extends SomeBase {
    static SomeNumber = P.GetNumber();
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
