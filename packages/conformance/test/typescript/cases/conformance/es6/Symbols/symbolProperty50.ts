/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty50.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty50.ts
---*/
//@target: ES6
namespace M {
    interface Symbol { }

    class C {
        [Symbol.iterator]() { }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
