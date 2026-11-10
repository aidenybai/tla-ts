/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classStaticBlock/classStaticBlock5.ts.
outcome: success
source: tests/cases/conformance/classes/classStaticBlock/classStaticBlock5.ts
---*/
// @target: esnext, es2022, es2015, es5

class B {
    static a = 1;
    static b = 2;
}

class C extends B {
    static b = 3;
    static c = super.a

    static {
        this.b;
        super.b;
        super.a;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
