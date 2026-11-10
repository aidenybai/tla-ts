/*---
description: Ported from TypeScript's tests/cases/compiler/thisInStatics.ts.
outcome: success
source: tests/cases/compiler/thisInStatics.ts
---*/
// @target: es2015
class C {
    static f() {
        var y/*1*/ = this;
    }

    static get x() {
        var y/*2*/ = this;
        return y;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
