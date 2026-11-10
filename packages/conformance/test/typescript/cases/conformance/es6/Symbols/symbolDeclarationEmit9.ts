/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit9.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit9.ts
---*/
//@target: ES6
//@declaration: true
var obj = {
    [Symbol.isConcatSpreadable]() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
