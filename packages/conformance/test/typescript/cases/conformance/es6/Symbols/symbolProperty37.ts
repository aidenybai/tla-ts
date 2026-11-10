/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty37.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty37.ts
---*/
//@target: ES6
interface I {
    [Symbol.isConcatSpreadable]: string;
    [Symbol.isConcatSpreadable]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
