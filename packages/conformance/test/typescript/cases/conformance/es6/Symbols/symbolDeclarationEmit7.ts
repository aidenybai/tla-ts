/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit7.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit7.ts
---*/
//@target: ES6
//@declaration: true
var obj: {
    [Symbol.isConcatSpreadable]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
