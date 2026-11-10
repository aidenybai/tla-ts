/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit4.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit4.ts
---*/
//@target: ES6
//@declaration: true
class C {
    get [Symbol.toPrimitive]() { return ""; }
    set [Symbol.toPrimitive](x) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
