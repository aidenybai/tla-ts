/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolProperty6.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolProperty6.ts
---*/
//@target: ES5, ES2015
class C {
    [Symbol.toStringTag]: string = "";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
