/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty38.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty38.ts
---*/
//@target: ES6
interface I {
    [Symbol.isConcatSpreadable]: string;
}
interface I {
    [Symbol.isConcatSpreadable]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
