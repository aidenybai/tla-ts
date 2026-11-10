/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInTypeOfES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInTypeOfES6.ts
---*/
﻿// @target: ES6
var x = typeof `abc${ 123 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
