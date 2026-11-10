/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit11.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit11.ts
---*/
//@target: ES6
//@declaration: true
class C {
    static [Symbol.iterator] = 0;
    static [Symbol.isConcatSpreadable]() { }
    static get [Symbol.toPrimitive]() { return ""; }
    static set [Symbol.toPrimitive](x) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
