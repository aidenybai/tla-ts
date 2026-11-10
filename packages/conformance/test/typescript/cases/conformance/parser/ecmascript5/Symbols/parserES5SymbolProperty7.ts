/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolProperty7.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolProperty7.ts
---*/
//@target: ES5, ES2015
class C {
    [Symbol.toStringTag](): void { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
