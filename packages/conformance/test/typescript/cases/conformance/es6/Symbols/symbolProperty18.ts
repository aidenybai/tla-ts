/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty18.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty18.ts
---*/
//@target: ES6
var i = {
    [Symbol.iterator]: 0,
    [Symbol.toStringTag]() { return "" },
    set [Symbol.toPrimitive](p: boolean) { }
}

var it = i[Symbol.iterator];
var str = i[Symbol.toStringTag]();
i[Symbol.toPrimitive] = false;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
