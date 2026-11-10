/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolIndexer3.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolIndexer3.ts
---*/
//@target: ES6
class C {
    static [s: symbol]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
