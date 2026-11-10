/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedAddition.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedAddition.ts
---*/
﻿// @target: es2015
var x = `abc${ 10 + 10 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
