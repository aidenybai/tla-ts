/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInUnaryPlus.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInUnaryPlus.ts
---*/
﻿// @target: es2015
var x = +`abc${ 123 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
