/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedMultiplicationES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedMultiplicationES6.ts
---*/
﻿// @target: ES6
var x = `abc${ 7 * 6 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
