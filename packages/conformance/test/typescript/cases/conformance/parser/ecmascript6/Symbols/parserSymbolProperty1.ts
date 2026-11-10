/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty1.ts
---*/
//@target: ES6
interface I {
    [Symbol.iterator]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
