/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedInOperator.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedInOperator.ts
---*/
﻿// @target: es2015
var x = `abc${ "hi" in { hi: 10, hello: 20} }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
