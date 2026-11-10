/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classStaticBlock/classStaticBlock10.ts.
outcome: success
source: tests/cases/conformance/classes/classStaticBlock/classStaticBlock10.ts
---*/
// @target: esnext, es2022, es2015, es5
var a1 = 1;
var a2 = 1;
const b1 = 2;
const b2 = 2;

function f () {
    var a1 = 11;
    const b1 = 22;

    class C1 {
        static {
            var a1 = 111;
            var a2 = 111;
            const b1 = 222;
            const b2 = 222;
        }
    }
}

class C2 {
    static {
        var a1 = 111;
        var a2 = 111;
        const b1 = 222;
        const b2 = 222;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
