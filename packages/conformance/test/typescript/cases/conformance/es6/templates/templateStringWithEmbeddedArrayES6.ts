/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedArrayES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedArrayES6.ts
---*/
﻿// @target: ES6
var x = `abc${ [1,2,3] }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
