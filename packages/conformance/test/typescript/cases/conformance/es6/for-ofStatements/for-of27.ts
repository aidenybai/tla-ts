/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of27.ts.
outcome: throws
source: tests/cases/conformance/es6/for-ofStatements/for-of27.ts
---*/
﻿//@target: ES6
class MyStringIterator {
    [Symbol.iterator]: any;
}

for (var v of new MyStringIterator) { }

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
