/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/superPropertyAccess/superSymbolIndexedAccess1.ts.
outcome: success
source: tests/cases/conformance/expressions/superPropertyAccess/superSymbolIndexedAccess1.ts
---*/
//@target: ES6
var symbol = Symbol.for('myThing');

class Foo {
    [symbol]() {
        return 0;
    }
}

class Bar extends Foo {
    [symbol]() {
        return super[symbol]();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
