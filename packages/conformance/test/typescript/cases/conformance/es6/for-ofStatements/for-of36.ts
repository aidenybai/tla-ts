/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of36.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of36.ts
---*/
﻿//@target: ES6
var tuple: [string, boolean] = ["", true];
for (var v of tuple) {
    v;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
