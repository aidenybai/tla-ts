/*---
description: Ported from TypeScript's tests/cases/compiler/typeOfThisInStatics.ts.
outcome: success
source: tests/cases/compiler/typeOfThisInStatics.ts
---*/
// @target: es2015
class C {
    static foo() {
        var r = this;
    }
    static get x() {
        var r = this;
        return 1;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
