/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classStaticBlock/classStaticBlock1.ts.
outcome: success
source: tests/cases/conformance/classes/classStaticBlock/classStaticBlock1.ts
---*/
// @target: esnext, es2022, es2015, es5
const a = 2;

class C {
    static {
        const a = 1;

        a;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
