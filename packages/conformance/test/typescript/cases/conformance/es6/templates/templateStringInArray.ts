/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInArray.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInArray.ts
---*/
﻿// @target: es2015
var x = [1, 2, `abc${ 123 }def`];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
