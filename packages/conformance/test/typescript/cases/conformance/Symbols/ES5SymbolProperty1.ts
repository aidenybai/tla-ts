/*---
description: Ported from TypeScript's tests/cases/conformance/Symbols/ES5SymbolProperty1.ts.
outcome: throws
source: tests/cases/conformance/Symbols/ES5SymbolProperty1.ts
---*/
//@target: ES5, ES2015
interface SymbolConstructor {
    foo: string;
}
var Symbol: SymbolConstructor;

var obj = {
    [Symbol.foo]: 0
}

obj[Symbol.foo];

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
