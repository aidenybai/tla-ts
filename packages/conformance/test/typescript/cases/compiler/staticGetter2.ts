/*---
description: Ported from TypeScript's tests/cases/compiler/staticGetter2.ts.
outcome: success
source: tests/cases/compiler/staticGetter2.ts
---*/
// @target: es2015
// once caused stack overflow
class C {
    static x() {
        var r = this;
        return this;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
