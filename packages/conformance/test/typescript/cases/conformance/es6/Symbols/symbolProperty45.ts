/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty45.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty45.ts
---*/
//@target: ES6
class C {
    get [Symbol.hasInstance]() {
        return "";
    }
    get [Symbol.toPrimitive]() {
        return "";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
