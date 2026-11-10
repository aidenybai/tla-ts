/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of43.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of43.ts
---*/
﻿//@target: ES6
var array = [{ x: "", y: 0 }]
for (var {x: a = "", y: b = true} of array) {
    a;
    b;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
