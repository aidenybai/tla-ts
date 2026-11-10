/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInInOperatorES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInInOperatorES6.ts
---*/
﻿// @target: ES6
var x = `${ "hi" }` in { hi: 10, hello: 20};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
