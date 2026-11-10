/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedTypeOfOperator.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedTypeOfOperator.ts
---*/
﻿// @target: es2015
var x = `abc${ typeof "hi" }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
