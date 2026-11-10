/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedAdditionES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedAdditionES6.ts
---*/
﻿// @target: ES6
var x = `abc${ 10 + 10 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
