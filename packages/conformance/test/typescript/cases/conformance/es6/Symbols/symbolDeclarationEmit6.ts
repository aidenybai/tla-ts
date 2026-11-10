/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit6.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit6.ts
---*/
//@target: ES6
//@declaration: true
interface I {
    [Symbol.isConcatSpreadable]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
