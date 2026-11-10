/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedInOperatorES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedInOperatorES6.ts
---*/
﻿// @target: ES6
var x = `abc${ "hi" in { hi: 10, hello: 20} }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
