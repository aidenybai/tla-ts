/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolProperty1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolProperty1.ts
---*/
//@target: ES5, ES2015
interface I {
    [Symbol.iterator]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
