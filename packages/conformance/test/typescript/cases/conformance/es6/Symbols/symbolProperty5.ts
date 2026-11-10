/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty5.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty5.ts
---*/
//@target: ES6
var x = {
    [Symbol.iterator]: 0,
    [Symbol.toPrimitive]() { },
    get [Symbol.toStringTag]() {
        return 0;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
