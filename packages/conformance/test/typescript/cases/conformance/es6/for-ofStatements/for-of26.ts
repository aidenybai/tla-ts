/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of26.ts.
outcome: throws
source: tests/cases/conformance/es6/for-ofStatements/for-of26.ts
---*/
﻿//@target: ES6
class MyStringIterator {
    next() {
        return x;
    }
    [Symbol.iterator]() {
        return this;
    }
}

var x: any;
for (var v of new MyStringIterator) { }

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
