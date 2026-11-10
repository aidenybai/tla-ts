/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty23.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty23.ts
---*/
//@target: ES6
interface I {
    [Symbol.toPrimitive]: () => boolean;
}

class C implements I {
    [Symbol.toPrimitive]() {
        return true;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
