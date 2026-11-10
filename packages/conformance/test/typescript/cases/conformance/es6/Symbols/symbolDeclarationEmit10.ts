/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit10.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit10.ts
---*/
//@target: ES6
//@declaration: true
var obj = {
    get [Symbol.isConcatSpreadable]() { return '' },
    set [Symbol.isConcatSpreadable](x) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
