/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedMultiplication.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedMultiplication.ts
---*/
﻿// @target: es2015
var x = `abc${ 7 * 6 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
