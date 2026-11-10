/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty51.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty51.ts
---*/
//@target: ES6
namespace M {
    namespace Symbol { }

    class C {
        [Symbol.iterator]() { }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
