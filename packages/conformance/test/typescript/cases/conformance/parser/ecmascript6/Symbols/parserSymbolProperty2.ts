/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty2.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Symbols/parserSymbolProperty2.ts
---*/
//@target: ES6
interface I {
    [Symbol.unscopables](): string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
