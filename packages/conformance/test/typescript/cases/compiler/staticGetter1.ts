/*---
description: Ported from TypeScript's tests/cases/compiler/staticGetter1.ts.
outcome: success
source: tests/cases/compiler/staticGetter1.ts
---*/
// @target: es2015
// once caused stack overflow
class C {
    static get x() {
        return this;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
