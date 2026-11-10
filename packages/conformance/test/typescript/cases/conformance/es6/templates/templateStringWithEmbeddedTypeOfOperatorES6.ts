/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedTypeOfOperatorES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedTypeOfOperatorES6.ts
---*/
﻿// @target: ES6
var x = `abc${ typeof "hi" }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
