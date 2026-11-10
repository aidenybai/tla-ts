/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolIndexer2.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Symbols/parserES5SymbolIndexer2.ts
---*/
//@target: ES5, ES2015
class C {
    [s: symbol]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
