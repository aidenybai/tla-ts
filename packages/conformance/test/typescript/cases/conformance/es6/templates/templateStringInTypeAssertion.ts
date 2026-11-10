/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInTypeAssertion.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInTypeAssertion.ts
---*/
﻿// @target: es2015
var x = <any>`abc${ 123 }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
