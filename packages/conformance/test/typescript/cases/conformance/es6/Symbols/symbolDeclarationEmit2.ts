/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolDeclarationEmit2.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolDeclarationEmit2.ts
---*/
//@target: ES6
//@declaration: true
class C {
    [Symbol.toPrimitive] = "";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
