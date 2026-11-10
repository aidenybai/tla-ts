/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/superPropertyAccess/superSymbolIndexedAccess6.ts.
outcome: success
source: tests/cases/conformance/expressions/superPropertyAccess/superSymbolIndexedAccess6.ts
---*/
//@target: ES5, ES2015
var symbol: any;

class Foo {
    static [symbol]() {
        return 0;
    }
}

class Bar extends Foo {
    static [symbol]() {
        return super[symbol]();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
