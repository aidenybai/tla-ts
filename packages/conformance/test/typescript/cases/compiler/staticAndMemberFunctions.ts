/*---
description: Ported from TypeScript's tests/cases/compiler/staticAndMemberFunctions.ts.
outcome: success
source: tests/cases/compiler/staticAndMemberFunctions.ts
---*/
// @target: es2015
class T {
    static x() { }
    public y() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
