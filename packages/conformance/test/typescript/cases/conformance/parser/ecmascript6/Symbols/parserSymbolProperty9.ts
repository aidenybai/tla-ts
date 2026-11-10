/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty9.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty9.ts
---*/
//@target: ES6
var x: {
    [Symbol.toPrimitive]: string
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
