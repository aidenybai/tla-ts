/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classStaticBlock/classStaticBlock2.ts.
outcome: success
source: tests/cases/conformance/classes/classStaticBlock/classStaticBlock2.ts
---*/
// @target: esnext, es2022, es2015, es5

const a = 1;
const b = 2;

class C {
    static {
        const a = 11;

        a;
        b;
    }

    static {
        const a = 11;

        a;
        b;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
