/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedDivision.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedDivision.ts
---*/
﻿// @target: es2015
var x = `abc${ 1 / 1 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
