/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/superPropertyAccess/superSymbolIndexedAccess2.ts.
outcome: success
source: tests/cases/conformance/expressions/superPropertyAccess/superSymbolIndexedAccess2.ts
---*/
//@target: ES6

class Foo {
    [Symbol.isConcatSpreadable]() {
        return 0;
    }
}

class Bar extends Foo {
    [Symbol.isConcatSpreadable]() {
        return super[Symbol.isConcatSpreadable]();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
