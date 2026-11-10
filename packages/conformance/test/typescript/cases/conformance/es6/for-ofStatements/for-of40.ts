/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of40.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of40.ts
---*/
﻿//@target: ES6
var map = new Map([["", true]]);
for (var [k = "", v = false] of map) {
    k;
    v;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
