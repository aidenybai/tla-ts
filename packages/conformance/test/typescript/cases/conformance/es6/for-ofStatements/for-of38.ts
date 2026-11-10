/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of38.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of38.ts
---*/
﻿//@target: ES6
var map = new Map([["", true]]);
for (var [k, v] of map) {
    k;
    v;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
