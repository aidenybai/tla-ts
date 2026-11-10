/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of45.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of45.ts
---*/
﻿//@target: ES6
var k: string, v: boolean;
var map = new Map([["", true]]);
for ([k = "", v = false] of map) {
    k;
    v;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
