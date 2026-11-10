/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInConditionalES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInConditionalES6.ts
---*/
﻿// @target: ES6
var x = `abc${ " " }def` ? `abc${ " " }def` : `abc${ " " }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
