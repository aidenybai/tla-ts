/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of24.ts.
outcome: throws
source: tests/cases/conformance/es6/for-ofStatements/for-of24.ts
---*/
﻿//@target: ES6
var x: any;
for (var v of x) { }

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
