/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty58.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty58.ts
---*/
//@target: ES6
interface SymbolConstructor {
    foo: string;
}

var obj = {
    [Symbol.foo]: 0
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
