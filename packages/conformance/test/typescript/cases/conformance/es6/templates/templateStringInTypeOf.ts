/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInTypeOf.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInTypeOf.ts
---*/
﻿// @target: es2015
var x = typeof `abc${ 123 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
