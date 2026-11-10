/*---
description: Ported from TypeScript's tests/cases/compiler/thisInConstructorParameter2.ts.
outcome: success
source: tests/cases/compiler/thisInConstructorParameter2.ts
---*/
// @target: es2015
class P {
    x = this;
    static y = this;

    constructor(public z = this, zz = this, zzz = (p = this) => this) {
        zzz = (p = this) => this;
    }

    foo(zz = this) { zz.x; }
    static bar(zz = this) { zz.y; }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
