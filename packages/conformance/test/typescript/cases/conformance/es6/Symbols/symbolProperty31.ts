/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty31.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty31.ts
---*/
//@target: ES6
class C1 {
    [Symbol.toStringTag]() {
        return { x: "" };
    }
}
class C2 extends C1 {
    [s: symbol]: () => { x: string };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
