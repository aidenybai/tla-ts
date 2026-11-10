/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of41.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of41.ts
---*/
﻿//@target: ES6
var array = [{x: [0], y: {p: ""}}]
for (var {x: [a], y: {p}} of array) {
    a;
    p;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
