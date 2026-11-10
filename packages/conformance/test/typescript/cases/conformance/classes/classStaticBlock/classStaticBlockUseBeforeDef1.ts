/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classStaticBlock/classStaticBlockUseBeforeDef1.ts.
outcome: success
source: tests/cases/conformance/classes/classStaticBlock/classStaticBlockUseBeforeDef1.ts
---*/
// @target: esnext, es2022
// @noEmit: true
// @strict: true

class C {
    static x;
    static {
        this.x = 1;
    }
    static y = this.x;
    static z;
    static {
        this.z = this.y;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
