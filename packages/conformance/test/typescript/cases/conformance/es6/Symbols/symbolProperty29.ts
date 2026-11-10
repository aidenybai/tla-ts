/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty29.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty29.ts
---*/
//@target: ES6
class C1 {
    [Symbol.toStringTag]() {
        return { x: "" };
    }
    [s: symbol]: () => { x: string };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
