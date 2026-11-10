/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolIndexer4.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolIndexer4.ts
---*/
//@target: ES6
var x: {
    [s: symbol]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
