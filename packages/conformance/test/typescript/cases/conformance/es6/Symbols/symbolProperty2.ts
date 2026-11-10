/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty2.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty2.ts
---*/
//@target: ES6
var s = Symbol();
var x = {
    [s]: 0,
    [s]() { },
    get [s]() {
        return 0;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
