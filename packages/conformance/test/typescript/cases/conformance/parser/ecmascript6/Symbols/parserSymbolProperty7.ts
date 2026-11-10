/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty7.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty7.ts
---*/
//@target: ES6
class C {
    [Symbol.toStringTag](): void { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
