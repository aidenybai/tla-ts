/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of37.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of37.ts
---*/
﻿//@target: ES6
var map = new Map([["", true]]);
for (var v of map) {
    v;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
