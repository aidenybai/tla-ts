/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty6.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty6.ts
---*/
//@target: ES6
class C {
    [Symbol.toStringTag]: string = "";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
