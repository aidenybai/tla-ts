/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolIndexer2.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolIndexer2.ts
---*/
//@target: ES6
class C {
    [s: symbol]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
