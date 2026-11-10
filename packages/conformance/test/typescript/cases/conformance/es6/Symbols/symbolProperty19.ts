/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty19.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty19.ts
---*/
// @strict: false
//@target: ES6
var i = {
    [Symbol.iterator]: { p: null },
    [Symbol.toStringTag]() { return { p: undefined }; }
}

var it = i[Symbol.iterator];
var str = i[Symbol.toStringTag]();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
