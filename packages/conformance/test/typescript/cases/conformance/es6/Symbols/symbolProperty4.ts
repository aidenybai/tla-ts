/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty4.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty4.ts
---*/
//@target: ES6
var x = {
    [Symbol()]: 0,
    [Symbol()]() { },
    get [Symbol()]() {
        return 0;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
