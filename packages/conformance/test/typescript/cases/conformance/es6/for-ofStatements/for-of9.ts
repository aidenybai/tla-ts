/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of9.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of9.ts
---*/
﻿//@target: ES6
var v: string;
for (v of ["hello"]) { }
for (v of "hello") { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
