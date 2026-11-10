/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of50.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of50.ts
---*/
﻿//@target: ES6
var map = new Map([["", true]]);
for (const [k, v] of map) {
    k;
    v;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
