/*---
description: Ported from TypeScript's tests/cases/conformance/Symbols/ES5SymbolProperty6.ts.
outcome: success
source: tests/cases/conformance/Symbols/ES5SymbolProperty6.ts
---*/
//@target: ES5, ES2015
class C {
    [Symbol.iterator]() { }
}

(new C)[Symbol.iterator]

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
