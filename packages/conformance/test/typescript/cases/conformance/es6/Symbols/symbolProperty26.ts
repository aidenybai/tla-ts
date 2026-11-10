/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty26.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty26.ts
---*/
//@target: ES6
class C1 {
    [Symbol.toStringTag]() {
        return "";
    }
}

class C2 extends C1 {
    [Symbol.toStringTag]() {
        return "";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
