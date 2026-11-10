/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit14.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit14.ts
---*/
//@target: ES6
//@declaration: true
class C {
    get [Symbol.toPrimitive]() { return ""; }
    get [Symbol.toStringTag]() { return ""; }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
