/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolProperty9.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolProperty9.ts
---*/
//@target: ES5, ES2015
var x: {
    [Symbol.toPrimitive]: string
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
