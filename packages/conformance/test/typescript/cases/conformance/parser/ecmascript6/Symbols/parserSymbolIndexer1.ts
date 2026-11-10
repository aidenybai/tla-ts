/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolIndexer1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolIndexer1.ts
---*/
//@target: ES6
interface I {
    [s: symbol]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
