/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of13.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of13.ts
---*/
﻿//@target: ES6
var v: string;
for (v of [""].values()) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
