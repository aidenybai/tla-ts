/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of28.ts.
outcome: throws
source: tests/cases/conformance/es6/for-ofStatements/for-of28.ts
---*/
﻿//@target: ES6
class MyStringIterator {
    next: any;
    [Symbol.iterator]() {
        return this;
    }
}

for (var v of new MyStringIterator) { }

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
