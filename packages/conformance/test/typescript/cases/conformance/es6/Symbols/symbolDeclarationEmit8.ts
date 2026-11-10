/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit8.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit8.ts
---*/
//@target: ES6
//@declaration: true
var obj = {
    [Symbol.isConcatSpreadable]: 0
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
